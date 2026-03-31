<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\CashAccount;
use App\Models\CashTransaction;
use App\Models\Location;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashAccountController extends Controller
{
    /**
     * Display a listing of cash accounts with dashboard stats
     */
    public function index(Request $request)
    {
        $query = CashAccount::with(['location', 'responsibleUser']);

        // Filtering
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('account_name', 'like', "%{$search}%")
                  ->orWhere('account_code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        if ($request->filled('currency')) {
            $query->where('currency', $request->currency);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active === '1');
        }

        // Sorting
        $sortField = $request->get('sort_field', 'account_name');
        $sortDirection = $request->get('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $cashAccounts = $query->paginate(15)->withQueryString();

        // Add computed attributes
        $cashAccounts->getCollection()->transform(function ($account) {
            return $account->append(['status_text', 'status_color', 'formatted_balance', 'needs_count']);
        });

        // Statistics
        $stats = $this->getDashboardStats();

        // Get locations and users for filters
        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $users = User::orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Accounting/Cash/Index', [
            'cashAccounts' => $cashAccounts,
            'locations' => $locations,
            'users' => $users,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search,
                'location_id' => $request->location_id,
                'currency' => $request->currency,
                'is_active' => $request->is_active,
            ]
        ]);
    }

    /**
     * Show the form for creating a new cash account
     */
    public function create()
    {
        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $users = User::orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Accounting/Cash/Create', [
            'locations' => $locations,
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created cash account
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_name' => 'required|string|max:255',
            'location_id' => 'nullable|exists:locations,id',
            'responsible_user_id' => 'nullable|exists:users,id',
            'description' => 'nullable|string',
            'currency' => 'required|string|size:3',
            'opening_balance' => 'required|numeric|min:0',
            'opening_date' => 'required|date',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'requires_count' => 'boolean',
            'count_frequency_days' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // If this is set as default, unset other defaults
            if ($validated['is_default'] ?? false) {
                CashAccount::where('is_default', true)->update(['is_default' => false]);
            }

            $cashAccount = CashAccount::create([
                ...$validated,
                'current_balance' => $validated['opening_balance'],
                'created_by' => Auth::id(),
            ]);

            // Create opening balance transaction if > 0
            if ($validated['opening_balance'] > 0) {
                CashTransaction::create([
                    'cash_account_id' => $cashAccount->id,
                    'transaction_type' => 'opening',
                    'payment_method' => 'cash',
                    'transaction_date' => $validated['opening_date'],
                    'amount' => $validated['opening_balance'],
                    'currency' => $validated['currency'],
                    'exchange_rate' => 1,
                    'amount_in_base_currency' => $validated['opening_balance'],
                    'description' => 'Açılış bakiyesi',
                    'status' => 'approved',
                    'performed_by' => Auth::id(),
                    'created_by' => Auth::id(),
                ]);
            }

            DB::commit();

            return redirect()->route('accounting.cash.index')
                ->with('success', 'Kasa hesabı başarıyla oluşturuldu.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()
                ->withErrors(['error' => 'Kasa hesabı oluşturulurken bir hata oluştu: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified cash account
     */
    public function show(string $id)
    {
        $cashAccount = CashAccount::with([
            'location',
            'responsibleUser',
            'transactions' => function($query) {
                $query->with(['currentAccount', 'performedBy', 'relatedCashAccount'])
                    ->orderBy('transaction_date', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->limit(50);
            }
        ])->findOrFail($id);

        $cashAccount->append(['status_text', 'status_color', 'formatted_balance', 'needs_count']);

        // Transaction statistics for this account
        $transactionStats = [
            'total_income' => $cashAccount->transactions()
                ->where('transaction_type', 'income')
                ->where('status', 'approved')
                ->sum('amount'),
            'total_expense' => $cashAccount->transactions()
                ->where('transaction_type', 'expense')
                ->where('status', 'approved')
                ->sum('amount'),
            'total_transfer_in' => $cashAccount->transactions()
                ->where('transaction_type', 'transfer_in')
                ->where('status', 'approved')
                ->sum('amount'),
            'total_transfer_out' => $cashAccount->transactions()
                ->where('transaction_type', 'transfer_out')
                ->where('status', 'approved')
                ->sum('amount'),
            'transaction_count' => $cashAccount->transactions()->count(),
        ];

        return Inertia::render('Accounting/Cash/Show', [
            'cashAccount' => $cashAccount,
            'transactionStats' => $transactionStats,
        ]);
    }

    /**
     * Show the form for editing the specified cash account
     */
    public function edit(string $id)
    {
        $cashAccount = CashAccount::findOrFail($id);

        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $users = User::orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Accounting/Cash/Edit', [
            'cashAccount' => $cashAccount,
            'locations' => $locations,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified cash account
     */
    public function update(Request $request, string $id)
    {
        $cashAccount = CashAccount::findOrFail($id);

        $validated = $request->validate([
            'account_name' => 'required|string|max:255',
            'location_id' => 'nullable|exists:locations,id',
            'responsible_user_id' => 'nullable|exists:users,id',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'requires_count' => 'boolean',
            'count_frequency_days' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // If this is set as default, unset other defaults
            if ($validated['is_default'] ?? false) {
                CashAccount::where('id', '!=', $id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }

            $cashAccount->update([
                ...$validated,
                'updated_by' => Auth::id(),
            ]);

            DB::commit();

            return redirect()->route('accounting.cash.show', $cashAccount->id)
                ->with('success', 'Kasa hesabı başarıyla güncellendi.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()
                ->withErrors(['error' => 'Kasa hesabı güncellenirken bir hata oluştu: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified cash account
     */
    public function destroy(string $id)
    {
        $cashAccount = CashAccount::findOrFail($id);

        // Check if there are any transactions
        if ($cashAccount->transactions()->count() > 0) {
            return back()->with('error', 'İşlem kaydı bulunan kasa hesabı silinemez.');
        }

        $cashAccount->delete();

        return redirect()->route('accounting.cash.index')
            ->with('success', 'Kasa hesabı başarıyla silindi.');
    }

    /**
     * Get dashboard statistics
     */
    private function getDashboardStats(): array
    {
        $today = now()->startOfDay();
        $yesterday = now()->subDay()->startOfDay();

        return [
            'total_accounts' => CashAccount::count(),
            'active_accounts' => CashAccount::where('is_active', true)->count(),
            'total_balance_try' => CashAccount::where('currency', 'TRY')
                ->where('is_active', true)
                ->sum('current_balance'),
            'total_balance_usd' => CashAccount::where('currency', 'USD')
                ->where('is_active', true)
                ->sum('current_balance'),
            'total_balance_eur' => CashAccount::where('currency', 'EUR')
                ->where('is_active', true)
                ->sum('current_balance'),
            'today_income' => CashTransaction::where('transaction_type', 'income')
                ->where('status', 'approved')
                ->whereDate('transaction_date', $today)
                ->sum('amount_in_base_currency'),
            'today_expense' => CashTransaction::where('transaction_type', 'expense')
                ->where('status', 'approved')
                ->whereDate('transaction_date', $today)
                ->sum('amount_in_base_currency'),
            'yesterday_income' => CashTransaction::where('transaction_type', 'income')
                ->where('status', 'approved')
                ->whereDate('transaction_date', $yesterday)
                ->sum('amount_in_base_currency'),
            'yesterday_expense' => CashTransaction::where('transaction_type', 'expense')
                ->where('status', 'approved')
                ->whereDate('transaction_date', $yesterday)
                ->sum('amount_in_base_currency'),
            'accounts_need_count' => CashAccount::where('is_active', true)
                ->where('requires_count', true)
                ->get()
                ->filter(fn($account) => $account->needs_count)
                ->count(),
        ];
    }
}
