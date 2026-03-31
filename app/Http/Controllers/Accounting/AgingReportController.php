<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\CurrentAccount;
use App\Models\Invoice;
use App\Models\Collection;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AgingReportController extends Controller
{
    /**
     * Display aging report for receivables and payables
     */
    public function index(Request $request)
    {
        $reportType = $request->get('type', 'receivables'); // receivables or payables
        $asOfDate = $request->get('as_of_date', now()->format('Y-m-d'));
        $accountType = $request->get('account_type', 'all'); // customer, supplier, or all
        $selectedAccountId = $request->get('account_id', null);

        // Parse the as of date
        $asOfDate = Carbon::parse($asOfDate);

        // Get aging data
        $agingData = $this->calculateAgingData($reportType, $asOfDate, $accountType, $selectedAccountId);

        // Get accounts for filter
        $accounts = CurrentAccount::where('is_active', true)
            ->when($accountType, function($query, $accountType) {
                if ($accountType !== 'all') {
                    $query->where('account_type', $accountType);
                }
            })
            ->orderBy('title')
            ->get(['id', 'title', 'account_type']);

        // Calculate summary statistics
        $summary = $this->calculateSummary($agingData);

        return Inertia::render('Accounting/AgingReport/Index', [
            'agingData' => $agingData,
            'summary' => $summary,
            'accounts' => $accounts,
            'filters' => [
                'type' => $reportType,
                'as_of_date' => $asOfDate->format('Y-m-d'),
                'account_type' => $accountType,
                'account_id' => $selectedAccountId,
            ]
        ]);
    }

    /**
     * Calculate aging data for accounts
     */
    private function calculateAgingData(string $reportType, Carbon $asOfDate, ?string $accountType, ?int $selectedAccountId)
    {
        $query = CurrentAccount::where('is_active', true);

        // Filter by account type
        if (!empty($accountType) && $accountType !== 'all') {
            $query->where('account_type', $accountType);
        }

        // Filter by specific account
        if (!empty($selectedAccountId)) {
            $query->where('id', $selectedAccountId);
        }

        $accounts = $query->get();

        $agingData = [];

        foreach ($accounts as $account) {
            $aging = [
                'account_id' => $account->id,
                'account_code' => $account->account_code,
                'account_name' => $account->title,
                'account_type' => $account->account_type,
                'total' => 0,
                'current' => 0,      // 0-30 days
                'period_1' => 0,      // 31-60 days
                'period_2' => 0,      // 61-90 days
                'period_3' => 0,      // 91-120 days
                'over_120' => 0,      // > 120 days
            ];

            if ($reportType === 'receivables') {
                // Calculate receivables (Alacaklar)
                $this->calculateReceivables($account, $asOfDate, $aging);
            } else {
                // Calculate payables (Borçlar)
                $this->calculatePayables($account, $asOfDate, $aging);
            }

            // Only include accounts with balances
            if ($aging['total'] != 0) {
                $agingData[] = $aging;
            }
        }

        // Sort by total descending
        usort($agingData, function($a, $b) {
            return $b['total'] <=> $a['total'];
        });

        return $agingData;
    }

    /**
     * Calculate receivables aging for an account
     */
    private function calculateReceivables(CurrentAccount $account, Carbon $asOfDate, array &$aging)
    {
        // Get unpaid invoices
        $invoices = Invoice::where('current_account_id', $account->id)
            ->where('invoice_date', '<=', $asOfDate)
            ->where('remaining_amount', '>', 0)
            ->get();

        foreach ($invoices as $invoice) {
            $remainingAmount = $invoice->remaining_amount;

            if ($remainingAmount > 0) {
                $dueDate = Carbon::parse($invoice->due_date);
                $daysOverdue = $asOfDate->diffInDays($dueDate, false);

                $aging['total'] += $remainingAmount;

                if ($daysOverdue >= 0) {
                    // Not yet due or 0-30 days overdue
                    $aging['current'] += $remainingAmount;
                } elseif ($daysOverdue >= -60) {
                    // 31-60 days overdue
                    $aging['period_1'] += $remainingAmount;
                } elseif ($daysOverdue >= -90) {
                    // 61-90 days overdue
                    $aging['period_2'] += $remainingAmount;
                } elseif ($daysOverdue >= -120) {
                    // 91-120 days overdue
                    $aging['period_3'] += $remainingAmount;
                } else {
                    // Over 120 days overdue
                    $aging['over_120'] += $remainingAmount;
                }
            }
        }

        // Get uncollected collections
        $collections = Collection::where('current_account_id', $account->id)
            ->where('collection_date', '<=', $asOfDate)
            ->where('status', '!=', 'collected')
            ->get();

        foreach ($collections as $collection) {
            $dueDate = Carbon::parse($collection->due_date);
            $daysOverdue = $asOfDate->diffInDays($dueDate, false);

            $aging['total'] += $collection->amount;

            if ($daysOverdue >= 0) {
                $aging['current'] += $collection->amount;
            } elseif ($daysOverdue >= -60) {
                $aging['period_1'] += $collection->amount;
            } elseif ($daysOverdue >= -90) {
                $aging['period_2'] += $collection->amount;
            } elseif ($daysOverdue >= -120) {
                $aging['period_3'] += $collection->amount;
            } else {
                $aging['over_120'] += $collection->amount;
            }
        }
    }

    /**
     * Calculate payables aging for an account
     */
    private function calculatePayables(CurrentAccount $account, Carbon $asOfDate, array &$aging)
    {
        // Get unpaid purchase invoices (if you have a purchase invoice model)
        // For now, we'll use payments

        $payments = Payment::where('current_account_id', $account->id)
            ->where('payment_date', '<=', $asOfDate)
            ->where('status', '!=', 'paid')
            ->get();

        foreach ($payments as $payment) {
            $dueDate = Carbon::parse($payment->due_date);
            $daysOverdue = $asOfDate->diffInDays($dueDate, false);

            $aging['total'] += $payment->amount;

            if ($daysOverdue >= 0) {
                $aging['current'] += $payment->amount;
            } elseif ($daysOverdue >= -60) {
                $aging['period_1'] += $payment->amount;
            } elseif ($daysOverdue >= -90) {
                $aging['period_2'] += $payment->amount;
            } elseif ($daysOverdue >= -120) {
                $aging['period_3'] += $payment->amount;
            } else {
                $aging['over_120'] += $payment->amount;
            }
        }
    }

    /**
     * Calculate summary statistics
     */
    private function calculateSummary(array $agingData): array
    {
        $summary = [
            'total_accounts' => count($agingData),
            'total_amount' => 0,
            'current' => 0,
            'period_1' => 0,
            'period_2' => 0,
            'period_3' => 0,
            'over_120' => 0,
        ];

        foreach ($agingData as $data) {
            $summary['total_amount'] += $data['total'];
            $summary['current'] += $data['current'];
            $summary['period_1'] += $data['period_1'];
            $summary['period_2'] += $data['period_2'];
            $summary['period_3'] += $data['period_3'];
            $summary['over_120'] += $data['over_120'];
        }

        // Calculate percentages
        if ($summary['total_amount'] > 0) {
            $summary['current_percent'] = ($summary['current'] / $summary['total_amount']) * 100;
            $summary['period_1_percent'] = ($summary['period_1'] / $summary['total_amount']) * 100;
            $summary['period_2_percent'] = ($summary['period_2'] / $summary['total_amount']) * 100;
            $summary['period_3_percent'] = ($summary['period_3'] / $summary['total_amount']) * 100;
            $summary['over_120_percent'] = ($summary['over_120'] / $summary['total_amount']) * 100;
        } else {
            $summary['current_percent'] = 0;
            $summary['period_1_percent'] = 0;
            $summary['period_2_percent'] = 0;
            $summary['period_3_percent'] = 0;
            $summary['over_120_percent'] = 0;
        }

        return $summary;
    }

    /**
     * Export aging report
     */
    public function export(Request $request)
    {
        // TODO: Implement Excel export
        return back()->with('info', 'Excel export özelliği yakında eklenecek.');
    }
}
