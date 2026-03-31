<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\CurrentAccount;
use App\Models\CurrentAccountDeliveryAddress;
use App\Services\LogoCariEkstreService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;

class CurrentAccountController extends Controller
{
    /**
     * Display a listing of current accounts.
     */
    public function index(Request $request): Response
    {
        $query = CurrentAccount::with(['creator']);

        // Filtreleme
        if ($request->filled('search')) {
            $search = $request->search;
            $query->turkishSearch(['title', 'account_code', 'tax_number', 'email', 'phone_1'], $search);
        }

        if ($request->filled('account_type')) {
            $query->where('account_type', $request->account_type);
        }

        if ($request->filled('person_type')) {
            $query->where('person_type', $request->person_type);
        }

        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true)->where('is_blocked', false);
            } elseif ($request->status === 'blocked') {
                $query->where('is_blocked', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        if ($request->filled('has_balance')) {
            if ($request->has_balance === '1') {
                $query->where('current_balance', '!=', 0);
            }
        }

        if ($request->filled('overdue')) {
            if ($request->overdue === '1') {
                $query->where('overdue_amount', '>', 0);
            }
        }

        // Sıralama
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        
        // Validate sort field - only allow specific columns
        $allowedSortFields = [
            'id', 'account_code', 'title', 'account_type', 'person_type', 
            'city', 'phone_1', 'email', 'credit_limit', 'currency', 
            'created_at', 'updated_at'
        ];
        
        if (!in_array($sortField, $allowedSortFields) || empty($sortField)) {
            $sortField = 'created_at';
        }
        
        // Validate sort direction
        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }
        
        $query->orderBy($sortField, $sortDirection);

        $accounts = $query->paginate(20)->withQueryString();

        // İstatistikler
        $stats = [
            'total' => CurrentAccount::count(),
            'active' => CurrentAccount::active()->notBlocked()->count(),
            'customers' => CurrentAccount::customers()->active()->count(),
            'suppliers' => CurrentAccount::suppliers()->active()->count(),
            'blocked' => CurrentAccount::where('is_blocked', true)->count(),
            'with_balance' => CurrentAccount::withBalance()->count(),
            'overdue' => CurrentAccount::overdue()->count(),
            'total_receivables' => CurrentAccount::sum('total_receivables'),
            'total_payables' => CurrentAccount::sum('total_payables'),
        ];

        // Filtre seçenekleri
        $cities = CurrentAccount::distinct()->pluck('city')->filter()->sort()->values();
        
        return Inertia::render('Accounting/CurrentAccounts/Index', [
            'accounts' => $accounts,
            'stats' => $stats,
            'cities' => $cities,
            'filters' => $request->all(['search', 'account_type', 'person_type', 'city', 'status', 'has_balance', 'overdue', 'sort_field', 'sort_direction']),
        ]);
    }

    /**
     * Show the form for creating a new current account.
     */
    public function create(Request $request): Response
    {
        // Eğer type parametresi gönderilmişse, default account_type olarak ayarla
        $defaultType = $request->get('type', null);
        
        return Inertia::render('Accounting/CurrentAccounts/Create', [
            'defaultType' => $defaultType
        ]);
    }

    /**
     * Store a newly created current account.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'account_type' => 'required|in:customer,supplier,both,personnel,shareholder,other',
            'person_type' => 'required|in:individual,corporate',
            'account_code' => 'nullable|string|max:20|unique:current_accounts,account_code',
            
            // Vergi bilgileri
            'tax_number' => 'nullable|string|max:11',
            'tax_office' => 'nullable|string|max:100',
            'tax_office_id' => 'nullable|integer|exists:tax_offices,id',
            'mersys_no' => 'nullable|string|max:20',
            'trade_registry_no' => 'nullable|string|max:50',
            
            // Şirket bilgileri
            'employee_count' => 'nullable|integer|min:0|max:999999',
            'annual_revenue' => 'nullable|numeric|min:0',
            'establishment_year' => 'nullable|integer|min:1800|max:' . date('Y'),
            
            // İletişim bilgileri
            'address' => 'nullable|string',
            'district' => 'nullable|string|max:100',
            'district_id' => 'nullable|integer|exists:districts,id',
            'city' => 'nullable|string|max:100',
            'city_id' => 'nullable|integer|exists:cities,id',
            'postal_code' => 'nullable|string|max:10',
            'country' => 'nullable|string|max:100',
            'country_id' => 'nullable|integer|exists:countries,id',
            'phone_1' => 'nullable|string|max:20',
            'phone_2' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:20',
            'fax' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'website' => 'nullable|url|max:200',
            
            // Yetkili kişi
            'contact_person' => 'nullable|string|max:100',
            'contact_title' => 'nullable|string|max:100',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:150',
            
            // Mali bilgiler
            'credit_limit' => 'nullable|numeric|min:0',
            'payment_term_days' => 'nullable|integer|min:0',
            'discount_rate' => 'nullable|numeric|min:0|max:100',
            'currency' => 'nullable|in:TRY,USD,EUR,GBP',
            'risk_limit' => 'nullable|numeric|min:0',
            
            // E-Fatura
            'e_invoice_enabled' => 'boolean',
            'e_invoice_address' => 'nullable|string|max:200',
            'e_archive_enabled' => 'boolean',
            'gib_alias' => 'nullable|string|max:100',
            
            // Kategori
            'category' => 'nullable|string|max:100',
            'sector' => 'nullable|string|max:100',
            'region' => 'nullable|string|max:100',
            'sales_representative_id' => 'nullable|exists:sales_representatives,id',
            
            // Durum
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
            
            // CRM ve ek alanlar
            'additional_contacts' => 'nullable|array',
            'payment_term_id' => 'nullable|integer|exists:payment_terms,id',
            'payment_method_id' => 'nullable|integer|exists:payment_methods,id',
            'lead_source' => 'nullable|string|max:100',
            'customer_segment' => 'nullable|string|max:100',
            'preferred_language' => 'nullable|string|max:10',
            'communication_preferences' => 'nullable|array',
            'crm_notes' => 'nullable|string',
        ], [
            'establishment_year.min' => 'Kuruluş yılı en az 1800 olmalıdır.',
            'establishment_year.max' => 'Kuruluş yılı ' . date('Y') . ' yılından büyük olamaz.',
            'employee_count.min' => 'Çalışan sayısı 0\'dan küçük olamaz.',
            'employee_count.max' => 'Çalışan sayısı çok büyük.',
            'annual_revenue.min' => 'Yıllık ciro 0\'dan küçük olamaz.',
            'title.required' => 'Cari kart adı zorunludur.',
            'account_type.required' => 'Hesap tipi seçilmelidir.',
            'person_type.required' => 'Kişi tipi seçilmelidir.',
            'tax_number.max' => 'Vergi/TC numarası en fazla 11 karakter olabilir.',
            'email.email' => 'Geçerli bir e-posta adresi giriniz.',
            'website.url' => 'Geçerli bir web sitesi adresi giriniz.',
            'contact_email.email' => 'Geçerli bir iletişim e-postası giriniz.',
        ]);

        // Defaults
        $validated['created_by'] = auth()->id();
        $validated['currency'] = $validated['currency'] ?? 'TRY';
        $validated['country'] = $validated['country'] ?? 'Türkiye';

        $account = CurrentAccount::create($validated);

        // Eğer tedarikçi oluşturulduysa suppliers.index'e yönlendir
        if ($account->account_type === 'supplier') {
            return redirect()->route('suppliers.index')
                ->with('success', 'Tedarikçi başarıyla oluşturuldu.');
        }

        return redirect()->route('accounting.current-accounts.show', $account)
            ->with('success', 'Cari kart başarıyla oluşturuldu.');
    }

    /**
     * Display the specified current account.
     */
    public function show(CurrentAccount $currentAccount): Response
    {
        $currentAccount->load(['creator', 'updater']);

        // Load delivery addresses
        $deliveryAddresses = $currentAccount->deliveryAddresses()
            ->where('is_active', true)
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();

        // Load transactions from Logo Tiger
        $transactions = [];
        $ekstreData = [];
        if ($currentAccount->logo_id) {
            $ekstreService = app(LogoCariEkstreService::class);
            $result = $ekstreService->getTransactions($currentAccount->logo_id);
            if ($result['success']) {
                $transactions = $result['transactions'];
                $ekstreData = [
                    'totalDebit' => $result['totalDebit'],
                    'totalCredit' => $result['totalCredit'],
                    'closingBalance' => $result['closingBalance'],
                ];

                // Logo'dan gelen güncel bakiye bilgilerini set et
                $currentAccount->total_receivables = round($result['totalDebit'], 2);
                $currentAccount->total_payables = round($result['totalCredit'], 2);
                $currentAccount->current_balance = round($result['totalDebit'] - $result['totalCredit'], 2);
            }
        }

        return Inertia::render('Accounting/CurrentAccounts/Show', [
            'account' => $currentAccount,
            'deliveryAddresses' => $deliveryAddresses,
            'transactions' => $transactions,
            'ekstreData' => $ekstreData,
        ]);
    }

    /**
     * Show the form for editing the specified current account.
     */
    public function edit(CurrentAccount $currentAccount): Response
    {
        $currentAccount->load(['creator', 'updater']);

        return Inertia::render('Accounting/CurrentAccounts/Edit', [
            'account' => $currentAccount,
        ]);
    }

    /**
     * Update the specified current account.
     */
    public function update(Request $request, CurrentAccount $currentAccount): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'account_type' => 'required|in:customer,supplier,both,personnel,shareholder,other',
            'person_type' => 'required|in:individual,corporate',
            'account_code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('current_accounts', 'account_code')->ignore($currentAccount->id)
            ],
            
            // Vergi bilgileri
            'tax_number' => 'nullable|string|max:11',
            'tax_office' => 'nullable|string|max:100',
            'tax_office_id' => 'nullable|integer|exists:tax_offices,id',
            'mersys_no' => 'nullable|string|max:20',
            'trade_registry_no' => 'nullable|string|max:50',
            
            // Şirket bilgileri
            'employee_count' => 'nullable|integer|min:0|max:999999',
            'annual_revenue' => 'nullable|numeric|min:0',
            'establishment_year' => 'nullable|integer|min:1800|max:' . date('Y'),
            
            // İletişim bilgileri
            'address' => 'nullable|string',
            'district' => 'nullable|string|max:100',
            'district_id' => 'nullable|integer|exists:districts,id',
            'city' => 'nullable|string|max:100',
            'city_id' => 'nullable|integer|exists:cities,id',
            'postal_code' => 'nullable|string|max:10',
            'country' => 'nullable|string|max:100',
            'country_id' => 'nullable|integer|exists:countries,id',
            'phone_1' => 'nullable|string|max:20',
            'phone_2' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:20',
            'fax' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'website' => 'nullable|url|max:200',
            
            // Yetkili kişi
            'contact_person' => 'nullable|string|max:100',
            'contact_title' => 'nullable|string|max:100',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:150',
            
            // Mali bilgiler
            'credit_limit' => 'nullable|numeric|min:0',
            'payment_term_days' => 'nullable|integer|min:0',
            'discount_rate' => 'nullable|numeric|min:0|max:100',
            'currency' => 'nullable|in:TRY,USD,EUR,GBP',
            'risk_limit' => 'nullable|numeric|min:0',
            
            // E-Fatura
            'e_invoice_enabled' => 'boolean',
            'e_invoice_address' => 'nullable|string|max:200',
            'e_archive_enabled' => 'boolean',
            'gib_alias' => 'nullable|string|max:100',
            
            // Kategori
            'category' => 'nullable|string|max:100',
            'sector' => 'nullable|string|max:100',
            'region' => 'nullable|string|max:100',
            'sales_representative_id' => 'nullable|exists:sales_representatives,id',
            
            // Durum
            'is_active' => 'boolean',
            'is_blocked' => 'boolean',
            'block_reason' => 'nullable|string',
            'notes' => 'nullable|string',
            
            // CRM ve ek alanlar
            'additional_contacts' => 'nullable|array',
            'payment_term_id' => 'nullable|integer|exists:payment_terms,id',
            'payment_method_id' => 'nullable|integer|exists:payment_methods,id',
            'lead_source' => 'nullable|string|max:100',
            'customer_segment' => 'nullable|string|max:100',
            'preferred_language' => 'nullable|string|max:10',
            'communication_preferences' => 'nullable|array',
            'crm_notes' => 'nullable|string',
        ], [
            'establishment_year.min' => 'Kuruluş yılı en az 1800 olmalıdır.',
            'establishment_year.max' => 'Kuruluş yılı ' . date('Y') . ' yılından büyük olamaz.',
            'employee_count.min' => 'Çalışan sayısı 0\'dan küçük olamaz.',
            'employee_count.max' => 'Çalışan sayısı çok büyük.',
            'annual_revenue.min' => 'Yıllık ciro 0\'dan küçük olamaz.',
            'title.required' => 'Cari kart adı zorunludur.',
            'account_type.required' => 'Hesap tipi seçilmelidir.',
            'person_type.required' => 'Kişi tipi seçilmelidir.',
            'tax_number.max' => 'Vergi/TC numarası en fazla 11 karakter olabilir.',
            'email.email' => 'Geçerli bir e-posta adresi giriniz.',
            'website.url' => 'Geçerli bir web sitesi adresi giriniz.',
            'contact_email.email' => 'Geçerli bir iletişim e-postası giriniz.',
        ]);

        $validated['updated_by'] = auth()->id();

        $currentAccount->update($validated);

        // Eğer tedarikçi güncellendiyse suppliers.index'e yönlendir
        if ($currentAccount->account_type === 'supplier') {
            return redirect()->route('suppliers.index')
                ->with('success', 'Tedarikçi başarıyla güncellendi.');
        }

        return redirect()->route('accounting.current-accounts.index')
            ->with('success', 'Cari kart başarıyla güncellendi.');
    }

    /**
     * Remove the specified current account.
     */
    public function destroy(CurrentAccount $currentAccount): RedirectResponse
    {
        // İşlem kontrolü - eğer cari kartla ilgili fatura/hareket varsa silme
        // Bu kontrol ileride invoice/transaction tabloları oluşturulduğunda eklenecek
        
        $currentAccount->delete();

        return redirect()->route('accounting.current-accounts.index')
            ->with('success', 'Cari kart başarıyla silindi.');
    }

    /**
     * Toggle account status
     */
    public function toggleStatus(CurrentAccount $currentAccount): RedirectResponse
    {
        $currentAccount->update([
            'is_active' => !$currentAccount->is_active,
            'updated_by' => auth()->id()
        ]);

        $status = $currentAccount->is_active ? 'aktif' : 'pasif';
        
        return redirect()->route('accounting.current-accounts.index')
            ->with('success', "Cari kart {$status} duruma getirildi.");
    }

    /**
     * Toggle block status
     */
    public function toggleBlock(Request $request, CurrentAccount $currentAccount): RedirectResponse
    {
        $validated = $request->validate([
            'block_reason' => 'required_if:action,block|nullable|string'
        ]);

        $currentAccount->update([
            'is_blocked' => !$currentAccount->is_blocked,
            'block_reason' => $currentAccount->is_blocked ? null : $validated['block_reason'],
            'updated_by' => auth()->id()
        ]);

        $status = $currentAccount->is_blocked ? 'bloke edildi' : 'blokesi kaldırıldı';
        
        return redirect()->route('accounting.current-accounts.index')
            ->with('success', "Cari kart {$status}.");
    }

    /**
     * Export current accounts
     */
    public function export(Request $request)
    {
        // Excel export işlemi için placeholder
        // Maatwebsite/Laravel-Excel package kullanılabilir

        return redirect()->route('accounting.current-accounts.index')
            ->with('info', 'Export özelliği yakında eklenecek.');
    }

    /**
     * Download account statement (cari ekstre) as PDF
     */
    public function downloadEkstre(Request $request, CurrentAccount $currentAccount)
    {
        $startDate = $request->get('start_date', now()->startOfYear()->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        if (!$currentAccount->logo_id) {
            abort(404, 'Bu cari kartın Logo bağlantısı bulunamadı.');
        }

        $ekstreService = app(LogoCariEkstreService::class);
        $result = $ekstreService->getTransactions($currentAccount->logo_id, $startDate, $endDate);

        if (!$result['success']) {
            abort(500, 'Logo veritabanından veri alınamadı: ' . $result['error']);
        }

        $transactions = collect($result['transactions']);

        $pdf = Pdf::loadView('pdf.current-account-statement', [
            'account' => $currentAccount,
            'transactions' => $transactions,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'totalDebit' => $result['totalDebit'],
            'totalCredit' => $result['totalCredit'],
            'closingBalance' => $result['closingBalance'],
        ])
        ->setPaper('a4', 'landscape')
        ->setOptions([
            'isRemoteEnabled' => true,
            'isHtml5ParserEnabled' => true,
            'defaultFont' => 'DejaVu Sans',
        ]);

        $filename = "cari-ekstre-{$currentAccount->account_code}-" . now()->format('Ymd') . ".pdf";

        return $pdf->download($filename);
    }

    /**
     * Get account suggestions for autocomplete
     */
    public function suggestions(Request $request)
    {
        $query = $request->get('q', '');
        $type = $request->get('type', ''); // customer, supplier, both
        
        $accounts = CurrentAccount::active()
            ->notBlocked()
            ->when($type, function($q) use ($type) {
                if ($type === 'customer') {
                    $q->customers();
                } elseif ($type === 'supplier') {
                    $q->suppliers();
                } else {
                    $q->where('account_type', $type);
                }
            })
            ->turkishSearch(['title', 'account_code'], $query)
            ->select('id', 'account_code', 'title', 'account_type', 'current_balance', 'currency')
            ->limit(10)
            ->get();

        return response()->json($accounts);
    }

    /**
     * Get delivery addresses for a current account
     */
    public function getDeliveryAddresses(CurrentAccount $currentAccount)
    {
        $addresses = $currentAccount->deliveryAddresses()
            ->where('is_active', true)
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();

        return response()->json($addresses);
    }

    /**
     * Store a new delivery address for a current account
     */
    public function storeDeliveryAddress(Request $request, CurrentAccount $currentAccount)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'contact_person' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'country_id' => 'nullable|integer',
            'city_id' => 'nullable|integer',
            'district_id' => 'nullable|integer',
            'postal_code' => 'nullable|string|max:10',
            'type' => 'required|in:shipping,billing,both',
            'delivery_notes' => 'nullable|string',
            'delivery_hours' => 'nullable|string|max:255',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $validated['current_account_id'] = $currentAccount->id;
        $validated['is_default'] = $validated['is_default'] ?? false;
        $validated['is_active'] = $validated['is_active'] ?? true;

        // If this is set as default, unset other default addresses
        if ($validated['is_default']) {
            $currentAccount->deliveryAddresses()
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $address = $currentAccount->deliveryAddresses()->create($validated);

        return response()->json($address, 201);
    }

    /**
     * Update a delivery address
     */
    public function updateDeliveryAddress(Request $request, CurrentAccount $currentAccount, CurrentAccountDeliveryAddress $deliveryAddress)
    {
        // Ensure the delivery address belongs to this current account
        if ($deliveryAddress->current_account_id !== $currentAccount->id) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'contact_person' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'country_id' => 'nullable|integer',
            'city_id' => 'nullable|integer',
            'district_id' => 'nullable|integer',
            'postal_code' => 'nullable|string|max:10',
            'type' => 'required|in:shipping,billing,both',
            'delivery_notes' => 'nullable|string',
            'delivery_hours' => 'nullable|string|max:255',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $validated['is_default'] = $validated['is_default'] ?? false;
        $validated['is_active'] = $validated['is_active'] ?? true;

        // If this is set as default, unset other default addresses
        if ($validated['is_default']) {
            $currentAccount->deliveryAddresses()
                ->where('is_default', true)
                ->where('id', '!=', $deliveryAddress->id)
                ->update(['is_default' => false]);
        }

        $deliveryAddress->update($validated);

        return response()->json($deliveryAddress);
    }

    /**
     * Delete a delivery address
     */
    public function destroyDeliveryAddress(CurrentAccount $currentAccount, CurrentAccountDeliveryAddress $deliveryAddress)
    {
        // Ensure the delivery address belongs to this current account
        if ($deliveryAddress->current_account_id !== $currentAccount->id) {
            abort(404);
        }
        
        $deliveryAddress->delete();

        return response()->json(['message' => 'Address deleted successfully']);
    }
}