<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\CurrentAccount;
use App\Models\PaymentTerm;
use App\Models\PaymentMethod;
use App\Models\BankAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Carbon\Carbon;

class CollectionController extends Controller
{
    /**
     * Display collections dashboard
     */
    public function index(Request $request): Response
    {
        $query = Collection::with([
            'currentAccount', 
            'paymentMethod', 
            'paymentTerm',
            'bankAccount',
            'collector',
            'creator'
        ]);

        // Filtering
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('collection_number', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%")
                  ->orWhere('document_number', 'like', "%{$search}%")
                  ->orWhereHas('currentAccount', function($q) use ($search) {
                      $q->where('title', 'like', "%{$search}%")
                        ->orWhere('account_code', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('current_account_id')) {
            $query->where('current_account_id', $request->current_account_id);
        }

        if ($request->filled('payment_method_id')) {
            $query->where('payment_method_id', $request->payment_method_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('collection_type')) {
            $query->where('collection_type', $request->collection_type);
        }

        if ($request->filled('currency')) {
            $query->where('currency', $request->currency);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('collection_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('collection_date', '<=', $request->date_to);
        }

        if ($request->filled('maturity_from')) {
            $query->whereDate('maturity_date', '>=', $request->maturity_from);
        }

        if ($request->filled('maturity_to')) {
            $query->whereDate('maturity_date', '<=', $request->maturity_to);
        }

        if ($request->filled('is_reconciled')) {
            $query->where('is_reconciled', $request->is_reconciled === '1');
        }

        if ($request->filled('approval_status')) {
            $query->where('approval_status', $request->approval_status);
        }

        // Sorting
        $sortField = $request->get('sort_field', 'collection_date');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $collections = $query->paginate(25)->withQueryString();

        // Transform the collections data to include computed attributes
        $collections->getCollection()->transform(function ($collection) {
            $collection->collection_type_text = $collection->getCollectionTypeTextAttribute();
            $collection->status_text = $collection->getStatusTextAttribute();
            $collection->status_color = $collection->getStatusColorAttribute();
            $collection->formatted_amount = $collection->getFormattedAmountAttribute();
            $collection->formatted_net_amount = $collection->getFormattedNetAmountAttribute();
            $collection->is_overdue = $collection->getIsOverdueAttribute();
            $collection->is_maturity_today = $collection->getIsMaturityTodayAttribute();
            $collection->is_maturity_soon = $collection->getIsMaturitySoonAttribute();
            return $collection;
        });

        // Statistics
        $stats = [
            'total_collections' => Collection::count(),
            'today_collections' => Collection::whereDate('collection_date', today())->count(),
            'pending_collections' => Collection::where('status', 'pending')->count(),
            'collected_amount_today' => Collection::whereDate('collection_date', today())
                ->where('status', 'collected')->sum('amount_in_base_currency'),
            'pending_amount' => Collection::where('status', 'pending')->sum('amount_in_base_currency'),
            'overdue_collections' => Collection::where('due_date', '<', now())
                ->whereIn('status', ['pending', 'partial'])->count(),
            'maturity_today' => Collection::whereDate('maturity_date', today())->count(),
            'unreconciled_count' => Collection::where('is_reconciled', false)
                ->where('status', 'collected')->count(),
        ];

        // Recent collections
        $recentCollections = Collection::with(['currentAccount', 'paymentMethod', 'creator'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Chart data for collections by status
        $collectionsByStatus = Collection::selectRaw('status, COUNT(*) as count, SUM(amount_in_base_currency) as total')
            ->groupBy('status')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->status => [
                    'count' => $item->count,
                    'total' => $item->total
                ]];
            })->toArray();

        // Chart data for collections over time (last 30 days)
        $collectionsOverTime = Collection::selectRaw('DATE(collection_date) as date, COUNT(*) as count, SUM(amount_in_base_currency) as total')
            ->where('collection_date', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->date => [
                    'count' => $item->count,
                    'total' => $item->total
                ]];
            })->toArray();

        // Payment methods data
        $paymentMethods = PaymentMethod::active()->ordered()->get();
        $currentAccounts = CurrentAccount::active()->get(['id', 'account_code', 'title']);

        return Inertia::render('Accounting/Collections/Index', [
            'collections' => $collections,
            'stats' => $stats,
            'recentCollections' => $recentCollections,
            'charts' => [
                'collectionsByStatus' => $collectionsByStatus,
                'collectionsOverTime' => $collectionsOverTime,
            ],
            'paymentMethods' => $paymentMethods,
            'currentAccounts' => $currentAccounts,
            'filters' => $request->all([
                'search', 'current_account_id', 'payment_method_id', 'status', 
                'collection_type', 'currency', 'date_from', 'date_to',
                'maturity_from', 'maturity_to', 'is_reconciled', 'approval_status',
                'sort_field', 'sort_direction'
            ]),
        ]);
    }

    /**
     * Show the form for creating a new collection
     */
    public function create(): Response
    {
        $paymentMethods = PaymentMethod::active()->ordered()->get();
        $paymentTerms = PaymentTerm::active()->ordered()->get();
        $bankAccounts = BankAccount::active()->get();
        $currentAccounts = CurrentAccount::active()->customers()->get(['id', 'account_code', 'title']);

        return Inertia::render('Accounting/Collections/Create', [
            'paymentMethods' => $paymentMethods,
            'paymentTerms' => $paymentTerms,
            'bankAccounts' => $bankAccounts,
            'currentAccounts' => $currentAccounts,
        ]);
    }

    /**
     * Store a newly created collection
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_account_id' => 'required|exists:current_accounts,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'payment_term_id' => 'nullable|exists:payment_terms,id',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'collection_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|in:TRY,USD,EUR,GBP',
            'exchange_rate' => 'nullable|numeric|min:0.000001',
            'collection_type' => 'required|in:invoice_payment,advance_payment,partial_payment,overpayment,refund,adjustment,other',
            'reference_number' => 'nullable|string|max:100',
            'document_number' => 'nullable|string|max:100',
            'document_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'maturity_date' => 'nullable|date',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'commission_amount' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'check_number' => 'nullable|string|max:50',
            'check_bank' => 'nullable|string|max:100',
            'check_branch' => 'nullable|string|max:100',
            'check_account' => 'nullable|string|max:50',
            'promissory_note_number' => 'nullable|string|max:50',
            'promissory_note_guarantor' => 'nullable|string|max:200',
            'is_advance_payment' => 'boolean',
            'invoice_numbers' => 'nullable|array',
            'installment_count' => 'nullable|integer|min:1',
        ]);

        // Set defaults
        $validated['created_by'] = auth()->id();
        $validated['exchange_rate'] = $validated['exchange_rate'] ?? 1;
        $validated['status'] = 'pending';
        $validated['approval_status'] = 'pending';

        $collection = Collection::create($validated);

        return redirect()->route('accounting.collections.show', $collection)
            ->with('success', 'Tahsilat kaydı başarıyla oluşturuldu.');
    }

    /**
     * Display the specified collection
     */
    public function show(Collection $collection): Response
    {
        $collection->load([
            'currentAccount', 
            'paymentMethod', 
            'paymentTerm',
            'bankAccount',
            'collector',
            'approver',
            'reconciler',
            'creator', 
            'updater'
        ]);

        // Add computed attributes
        $collection->collection_type_text = $collection->getCollectionTypeTextAttribute();
        $collection->status_text = $collection->getStatusTextAttribute();
        $collection->status_color = $collection->getStatusColorAttribute();
        $collection->formatted_amount = $collection->getFormattedAmountAttribute();
        $collection->formatted_net_amount = $collection->getFormattedNetAmountAttribute();
        $collection->is_overdue = $collection->getIsOverdueAttribute();
        $collection->is_maturity_today = $collection->getIsMaturityTodayAttribute();
        $collection->is_maturity_soon = $collection->getIsMaturitySoonAttribute();

        return Inertia::render('Accounting/Collections/Show', [
            'collection' => $collection,
        ]);
    }

    /**
     * Show the form for editing the specified collection
     */
    public function edit(Collection $collection): Response
    {
        $collection->load(['currentAccount', 'paymentMethod', 'paymentTerm', 'bankAccount']);

        $paymentMethods = PaymentMethod::active()->ordered()->get();
        $paymentTerms = PaymentTerm::active()->ordered()->get();
        $bankAccounts = BankAccount::active()->get();
        $currentAccounts = CurrentAccount::active()->customers()->get(['id', 'account_code', 'title']);

        return Inertia::render('Accounting/Collections/Edit', [
            'collection' => $collection,
            'paymentMethods' => $paymentMethods,
            'paymentTerms' => $paymentTerms,
            'bankAccounts' => $bankAccounts,
            'currentAccounts' => $currentAccounts,
        ]);
    }

    /**
     * Update the specified collection
     */
    public function update(Request $request, Collection $collection): RedirectResponse
    {
        $validated = $request->validate([
            'current_account_id' => 'required|exists:current_accounts,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'payment_term_id' => 'nullable|exists:payment_terms,id',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'collection_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|in:TRY,USD,EUR,GBP',
            'exchange_rate' => 'nullable|numeric|min:0.000001',
            'collection_type' => 'required|in:invoice_payment,advance_payment,partial_payment,overpayment,refund,adjustment,other',
            'reference_number' => 'nullable|string|max:100',
            'document_number' => 'nullable|string|max:100',
            'document_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'maturity_date' => 'nullable|date',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'commission_amount' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'check_number' => 'nullable|string|max:50',
            'check_bank' => 'nullable|string|max:100',
            'check_branch' => 'nullable|string|max:100',
            'check_account' => 'nullable|string|max:50',
            'promissory_note_number' => 'nullable|string|max:50',
            'promissory_note_guarantor' => 'nullable|string|max:200',
            'is_advance_payment' => 'boolean',
            'invoice_numbers' => 'nullable|array',
            'installment_count' => 'nullable|integer|min:1',
        ]);

        $validated['updated_by'] = auth()->id();
        $validated['exchange_rate'] = $validated['exchange_rate'] ?? 1;

        $collection->update($validated);

        return redirect()->route('accounting.collections.show', $collection)
            ->with('success', 'Tahsilat kaydı başarıyla güncellendi.');
    }

    /**
     * Remove the specified collection
     */
    public function destroy(Collection $collection): RedirectResponse
    {
        if ($collection->status === 'collected' && $collection->is_reconciled) {
            return redirect()->route('accounting.collections.index')
                ->with('error', 'Tahsil edilmiş ve mutabakat yapılmış kayıt silinemez.');
        }

        $collection->delete();

        return redirect()->route('accounting.collections.index')
            ->with('success', 'Tahsilat kaydı başarıyla silindi.');
    }

    /**
     * Mark collection as collected
     */
    public function markAsCollected(Collection $collection): RedirectResponse
    {
        $collection->markAsCollected();

        return redirect()->route('accounting.collections.show', $collection)
            ->with('success', 'Tahsilat başarıyla tamamlandı.');
    }

    /**
     * Mark collection as bounced
     */
    public function markAsBounced(Request $request, Collection $collection): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        $collection->markAsBounced($validated['reason']);

        return redirect()->route('accounting.collections.show', $collection)
            ->with('success', 'Tahsilat karşılıksız olarak işaretlendi.');
    }

    /**
     * Reconcile collection
     */
    public function reconcile(Request $request, Collection $collection): RedirectResponse
    {
        $validated = $request->validate([
            'bank_statement_reference' => 'nullable|string|max:100'
        ]);

        $collection->reconcile($validated['bank_statement_reference']);

        return redirect()->route('accounting.collections.show', $collection)
            ->with('success', 'Tahsilat mutabakatı yapıldı.');
    }

    /**
     * Approve collection
     */
    public function approve(Request $request, Collection $collection): RedirectResponse
    {
        $validated = $request->validate([
            'approval_notes' => 'nullable|string'
        ]);

        $collection->approve(auth()->id(), $validated['approval_notes']);

        return redirect()->route('accounting.collections.show', $collection)
            ->with('success', 'Tahsilat onaylandı.');
    }

    /**
     * Reject collection
     */
    public function reject(Request $request, Collection $collection): RedirectResponse
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500'
        ]);

        $collection->reject(auth()->id(), $validated['rejection_reason']);

        return redirect()->route('accounting.collections.show', $collection)
            ->with('success', 'Tahsilat reddedildi.');
    }

    /**
     * Get maturity calendar
     */
    public function maturityCalendar(Request $request): Response
    {
        $startDate = $request->get('start', now()->startOfMonth());
        $endDate = $request->get('end', now()->endOfMonth());

        $collections = Collection::with(['currentAccount', 'paymentMethod'])
            ->whereBetween('maturity_date', [$startDate, $endDate])
            ->whereIn('status', ['pending', 'partial'])
            ->get()
            ->map(function ($collection) {
                return [
                    'id' => $collection->id,
                    'title' => $collection->currentAccount->title . ' - ' . $collection->formatted_amount,
                    'start' => $collection->maturity_date->format('Y-m-d'),
                    'amount' => $collection->amount,
                    'currency' => $collection->currency,
                    'collection_number' => $collection->collection_number,
                    'status' => $collection->status,
                    'payment_method' => $collection->paymentMethod->name,
                ];
            });

        return Inertia::render('Accounting/Collections/MaturityCalendar', [
            'collections' => $collections,
        ]);
    }

    /**
     * Export collections
     */
    public function export(Request $request)
    {
        // TODO: Implement Excel/CSV export
        return redirect()->route('accounting.collections.index')
            ->with('info', 'Export özelliği yakında eklenecek.');
    }
}