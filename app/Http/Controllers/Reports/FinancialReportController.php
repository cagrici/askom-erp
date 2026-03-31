<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\SalesOrder;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\CurrentAccount;
use App\Models\CurrentAccountTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class FinancialReportController extends Controller
{
    /**
     * Display the financial reports dashboard
     */
    public function index(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        // Summary statistics
        $summary = $this->getSummaryStats($startDate, $endDate);

        // Monthly cash flow
        $monthlyCashFlow = $this->getMonthlyCashFlow($startDate, $endDate);

        // Aging summary
        $agingSummary = $this->getAgingSummary();

        // Overdue receivables
        $overdueReceivables = $this->getOverdueReceivables(10);

        return Inertia::render('Reports/Financial/Index', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'summary' => $summary,
            'monthlyCashFlow' => $monthlyCashFlow,
            'agingSummary' => $agingSummary,
            'overdueReceivables' => $overdueReceivables,
        ]);
    }

    /**
     * Cash flow report
     */
    public function cashFlow(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        // Daily cash flow
        $dailyCashFlow = $this->getDailyCashFlow($startDate, $endDate);

        // Inflows by source
        $inflowsBySource = $this->getInflowsBySource($startDate, $endDate);

        // Outflows by category
        $outflowsByCategory = $this->getOutflowsByCategory($startDate, $endDate);

        return Inertia::render('Reports/Financial/CashFlow', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'dailyCashFlow' => $dailyCashFlow,
            'inflowsBySource' => $inflowsBySource,
            'outflowsByCategory' => $outflowsByCategory,
        ]);
    }

    /**
     * Accounts receivable report
     */
    public function accountsReceivable(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        $receivables = CurrentAccount::where('account_type', 'customer')
            ->where('current_balance', '>', 0)
            ->select(
                'id',
                'account_code',
                'title',
                'current_balance',
                'credit_limit',
                'payment_term_days'
            )
            ->orderByDesc('current_balance')
            ->paginate(50);

        // Aging breakdown
        $agingBreakdown = $this->getReceivableAging();

        // Collection trend
        $collectionTrend = $this->getCollectionTrend($startDate, $endDate);

        return Inertia::render('Reports/Financial/AccountsReceivable', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'receivables' => $receivables,
            'agingBreakdown' => $agingBreakdown,
            'collectionTrend' => $collectionTrend,
        ]);
    }

    /**
     * Accounts payable report
     */
    public function accountsPayable(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        $payables = CurrentAccount::where('account_type', 'supplier')
            ->where('current_balance', '<', 0)
            ->select(
                'id',
                'account_code',
                'title',
                DB::raw('ABS(current_balance) as balance'),
                'payment_term_days'
            )
            ->orderByDesc(DB::raw('ABS(current_balance)'))
            ->paginate(50);

        // Aging breakdown
        $agingBreakdown = $this->getPayableAging();

        // Payment schedule
        $paymentSchedule = $this->getPaymentSchedule($startDate, $endDate);

        return Inertia::render('Reports/Financial/AccountsPayable', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'payables' => $payables,
            'agingBreakdown' => $agingBreakdown,
            'paymentSchedule' => $paymentSchedule,
        ]);
    }

    /**
     * Profit margin report
     */
    public function profitMargin(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        // Monthly profit margins
        $monthlyMargins = $this->getMonthlyProfitMargins($startDate, $endDate);

        // Product margins
        $productMargins = $this->getProductMargins($startDate, $endDate);

        // Category margins
        $categoryMargins = $this->getCategoryMargins($startDate, $endDate);

        return Inertia::render('Reports/Financial/ProfitMargin', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'monthlyMargins' => $monthlyMargins,
            'productMargins' => $productMargins,
            'categoryMargins' => $categoryMargins,
        ]);
    }

    // Helper methods
    private function getSummaryStats($startDate, $endDate)
    {
        $totalReceivables = CurrentAccount::where('account_type', 'customer')
            ->where('current_balance', '>', 0)
            ->sum('current_balance') ?? 0;

        $totalPayables = CurrentAccount::where('account_type', 'supplier')
            ->where('current_balance', '<', 0)
            ->sum(DB::raw('ABS(current_balance)')) ?? 0;

        $netPosition = $totalReceivables - $totalPayables;

        // Use SalesOrder instead of Invoice for total invoiced
        $totalInvoiced = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->sum('total_amount') ?? 0;

        $totalCollected = CurrentAccountTransaction::whereBetween('transaction_date', [$startDate, $endDate])
            ->where('transaction_type', 'credit')
            ->sum('amount') ?? 0;

        $collectionRate = $totalInvoiced > 0 ? ($totalCollected / $totalInvoiced) * 100 : 0;

        return [
            'total_receivables' => $totalReceivables,
            'total_payables' => $totalPayables,
            'net_position' => $netPosition,
            'collection_rate' => round($collectionRate, 2),
        ];
    }

    private function getMonthlyCashFlow($startDate, $endDate)
    {
        $months = [];
        $current = $startDate->copy()->startOfMonth();

        while ($current <= $endDate) {
            $monthEnd = $current->copy()->endOfMonth();
            if ($monthEnd > $endDate) {
                $monthEnd = $endDate;
            }

            $inflow = CurrentAccountTransaction::whereBetween('transaction_date', [$current, $monthEnd])
                ->where('transaction_type', 'credit')
                ->sum('amount') ?? 0;

            $outflow = CurrentAccountTransaction::whereBetween('transaction_date', [$current, $monthEnd])
                ->where('transaction_type', 'debit')
                ->sum('amount') ?? 0;

            $expenses = Expense::whereBetween('expense_date', [$current, $monthEnd])
                ->where('status', 'paid')
                ->sum('amount') ?? 0;

            $months[] = [
                'month' => $current->format('Y-m'),
                'inflow' => $inflow,
                'outflow' => $outflow + $expenses,
                'net' => $inflow - ($outflow + $expenses),
            ];

            $current->addMonth();
        }

        return $months;
    }

    private function getAgingSummary()
    {
        $today = Carbon::now();

        return [
            'current' => CurrentAccount::where('account_type', 'customer')
                ->where('current_balance', '>', 0)
                ->whereRaw('DATEDIFF(?, COALESCE(last_transaction_date, created_at)) <= 30', [$today])
                ->sum('current_balance') ?? 0,
            'days_31_60' => CurrentAccount::where('account_type', 'customer')
                ->where('current_balance', '>', 0)
                ->whereRaw('DATEDIFF(?, COALESCE(last_transaction_date, created_at)) BETWEEN 31 AND 60', [$today])
                ->sum('current_balance') ?? 0,
            'days_61_90' => CurrentAccount::where('account_type', 'customer')
                ->where('current_balance', '>', 0)
                ->whereRaw('DATEDIFF(?, COALESCE(last_transaction_date, created_at)) BETWEEN 61 AND 90', [$today])
                ->sum('current_balance') ?? 0,
            'over_90' => CurrentAccount::where('account_type', 'customer')
                ->where('current_balance', '>', 0)
                ->whereRaw('DATEDIFF(?, COALESCE(last_transaction_date, created_at)) > 90', [$today])
                ->sum('current_balance') ?? 0,
        ];
    }

    private function getOverdueReceivables($limit)
    {
        return CurrentAccount::where('account_type', 'customer')
            ->where('current_balance', '>', 0)
            ->whereNotNull('last_transaction_date')
            ->whereRaw('DATEDIFF(NOW(), last_transaction_date) > COALESCE(payment_term_days, 30)')
            ->select('id', 'account_code', 'title', 'current_balance', 'last_transaction_date', 'payment_term_days')
            ->orderByDesc('current_balance')
            ->limit($limit)
            ->get();
    }

    private function getDailyCashFlow($startDate, $endDate)
    {
        return CurrentAccountTransaction::whereBetween('transaction_date', [$startDate, $endDate])
            ->select(
                'transaction_date',
                DB::raw("SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) as inflow"),
                DB::raw("SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END) as outflow")
            )
            ->groupBy('transaction_date')
            ->orderBy('transaction_date')
            ->get();
    }

    private function getInflowsBySource($startDate, $endDate)
    {
        return CurrentAccountTransaction::whereBetween('transaction_date', [$startDate, $endDate])
            ->where('transaction_type', 'credit')
            ->select(
                DB::raw('COALESCE(document_type, "Diger") as source'),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('source')
            ->orderByDesc('total')
            ->get();
    }

    private function getOutflowsByCategory($startDate, $endDate)
    {
        return Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->leftJoin('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->select(
                DB::raw('COALESCE(expense_categories.name, "Diğer") as category'),
                DB::raw('SUM(expenses.amount) as total')
            )
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();
    }

    private function getReceivableAging()
    {
        $today = Carbon::now();

        return [
            ['label' => '0-30 Gün', 'value' => CurrentAccount::where('account_type', 'customer')
                ->where('current_balance', '>', 0)
                ->whereRaw('DATEDIFF(?, COALESCE(last_transaction_date, created_at)) <= 30', [$today])
                ->sum('current_balance') ?? 0],
            ['label' => '31-60 Gün', 'value' => CurrentAccount::where('account_type', 'customer')
                ->where('current_balance', '>', 0)
                ->whereRaw('DATEDIFF(?, COALESCE(last_transaction_date, created_at)) BETWEEN 31 AND 60', [$today])
                ->sum('current_balance') ?? 0],
            ['label' => '61-90 Gün', 'value' => CurrentAccount::where('account_type', 'customer')
                ->where('current_balance', '>', 0)
                ->whereRaw('DATEDIFF(?, COALESCE(last_transaction_date, created_at)) BETWEEN 61 AND 90', [$today])
                ->sum('current_balance') ?? 0],
            ['label' => '90+ Gün', 'value' => CurrentAccount::where('account_type', 'customer')
                ->where('current_balance', '>', 0)
                ->whereRaw('DATEDIFF(?, COALESCE(last_transaction_date, created_at)) > 90', [$today])
                ->sum('current_balance') ?? 0],
        ];
    }

    private function getPayableAging()
    {
        $today = Carbon::now();

        return [
            ['label' => '0-30 Gün', 'value' => CurrentAccount::where('account_type', 'supplier')
                ->where('current_balance', '<', 0)
                ->whereRaw('DATEDIFF(?, COALESCE(last_transaction_date, created_at)) <= 30', [$today])
                ->sum(DB::raw('ABS(current_balance)')) ?? 0],
            ['label' => '31-60 Gün', 'value' => CurrentAccount::where('account_type', 'supplier')
                ->where('current_balance', '<', 0)
                ->whereRaw('DATEDIFF(?, COALESCE(last_transaction_date, created_at)) BETWEEN 31 AND 60', [$today])
                ->sum(DB::raw('ABS(current_balance)')) ?? 0],
            ['label' => '61-90 Gün', 'value' => CurrentAccount::where('account_type', 'supplier')
                ->where('current_balance', '<', 0)
                ->whereRaw('DATEDIFF(?, COALESCE(last_transaction_date, created_at)) BETWEEN 61 AND 90', [$today])
                ->sum(DB::raw('ABS(current_balance)')) ?? 0],
            ['label' => '90+ Gün', 'value' => CurrentAccount::where('account_type', 'supplier')
                ->where('current_balance', '<', 0)
                ->whereRaw('DATEDIFF(?, COALESCE(last_transaction_date, created_at)) > 90', [$today])
                ->sum(DB::raw('ABS(current_balance)')) ?? 0],
        ];
    }

    private function getCollectionTrend($startDate, $endDate)
    {
        return CurrentAccountTransaction::whereBetween('transaction_date', [$startDate, $endDate])
            ->where('transaction_type', 'credit')
            ->select(
                DB::raw("DATE_FORMAT(transaction_date, '%Y-%m') as month"),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();
    }

    private function getPaymentSchedule($startDate, $endDate)
    {
        // Use Invoice with correct columns
        return Invoice::whereBetween('due_date', [$startDate, $endDate])
            ->where('invoice_type', 'purchase')
            ->where('status', '!=', 'cancelled')
            ->where('remaining_amount', '>', 0)
            ->select('id', 'invoice_number', 'due_date', 'remaining_amount', 'current_account_id')
            ->with('currentAccount:id,title')
            ->orderBy('due_date')
            ->limit(20)
            ->get();
    }

    private function getMonthlyProfitMargins($startDate, $endDate)
    {
        // Use SalesOrder with correct columns
        return SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->select(
                DB::raw("DATE_FORMAT(order_date, '%Y-%m') as month"),
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('SUM(COALESCE(subtotal * 0.7, total_amount * 0.7)) as cost')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                $margin = $item->revenue > 0 ? (($item->revenue - $item->cost) / $item->revenue) * 100 : 0;
                return [
                    'month' => $item->month,
                    'revenue' => $item->revenue ?? 0,
                    'cost' => $item->cost ?? 0,
                    'profit' => ($item->revenue ?? 0) - ($item->cost ?? 0),
                    'margin' => round($margin, 2),
                ];
            });
    }

    private function getProductMargins($startDate, $endDate)
    {
        return SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                'products.name',
                DB::raw('SUM(sales_order_items.line_total) as revenue'),
                DB::raw('SUM(sales_order_items.quantity * COALESCE(products.cost_price, sales_order_items.unit_price * 0.7)) as cost')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->limit(20)
            ->get()
            ->map(function ($item) {
                $margin = $item->revenue > 0 ? (($item->revenue - $item->cost) / $item->revenue) * 100 : 0;
                return [
                    'name' => $item->name,
                    'revenue' => $item->revenue ?? 0,
                    'cost' => $item->cost ?? 0,
                    'profit' => ($item->revenue ?? 0) - ($item->cost ?? 0),
                    'margin' => round($margin, 2),
                ];
            });
    }

    private function getCategoryMargins($startDate, $endDate)
    {
        return SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                DB::raw('COALESCE(categories.name, "Kategorisiz") as category_name'),
                DB::raw('SUM(sales_order_items.line_total) as revenue'),
                DB::raw('SUM(sales_order_items.quantity * COALESCE(products.cost_price, sales_order_items.unit_price * 0.7)) as cost')
            )
            ->groupBy('category_name')
            ->orderByDesc('revenue')
            ->get()
            ->map(function ($item) {
                $margin = $item->revenue > 0 ? (($item->revenue - $item->cost) / $item->revenue) * 100 : 0;
                return [
                    'category_name' => $item->category_name,
                    'revenue' => $item->revenue ?? 0,
                    'cost' => $item->cost ?? 0,
                    'profit' => ($item->revenue ?? 0) - ($item->cost ?? 0),
                    'margin' => round($margin, 2),
                ];
            });
    }
}
