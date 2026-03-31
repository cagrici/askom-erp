<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\CurrentAccount;
use App\Models\BankAccount;
use App\Models\PaymentMethod;
use App\Models\PaymentTerm;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class PaymentController extends Controller
{
    /**
     * Display payments dashboard
     */
    public function index(Request $request): Response
    {
        $query = Payment::with([
            'currentAccount',
            'bankAccount',
            'paymentMethod',
            'paymentTerm',
            'createdBy',
            'approvedBy'
        ]);

        // Filtering
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('payment_number', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%")
                  ->orWhere('document_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('currentAccount', function($q) use ($search) {
                      $q->where('title', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('approval_status')) {
            $query->where('approval_status', $request->approval_status);
        }

        if ($request->filled('currency')) {
            $query->where('currency', $request->currency);
        }

        if ($request->filled('bank_account_id')) {
            $query->where('bank_account_id', $request->bank_account_id);
        }

        if ($request->filled('current_account_id')) {
            $query->where('current_account_id', $request->current_account_id);
        }

        if ($request->filled('payment_method_id')) {
            $query->where('payment_method_id', $request->payment_method_id);
        }

        if ($request->filled('date_from')) {
            $query->where('payment_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('payment_date', '<=', $request->date_to);
        }

        if ($request->filled('is_reconciled')) {
            $query->where('is_reconciled', $request->is_reconciled === '1');
        }

        if ($request->filled('is_overdue')) {
            if ($request->is_overdue === '1') {
                $query->overdue();
            }
        }

        // Sorting
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        
        if ($sortField === 'current_account') {
            $query->join('current_accounts', 'payments.current_account_id', '=', 'current_accounts.id')
                  ->orderBy('current_accounts.title', $sortDirection)
                  ->select('payments.*');
        } else {
            $query->orderBy($sortField, $sortDirection);
        }

        $payments = $query->paginate(20)->withQueryString();

        // Transform payments data to include computed attributes
        $payments->getCollection()->transform(function ($payment) {
            $payment->status_text = $payment->getStatusTextAttribute();
            $payment->approval_status_text = $payment->getApprovalStatusTextAttribute();
            $payment->status_badge_color = $payment->getStatusBadgeColorAttribute();
            $payment->formatted_amount = $payment->getFormattedAmountAttribute();
            $payment->formatted_net_amount = $payment->getFormattedNetAmountAttribute();
            $payment->is_overdue = $payment->getIsOverdueAttribute();
            $payment->days_overdue = $payment->getDaysOverdueAttribute();
            $payment->can_edit = $payment->canEdit();
            $payment->can_delete = $payment->canDelete();
            $payment->can_approve = $payment->canApprove();
            $payment->can_pay = $payment->canPay();
            $payment->can_reconcile = $payment->canReconcile();
            return $payment;
        });

        // Statistics
        $stats = [
            'total_payments' => Payment::count(),
            'draft_payments' => Payment::draft()->count(),
            'pending_payments' => Payment::pending()->count(),
            'approved_payments' => Payment::approved()->count(),
            'paid_payments' => Payment::paid()->count(),
            'overdue_payments' => Payment::overdue()->count(),
            'total_amount_try' => Payment::byCurrency('TRY')->sum('amount'),
            'total_amount_usd' => Payment::byCurrency('USD')->sum('amount'),
            'total_amount_eur' => Payment::byCurrency('EUR')->sum('amount'),
            'pending_amount_try' => Payment::pending()->byCurrency('TRY')->sum('amount'),
            'pending_amount_usd' => Payment::pending()->byCurrency('USD')->sum('amount'),
            'pending_amount_eur' => Payment::pending()->byCurrency('EUR')->sum('amount'),
        ];

        // Analytics data
        $currencyDistribution = Payment::selectRaw('currency, COUNT(*) as count, SUM(amount) as total_amount')
            ->groupBy('currency')
            ->get()
            ->keyBy('currency');

        $statusDistribution = Payment::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $monthlyData = Payment::selectRaw('YEAR(payment_date) as year, MONTH(payment_date) as month, COUNT(*) as count, SUM(amount) as total_amount')
            ->where('payment_date', '>=', now()->subYear())
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        // Get filter options
        $bankAccounts = BankAccount::where('is_active', true)
            ->select('id', 'account_name', 'bank_name')
            ->get();

        $paymentMethods = PaymentMethod::where('is_active', true)
            ->select('id', 'name')
            ->get();

        return Inertia::render('Accounting/Payments/Index', [
            'payments' => $payments,
            'stats' => $stats,
            'charts' => [
                'currencyDistribution' => $currencyDistribution,
                'statusDistribution' => $statusDistribution,
                'monthlyData' => $monthlyData,
            ],
            'filters' => $request->all([
                'search', 'status', 'approval_status', 'currency', 'bank_account_id',
                'current_account_id', 'payment_method_id', 'date_from', 'date_to',
                'is_reconciled', 'is_overdue', 'sort_field', 'sort_direction'
            ]),
            'filterOptions' => [
                'bankAccounts' => $bankAccounts,
                'paymentMethods' => $paymentMethods,
            ],
        ]);
    }

    /**
     * Show the form for creating a new payment
     */
    public function create(Request $request): Response
    {
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
            ->select('id', 'name', 'requires_bank_account', 'commission_rate')
            ->orderBy('name')
            ->get();

        $paymentTerms = PaymentTerm::where('is_active', true)
            ->select('id', 'name', 'days', 'is_default')
            ->orderBy('is_default', 'desc')
            ->orderBy('days')
            ->get();

        return Inertia::render('Accounting/Payments/Create', [
            'currentAccounts' => $currentAccounts,
            'bankAccounts' => $bankAccounts,
            'paymentMethods' => $paymentMethods,
            'paymentTerms' => $paymentTerms,
            'selectedCurrentAccount' => $request->current_account_id,
            'selectedBankAccount' => $request->bank_account_id,
        ]);
    }

    /**
     * Store a newly created payment
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_account_id' => 'required|exists:current_accounts,id',
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'payment_term_id' => 'nullable|exists:payment_terms,id',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|in:TRY,USD,EUR,GBP',
            'exchange_rate' => 'nullable|numeric|min:0.0001',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'bank_fees' => 'nullable|numeric|min:0',
            'payment_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:payment_date',
            'value_date' => 'nullable|date',
            'reference_number' => 'nullable|string|max:100',
            'document_number' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'required|in:draft,pending',
        ], [
            'current_account_id.required' => 'Cari hesap seçilmelidir.',
            'bank_account_id.required' => 'Banka hesabı seçilmelidir.',
            'payment_method_id.required' => 'Ödeme yöntemi seçilmelidir.',
            'amount.required' => 'Ödeme tutarı zorunludur.',
            'amount.min' => 'Ödeme tutarı 0\'dan büyük olmalıdır.',
            'currency.required' => 'Para birimi seçilmelidir.',
            'payment_date.required' => 'Ödeme tarihi zorunludur.',
            'due_date.after_or_equal' => 'Vade tarihi ödeme tarihinden önce olamaz.',
        ]);

        // Set default exchange rate for TRY
        if ($validated['currency'] === 'TRY') {
            $validated['exchange_rate'] = 1;
        } elseif (!isset($validated['exchange_rate'])) {
            $validated['exchange_rate'] = 1; // Should be fetched from external API
        }

        // Set default values
        $validated['commission_rate'] = $validated['commission_rate'] ?? 0;
        $validated['bank_fees'] = $validated['bank_fees'] ?? 0;

        $payment = Payment::create($validated);

        return redirect()->route('accounting.payments.show', $payment)
            ->with('success', 'Ödeme başarıyla oluşturuldu.');
    }

    /**
     * Display the specified payment
     */
    public function show(Payment $payment): Response
    {
        $payment->load([
            'currentAccount',
            'bankAccount',
            'paymentMethod',
            'paymentTerm',
            'createdBy',
            'updatedBy',
            'approvedBy',
            'reconciledBy',
            'paidBy'
        ]);

        // Add computed attributes
        $payment->status_text = $payment->getStatusTextAttribute();
        $payment->approval_status_text = $payment->getApprovalStatusTextAttribute();
        $payment->status_badge_color = $payment->getStatusBadgeColorAttribute();
        $payment->formatted_amount = $payment->getFormattedAmountAttribute();
        $payment->formatted_net_amount = $payment->getFormattedNetAmountAttribute();
        $payment->is_overdue = $payment->getIsOverdueAttribute();
        $payment->days_overdue = $payment->getDaysOverdueAttribute();
        $payment->can_edit = $payment->canEdit();
        $payment->can_delete = $payment->canDelete();
        $payment->can_approve = $payment->canApprove();
        $payment->can_pay = $payment->canPay();
        $payment->can_reconcile = $payment->canReconcile();

        return Inertia::render('Accounting/Payments/Show', [
            'payment' => $payment,
        ]);
    }

    /**
     * Show the form for editing the specified payment
     */
    public function edit(Payment $payment): Response
    {
        if (!$payment->canEdit()) {
            return redirect()->route('accounting.payments.show', $payment)
                ->with('error', 'Bu ödeme düzenlenemez.');
        }

        $payment->load([
            'currentAccount',
            'bankAccount',
            'paymentMethod',
            'paymentTerm'
        ]);

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
            ->select('id', 'name', 'requires_bank_account', 'commission_rate')
            ->orderBy('name')
            ->get();

        $paymentTerms = PaymentTerm::where('is_active', true)
            ->select('id', 'name', 'days', 'is_default')
            ->orderBy('is_default', 'desc')
            ->orderBy('days')
            ->get();

        return Inertia::render('Accounting/Payments/Edit', [
            'payment' => $payment,
            'currentAccounts' => $currentAccounts,
            'bankAccounts' => $bankAccounts,
            'paymentMethods' => $paymentMethods,
            'paymentTerms' => $paymentTerms,
        ]);
    }

    /**
     * Update the specified payment
     */
    public function update(Request $request, Payment $payment): RedirectResponse
    {
        if (!$payment->canEdit()) {
            return redirect()->route('accounting.payments.show', $payment)
                ->with('error', 'Bu ödeme düzenlenemez.');
        }

        $validated = $request->validate([
            'current_account_id' => 'required|exists:current_accounts,id',
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'payment_term_id' => 'nullable|exists:payment_terms,id',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|in:TRY,USD,EUR,GBP',
            'exchange_rate' => 'nullable|numeric|min:0.0001',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'bank_fees' => 'nullable|numeric|min:0',
            'payment_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:payment_date',
            'value_date' => 'nullable|date',
            'reference_number' => 'nullable|string|max:100',
            'document_number' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
        ], [
            'current_account_id.required' => 'Cari hesap seçilmelidir.',
            'bank_account_id.required' => 'Banka hesabı seçilmelidir.',
            'payment_method_id.required' => 'Ödeme yöntemi seçilmelidir.',
            'amount.required' => 'Ödeme tutarı zorunludur.',
            'amount.min' => 'Ödeme tutarı 0\'dan büyük olmalıdır.',
            'currency.required' => 'Para birimi seçilmelidir.',
            'payment_date.required' => 'Ödeme tarihi zorunludur.',
            'due_date.after_or_equal' => 'Vade tarihi ödeme tarihinden önce olamaz.',
        ]);

        // Set default exchange rate for TRY
        if ($validated['currency'] === 'TRY') {
            $validated['exchange_rate'] = 1;
        } elseif (!isset($validated['exchange_rate'])) {
            $validated['exchange_rate'] = 1;
        }

        // Set default values
        $validated['commission_rate'] = $validated['commission_rate'] ?? 0;
        $validated['bank_fees'] = $validated['bank_fees'] ?? 0;

        $payment->update($validated);

        return redirect()->route('accounting.payments.show', $payment)
            ->with('success', 'Ödeme başarıyla güncellendi.');
    }

    /**
     * Remove the specified payment
     */
    public function destroy(Payment $payment): RedirectResponse
    {
        if (!$payment->canDelete()) {
            return redirect()->route('accounting.payments.show', $payment)
                ->with('error', 'Bu ödeme silinemez.');
        }

        $payment->delete();

        return redirect()->route('accounting.payments.index')
            ->with('success', 'Ödeme başarıyla silindi.');
    }

    /**
     * Mark payment as paid
     */
    public function markAsPaid(Request $request, Payment $payment): RedirectResponse
    {
        if (!$payment->canPay()) {
            return redirect()->route('accounting.payments.show', $payment)
                ->with('error', 'Bu ödeme ödenemez.');
        }

        $validated = $request->validate([
            'paid_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if (isset($validated['paid_date'])) {
            $payment->paid_at = $validated['paid_date'];
        }

        if (isset($validated['notes'])) {
            $payment->notes = ($payment->notes ? $payment->notes . "\n\n" : '') . $validated['notes'];
        }

        $payment->markAsPaid();

        return redirect()->route('accounting.payments.show', $payment)
            ->with('success', 'Ödeme ödenmiş olarak işaretlendi.');
    }

    /**
     * Mark payment as bounced
     */
    public function markAsBounced(Request $request, Payment $payment): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string',
        ], [
            'reason.required' => 'İade nedeni zorunludur.',
        ]);

        $payment->markAsBounced($validated['reason']);

        return redirect()->route('accounting.payments.show', $payment)
            ->with('success', 'Ödeme iade edilmiş olarak işaretlendi.');
    }

    /**
     * Approve payment
     */
    public function approve(Payment $payment): RedirectResponse
    {
        if (!$payment->canApprove()) {
            return redirect()->route('accounting.payments.show', $payment)
                ->with('error', 'Bu ödeme onaylanamaz.');
        }

        $payment->approve();

        return redirect()->route('accounting.payments.show', $payment)
            ->with('success', 'Ödeme başarıyla onaylandı.');
    }

    /**
     * Reject payment
     */
    public function reject(Request $request, Payment $payment): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string',
        ], [
            'reason.required' => 'Red nedeni zorunludur.',
        ]);

        $payment->reject($validated['reason']);

        return redirect()->route('accounting.payments.show', $payment)
            ->with('success', 'Ödeme reddedildi.');
    }

    /**
     * Reconcile payment
     */
    public function reconcile(Payment $payment): RedirectResponse
    {
        if (!$payment->canReconcile()) {
            return redirect()->route('accounting.payments.show', $payment)
                ->with('error', 'Bu ödeme mutabakat yapılamaz.');
        }

        $payment->reconcile();

        return redirect()->route('accounting.payments.show', $payment)
            ->with('success', 'Ödeme mutabakatı tamamlandı.');
    }

    /**
     * Export payments
     */
    public function export(Request $request)
    {
        // TODO: Implement Excel/CSV export
        return redirect()->route('accounting.payments.index')
            ->with('info', 'Export özelliği yakında eklenecek.');
    }

    /**
     * Get currency exchange rates (Logo Tiger kurları)
     */
    public function getExchangeRates(Request $request)
    {
        $latestRates = \App\Models\ExchangeRate::getLatestRates('A');

        $rates = ['TRY' => 1.00];
        foreach (['USD', 'EUR', 'GBP', 'CHF'] as $currency) {
            if (isset($latestRates[$currency])) {
                $rates[$currency] = (float) $latestRates[$currency]->value;
            }
        }

        return response()->json($rates);
    }

    /**
     * Payment analytics dashboard
     */
    public function analytics(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->subYear()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Monthly payment trends
        $monthlyTrends = Payment::selectRaw('
                YEAR(payment_date) as year,
                MONTH(payment_date) as month,
                COUNT(*) as count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount
            ')
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        // Status distribution
        $statusDistribution = Payment::selectRaw('status, COUNT(*) as count, SUM(amount) as total_amount')
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->groupBy('status')
            ->get();

        // Top current accounts
        $topCurrentAccounts = Payment::with('currentAccount')
            ->selectRaw('current_account_id, COUNT(*) as payment_count, SUM(amount) as total_amount')
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->groupBy('current_account_id')
            ->orderByDesc('total_amount')
            ->limit(10)
            ->get();

        // Payment method distribution
        $paymentMethodDistribution = Payment::with('paymentMethod')
            ->selectRaw('payment_method_id, COUNT(*) as count, SUM(amount) as total_amount')
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->groupBy('payment_method_id')
            ->orderByDesc('total_amount')
            ->get();

        return Inertia::render('Accounting/Payments/Analytics', [
            'analytics' => [
                'monthlyTrends' => $monthlyTrends,
                'statusDistribution' => $statusDistribution,
                'topCurrentAccounts' => $topCurrentAccounts,
                'paymentMethodDistribution' => $paymentMethodDistribution,
            ],
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }
}