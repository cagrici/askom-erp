<?php

namespace App\Http\Controllers\Portal;

use App\Models\CurrentAccount;
use App\Models\SalesOrder;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PortalAccountSummaryController extends BasePortalController
{
    public function index(Request $request)
    {
        $customerId = $this->getSelectedAccountId();

        if (!$customerId) {
            return redirect()->route('portal.dashboard')
                ->with('error', 'Lütfen bir cari hesap seçin.');
        }

        $account = CurrentAccount::findOrFail($customerId);

        // Account balance calculation
        $totalDebit = DB::table('current_account_transactions')
            ->where('current_account_id', $customerId)
            ->where('transaction_type', 'debit')
            ->sum('amount');

        $totalCredit = DB::table('current_account_transactions')
            ->where('current_account_id', $customerId)
            ->where('transaction_type', 'credit')
            ->sum('amount');

        $balance = $totalDebit - $totalCredit;

        // Open invoices
        $openInvoices = Invoice::where('current_account_id', $customerId)
            ->whereIn('status', ['pending', 'partial'])
            ->orderBy('due_date', 'asc')
            ->limit(5)
            ->get();

        // Recent orders
        $recentOrders = SalesOrder::where('customer_id', $customerId)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Recent transactions
        $recentTransactions = DB::table('current_account_transactions')
            ->where('current_account_id', $customerId)
            ->orderBy('transaction_date', 'desc')
            ->limit(10)
            ->get();

        // Monthly statistics (last 12 months)
        $monthlyStats = DB::table('sales_orders')
            ->select(
                DB::raw('DATE_FORMAT(order_date, "%Y-%m") as month'),
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(total_amount) as total_amount')
            )
            ->where('customer_id', $customerId)
            ->where('order_date', '>=', now()->subMonths(12))
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get();

        // Credit info
        $creditLimit = $account->credit_limit ?? 0;
        $usedCredit = abs($balance < 0 ? $balance : 0);
        $availableCredit = $creditLimit - $usedCredit;

        return Inertia::render('Portal/AccountSummary/Index', [
            'account' => $account,
            'balance' => $balance,
            'creditLimit' => $creditLimit,
            'usedCredit' => $usedCredit,
            'availableCredit' => $availableCredit,
            'openInvoices' => $openInvoices,
            'recentOrders' => $recentOrders,
            'recentTransactions' => $recentTransactions,
            'monthlyStats' => $monthlyStats,
        ]);
    }

    public function transactions(Request $request)
    {
        $customerId = $this->getSelectedAccountId();

        $query = DB::table('current_account_transactions')
            ->where('current_account_id', $customerId)
            ->orderBy('transaction_date', 'desc');

        // Date filter
        if ($request->filled('start_date')) {
            $query->where('transaction_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->where('transaction_date', '<=', $request->end_date);
        }

        // Type filter
        if ($request->filled('type')) {
            $query->where('transaction_type', $request->type);
        }

        $transactions = $query->paginate(20)->withQueryString();

        return Inertia::render('Portal/AccountSummary/Transactions', [
            'transactions' => $transactions,
            'filters' => $request->only(['start_date', 'end_date', 'type']),
        ]);
    }
}
