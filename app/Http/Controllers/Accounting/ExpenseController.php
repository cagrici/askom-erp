<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\CurrentAccount;
use App\Models\BankAccount;
use App\Models\PaymentMethod;
use App\Models\Employee;
use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class ExpenseController extends Controller
{
    /**
     * Display expenses dashboard
     */
    public function index(Request $request): Response
    {
        $query = Expense::with([
            'category',
            'currentAccount',
            'bankAccount',
            'paymentMethod',
            'employee',
            'location',
            'createdBy',
            'approvedBy'
        ]);

        // Filtering
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('expense_number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('invoice_number', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%")
                  ->orWhereHas('currentAccount', function($q) use ($search) {
                      $q->where('title', 'like', "%{$search}%");
                  })
                  ->orWhereHas('category', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('approval_status')) {
            $query->where('approval_status', $request->approval_status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('category_id')) {
            $query->where('expense_category_id', $request->category_id);
        }

        if ($request->filled('currency')) {
            $query->where('currency', $request->currency);
        }

        if ($request->filled('current_account_id')) {
            $query->where('current_account_id', $request->current_account_id);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        if ($request->filled('date_from')) {
            $query->where('expense_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('expense_date', '<=', $request->date_to);
        }

        if ($request->filled('amount_min')) {
            $query->where('amount', '>=', $request->amount_min);
        }

        if ($request->filled('amount_max')) {
            $query->where('amount', '<=', $request->amount_max);
        }

        if ($request->filled('is_overdue')) {
            if ($request->is_overdue === '1') {
                $query->overdue();
            }
        }

        if ($request->filled('is_recurring')) {
            $query->where('is_recurring', $request->is_recurring === '1');
        }

        // Sorting
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        
        if ($sortField === 'category') {
            $query->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
                  ->orderBy('expense_categories.name', $sortDirection)
                  ->select('expenses.*');
        } elseif ($sortField === 'current_account') {
            $query->join('current_accounts', 'expenses.current_account_id', '=', 'current_accounts.id')
                  ->orderBy('current_accounts.title', $sortDirection)
                  ->select('expenses.*');
        } else {
            $query->orderBy($sortField, $sortDirection);
        }

        $expenses = $query->paginate(20)->withQueryString();

        // Transform expenses data to include computed attributes
        $expenses->getCollection()->transform(function ($expense) {
            $expense->status_text = $expense->getStatusTextAttribute();
            $expense->approval_status_text = $expense->getApprovalStatusTextAttribute();
            $expense->payment_status_text = $expense->getPaymentStatusTextAttribute();
            $expense->status_badge_color = $expense->getStatusBadgeColorAttribute();
            $expense->formatted_amount = $expense->getFormattedAmountAttribute();
            $expense->formatted_net_amount = $expense->getFormattedNetAmountAttribute();
            $expense->is_overdue = $expense->getIsOverdueAttribute();
            $expense->days_overdue = $expense->getDaysOverdueAttribute();
            $expense->can_edit = $expense->canEdit();
            $expense->can_delete = $expense->canDelete();
            $expense->can_approve = $expense->canApprove();
            $expense->can_pay = $expense->canPay();
            return $expense;
        });

        // Statistics
        $stats = [
            'total_expenses' => Expense::count(),
            'current_month_expenses' => Expense::currentMonth()->count(),
            'current_month_amount' => Expense::currentMonth()->sum('amount'),
            'last_month_amount' => Expense::lastMonth()->sum('amount'),
            'draft_expenses' => Expense::draft()->count(),
            'pending_expenses' => Expense::pending()->count(),
            'approved_expenses' => Expense::approved()->count(),
            'paid_expenses' => Expense::paid()->count(),
            'overdue_expenses' => Expense::overdue()->count(),
            'unpaid_expenses' => Expense::unpaid()->count(),
            'total_amount_try' => Expense::byCurrency('TRY')->sum('amount'),
            'total_amount_usd' => Expense::byCurrency('USD')->sum('amount'),
            'total_amount_eur' => Expense::byCurrency('EUR')->sum('amount'),
            'pending_amount_try' => Expense::pending()->byCurrency('TRY')->sum('amount'),
            'overdue_amount' => Expense::overdue()->sum('amount'),
            'recurring_expenses' => Expense::recurring()->count(),
        ];

        // Calculate monthly growth rate
        $currentMonth = Expense::currentMonth()->sum('amount');
        $lastMonth = Expense::lastMonth()->sum('amount');
        $monthlyGrowthRate = $lastMonth > 0 ? (($currentMonth - $lastMonth) / $lastMonth) * 100 : 0;
        $stats['monthly_growth_rate'] = round($monthlyGrowthRate, 1);

        // Analytics data
        $categoryDistribution = Expense::with('category')
            ->selectRaw('expense_category_id, COUNT(*) as count, SUM(amount) as total_amount')
            ->groupBy('expense_category_id')
            ->get()
            ->map(function($item) {
                return [
                    'category' => $item->category ? $item->category->name : 'Kategorisiz',
                    'count' => $item->count,
                    'total_amount' => $item->total_amount,
                    'color' => $item->category ? $item->category->color : '#6c757d'
                ];
            });

        $statusDistribution = Expense::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $monthlyData = Expense::selectRaw('YEAR(expense_date) as year, MONTH(expense_date) as month, COUNT(*) as count, SUM(amount) as total_amount')
            ->where('expense_date', '>=', now()->subYear())
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        // Get filter options
        $categories = ExpenseCategory::active()
            ->select('id', 'name', 'color')
            ->orderBy('name')
            ->get();

        $locations = Location::select('id', 'name')
            ->orderBy('name')
            ->get();

        $employees = Employee::where('status', 'active')
            ->select('id', 'first_name', 'last_name')
            ->get()
            ->map(function($employee) {
                return [
                    'id' => $employee->id,
                    'name' => $employee->first_name . ' ' . $employee->last_name
                ];
            });

        return Inertia::render('Accounting/Expenses/Index', [
            'expenses' => $expenses,
            'stats' => $stats,
            'charts' => [
                'categoryDistribution' => $categoryDistribution,
                'statusDistribution' => $statusDistribution,
                'monthlyData' => $monthlyData,
            ],
            'filters' => $request->all([
                'search', 'status', 'approval_status', 'payment_status', 'category_id',
                'currency', 'current_account_id', 'employee_id', 'location_id',
                'date_from', 'date_to', 'amount_min', 'amount_max',
                'is_overdue', 'is_recurring', 'sort_field', 'sort_direction'
            ]),
            'filterOptions' => [
                'categories' => $categories,
                'locations' => $locations,
                'employees' => $employees,
            ],
        ]);
    }

    /**
     * Show the form for creating a new expense
     */
    public function create(Request $request): Response
    {
        $categories = ExpenseCategory::active()
            ->with('parent')
            ->orderBy('name')
            ->get();

        $currentAccounts = CurrentAccount::where('is_active', true)
            ->select('id', 'title', 'account_code', 'account_type')
            ->orderBy('title')
            ->get();

        $bankAccounts = BankAccount::where('is_active', true)
            ->select('id', 'account_name', 'bank_name', 'currency', 'is_default')
            ->orderBy('is_default', 'desc')
            ->orderBy('account_name')
            ->get();

        $paymentMethods = PaymentMethod::where('is_active', true)
            ->select('id', 'name', 'requires_bank_account')
            ->orderBy('name')
            ->get();

        $employees = Employee::where('status', 'active')
            ->select('id', 'first_name', 'last_name')
            ->get()
            ->map(function($employee) {
                return [
                    'id' => $employee->id,
                    'name' => $employee->first_name . ' ' . $employee->last_name
                ];
            });

        $locations = Location::select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Accounting/Expenses/Create', [
            'categories' => $categories,
            'currentAccounts' => $currentAccounts,
            'bankAccounts' => $bankAccounts,
            'paymentMethods' => $paymentMethods,
            'employees' => $employees,
            'locations' => $locations,
            'selectedCategory' => $request->category_id,
            'selectedCurrentAccount' => $request->current_account_id,
        ]);
    }

    /**
     * Store a newly created expense
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'current_account_id' => 'nullable|exists:current_accounts,id',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            'employee_id' => 'nullable|exists:employees,id',
            'location_id' => 'nullable|exists:locations,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|in:TRY,USD,EUR,GBP',
            'exchange_rate' => 'nullable|numeric|min:0.0001',
            'vat_rate' => 'nullable|numeric|min:0|max:100',
            'withholding_tax_rate' => 'nullable|numeric|min:0|max:100',
            'expense_date' => 'required|date',
            'invoice_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:expense_date',
            'invoice_number' => 'nullable|string|max:100',
            'reference_number' => 'nullable|string|max:100',
            'receipt_number' => 'nullable|string|max:100',
            'status' => 'required|in:draft,pending',
            'is_recurring' => 'nullable|boolean',
            'recurring_frequency' => 'nullable|in:monthly,quarterly,yearly',
        ], [
            'expense_category_id.required' => 'Gider kategorisi seçilmelidir.',
            'title.required' => 'Gider başlığı zorunludur.',
            'amount.required' => 'Gider tutarı zorunludur.',
            'amount.min' => 'Gider tutarı 0\'dan büyük olmalıdır.',
            'currency.required' => 'Para birimi seçilmelidir.',
            'expense_date.required' => 'Gider tarihi zorunludur.',
            'due_date.after_or_equal' => 'Vade tarihi gider tarihinden önce olamaz.',
        ]);

        // Set default exchange rate for TRY
        if ($validated['currency'] === 'TRY') {
            $validated['exchange_rate'] = 1;
        } elseif (!isset($validated['exchange_rate'])) {
            $validated['exchange_rate'] = 1; // Should be fetched from external API
        }

        // Set default values
        $validated['vat_rate'] = $validated['vat_rate'] ?? 0;
        $validated['withholding_tax_rate'] = $validated['withholding_tax_rate'] ?? 0;
        $validated['is_recurring'] = $validated['is_recurring'] ?? false;

        // Set next occurrence date for recurring expenses
        if ($validated['is_recurring'] && isset($validated['recurring_frequency'])) {
            $validated['next_occurrence_date'] = match($validated['recurring_frequency']) {
                'monthly' => Carbon::parse($validated['expense_date'])->addMonth(),
                'quarterly' => Carbon::parse($validated['expense_date'])->addMonths(3),
                'yearly' => Carbon::parse($validated['expense_date'])->addYear(),
                default => null
            };
        }

        $expense = Expense::create($validated);

        return redirect()->route('accounting.expenses.show', $expense)
            ->with('success', 'Gider başarıyla oluşturuldu.');
    }

    /**
     * Display the specified expense
     */
    public function show(Expense $expense): Response
    {
        $expense->load([
            'category',
            'currentAccount',
            'bankAccount',
            'paymentMethod',
            'employee',
            'location',
            'items',
            'createdBy',
            'updatedBy',
            'approvedBy',
            'paidBy'
        ]);

        // Add computed attributes
        $expense->status_text = $expense->getStatusTextAttribute();
        $expense->approval_status_text = $expense->getApprovalStatusTextAttribute();
        $expense->payment_status_text = $expense->getPaymentStatusTextAttribute();
        $expense->status_badge_color = $expense->getStatusBadgeColorAttribute();
        $expense->formatted_amount = $expense->getFormattedAmountAttribute();
        $expense->formatted_net_amount = $expense->getFormattedNetAmountAttribute();
        $expense->is_overdue = $expense->getIsOverdueAttribute();
        $expense->days_overdue = $expense->getDaysOverdueAttribute();
        $expense->can_edit = $expense->canEdit();
        $expense->can_delete = $expense->canDelete();
        $expense->can_approve = $expense->canApprove();
        $expense->can_pay = $expense->canPay();

        return Inertia::render('Accounting/Expenses/Show', [
            'expense' => $expense,
        ]);
    }

    /**
     * Show the form for editing the specified expense
     */
    public function edit(Expense $expense): Response
    {
        if (!$expense->canEdit()) {
            return redirect()->route('accounting.expenses.show', $expense)
                ->with('error', 'Bu gider düzenlenemez.');
        }

        $expense->load([
            'category',
            'currentAccount',
            'bankAccount',
            'paymentMethod',
            'employee',
            'location'
        ]);

        $categories = ExpenseCategory::active()
            ->with('parent')
            ->orderBy('name')
            ->get();

        $currentAccounts = CurrentAccount::where('is_active', true)
            ->select('id', 'title', 'account_code', 'account_type')
            ->orderBy('title')
            ->get();

        $bankAccounts = BankAccount::where('is_active', true)
            ->select('id', 'account_name', 'bank_name', 'currency', 'is_default')
            ->orderBy('is_default', 'desc')
            ->orderBy('account_name')
            ->get();

        $paymentMethods = PaymentMethod::where('is_active', true)
            ->select('id', 'name', 'requires_bank_account')
            ->orderBy('name')
            ->get();

        $employees = Employee::where('status', 'active')
            ->select('id', 'first_name', 'last_name')
            ->get()
            ->map(function($employee) {
                return [
                    'id' => $employee->id,
                    'name' => $employee->first_name . ' ' . $employee->last_name
                ];
            });

        $locations = Location::select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Accounting/Expenses/Edit', [
            'expense' => $expense,
            'categories' => $categories,
            'currentAccounts' => $currentAccounts,
            'bankAccounts' => $bankAccounts,
            'paymentMethods' => $paymentMethods,
            'employees' => $employees,
            'locations' => $locations,
        ]);
    }

    /**
     * Update the specified expense
     */
    public function update(Request $request, Expense $expense): RedirectResponse
    {
        if (!$expense->canEdit()) {
            return redirect()->route('accounting.expenses.show', $expense)
                ->with('error', 'Bu gider düzenlenemez.');
        }

        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'current_account_id' => 'nullable|exists:current_accounts,id',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            'employee_id' => 'nullable|exists:employees,id',
            'location_id' => 'nullable|exists:locations,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|in:TRY,USD,EUR,GBP',
            'exchange_rate' => 'nullable|numeric|min:0.0001',
            'vat_rate' => 'nullable|numeric|min:0|max:100',
            'withholding_tax_rate' => 'nullable|numeric|min:0|max:100',
            'expense_date' => 'required|date',
            'invoice_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:expense_date',
            'invoice_number' => 'nullable|string|max:100',
            'reference_number' => 'nullable|string|max:100',
            'receipt_number' => 'nullable|string|max:100',
            'is_recurring' => 'nullable|boolean',
            'recurring_frequency' => 'nullable|in:monthly,quarterly,yearly',
        ], [
            'expense_category_id.required' => 'Gider kategorisi seçilmelidir.',
            'title.required' => 'Gider başlığı zorunludur.',
            'amount.required' => 'Gider tutarı zorunludur.',
            'amount.min' => 'Gider tutarı 0\'dan büyük olmalıdır.',
            'currency.required' => 'Para birimi seçilmelidir.',
            'expense_date.required' => 'Gider tarihi zorunludur.',
            'due_date.after_or_equal' => 'Vade tarihi gider tarihinden önce olamaz.',
        ]);

        // Set default exchange rate for TRY
        if ($validated['currency'] === 'TRY') {
            $validated['exchange_rate'] = 1;
        } elseif (!isset($validated['exchange_rate'])) {
            $validated['exchange_rate'] = 1;
        }

        // Set default values
        $validated['vat_rate'] = $validated['vat_rate'] ?? 0;
        $validated['withholding_tax_rate'] = $validated['withholding_tax_rate'] ?? 0;
        $validated['is_recurring'] = $validated['is_recurring'] ?? false;

        $expense->update($validated);

        return redirect()->route('accounting.expenses.show', $expense)
            ->with('success', 'Gider başarıyla güncellendi.');
    }

    /**
     * Remove the specified expense
     */
    public function destroy(Expense $expense): RedirectResponse
    {
        if (!$expense->canDelete()) {
            return redirect()->route('accounting.expenses.show', $expense)
                ->with('error', 'Bu gider silinemez.');
        }

        $expense->delete();

        return redirect()->route('accounting.expenses.index')
            ->with('success', 'Gider başarıyla silindi.');
    }

    /**
     * Approve expense
     */
    public function approve(Expense $expense): RedirectResponse
    {
        if (!$expense->canApprove()) {
            return redirect()->route('accounting.expenses.show', $expense)
                ->with('error', 'Bu gider onaylanamaz.');
        }

        $expense->approve();

        return redirect()->route('accounting.expenses.show', $expense)
            ->with('success', 'Gider başarıyla onaylandı.');
    }

    /**
     * Reject expense
     */
    public function reject(Request $request, Expense $expense): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string',
        ], [
            'reason.required' => 'Red nedeni zorunludur.',
        ]);

        $expense->reject($validated['reason']);

        return redirect()->route('accounting.expenses.show', $expense)
            ->with('success', 'Gider reddedildi.');
    }

    /**
     * Mark expense as paid
     */
    public function markAsPaid(Request $request, Expense $expense): RedirectResponse
    {
        if (!$expense->canPay()) {
            return redirect()->route('accounting.expenses.show', $expense)
                ->with('error', 'Bu gider ödenemez.');
        }

        $validated = $request->validate([
            'payment_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if (isset($validated['payment_date'])) {
            $expense->payment_date = $validated['payment_date'];
        }

        if (isset($validated['notes'])) {
            $expense->description = ($expense->description ? $expense->description . "\n\n" : '') . $validated['notes'];
        }

        $expense->markAsPaid();

        return redirect()->route('accounting.expenses.show', $expense)
            ->with('success', 'Gider ödenmiş olarak işaretlendi.');
    }

    /**
     * Duplicate expense
     */
    public function duplicate(Expense $expense): RedirectResponse
    {
        $newExpense = $expense->replicate(['expense_number']);
        $newExpense->status = 'draft';
        $newExpense->approval_status = 'pending';
        $newExpense->payment_status = 'unpaid';
        $newExpense->approved_at = null;
        $newExpense->approved_by = null;
        $newExpense->paid_at = null;
        $newExpense->paid_by = null;
        $newExpense->payment_date = null;
        $newExpense->expense_date = now()->toDateString();
        $newExpense->title = $newExpense->title . ' (Kopya)';
        $newExpense->save();

        return redirect()->route('accounting.expenses.edit', $newExpense)
            ->with('success', 'Gider başarıyla kopyalandı.');
    }

    /**
     * Expense analytics dashboard
     */
    public function analytics(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->subYear()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Monthly expense trends
        $monthlyTrends = Expense::selectRaw('
                YEAR(expense_date) as year,
                MONTH(expense_date) as month,
                COUNT(*) as count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount
            ')
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        // Category analysis
        $categoryAnalysis = Expense::with('category')
            ->selectRaw('
                expense_category_id,
                COUNT(*) as count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount
            ')
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->groupBy('expense_category_id')
            ->orderByDesc('total_amount')
            ->get();

        // Top suppliers
        $topSuppliers = Expense::with('currentAccount')
            ->selectRaw('
                current_account_id,
                COUNT(*) as expense_count,
                SUM(amount) as total_amount
            ')
            ->whereNotNull('current_account_id')
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->groupBy('current_account_id')
            ->orderByDesc('total_amount')
            ->limit(10)
            ->get();

        // Status distribution
        $statusDistribution = Expense::selectRaw('status, COUNT(*) as count, SUM(amount) as total_amount')
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->groupBy('status')
            ->get();

        // Budget usage by category
        $budgetUsage = ExpenseCategory::with(['expenses' => function($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('expense_date', [$dateFrom, $dateTo]);
            }])
            ->whereNotNull('monthly_budget')
            ->where('monthly_budget', '>', 0)
            ->get()
            ->map(function($category) {
                $monthlyExpenses = $category->expenses->sum('amount');
                return [
                    'category' => $category->name,
                    'budget' => $category->monthly_budget,
                    'spent' => $monthlyExpenses,
                    'usage_percentage' => $category->monthly_budget > 0 ? 
                        ($monthlyExpenses / $category->monthly_budget) * 100 : 0,
                    'color' => $category->color
                ];
            });

        return Inertia::render('Accounting/Expenses/Analytics', [
            'analytics' => [
                'monthlyTrends' => $monthlyTrends,
                'categoryAnalysis' => $categoryAnalysis,
                'topSuppliers' => $topSuppliers,
                'statusDistribution' => $statusDistribution,
                'budgetUsage' => $budgetUsage,
            ],
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    /**
     * Export expenses
     */
    public function export(Request $request)
    {
        // TODO: Implement Excel/CSV export
        return redirect()->route('accounting.expenses.index')
            ->with('info', 'Export özelliği yakında eklenecek.');
    }

    /**
     * Get categories for API
     */
    public function getCategories()
    {
        $categories = ExpenseCategory::active()
            ->with('parent')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    /**
     * Get category budget information
     */
    public function getCategoryBudget($categoryId)
    {
        $category = ExpenseCategory::findOrFail($categoryId);
        
        $currentMonthExpenses = $category->expenses()
            ->whereMonth('expense_date', now()->month)
            ->whereYear('expense_date', now()->year)
            ->sum('amount');

        return response()->json([
            'monthly_budget' => $category->monthly_budget,
            'yearly_budget' => $category->yearly_budget,
            'current_month_spent' => $currentMonthExpenses,
            'remaining_budget' => max(0, $category->monthly_budget - $currentMonthExpenses),
            'usage_percentage' => $category->monthly_budget > 0 ? 
                ($currentMonthExpenses / $category->monthly_budget) * 100 : 0,
        ]);
    }

    /**
     * Get recurring expenses
     */
    public function getRecurringExpenses()
    {
        $recurringExpenses = Expense::recurring()
            ->with(['category', 'currentAccount'])
            ->where('next_occurrence_date', '<=', now()->addDays(7))
            ->get();

        return response()->json($recurringExpenses);
    }
}
