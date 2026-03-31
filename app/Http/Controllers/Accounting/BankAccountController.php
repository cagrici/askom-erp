<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;

class BankAccountController extends Controller
{
    /**
     * Display bank accounts dashboard
     */
    public function index(Request $request): Response
    {
        $query = BankAccount::query();

        // Filtering
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('account_name', 'like', "%{$search}%")
                  ->orWhere('bank_name', 'like', "%{$search}%")
                  ->orWhere('iban', 'like', "%{$search}%")
                  ->orWhere('account_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('bank_name')) {
            $query->where('bank_name', 'like', "%{$request->bank_name}%");
        }

        if ($request->filled('currency')) {
            $query->where('currency', $request->currency);
        }

        if ($request->filled('account_type')) {
            $query->where('account_type', $request->account_type);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active === '1');
        }

        // Sorting
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $bankAccounts = $query->paginate(20)->withQueryString();

        // Transform the bank accounts data to include computed attributes
        $bankAccounts->getCollection()->transform(function ($account) {
            $account->account_type_text = $account->getAccountTypeTextAttribute();
            $account->formatted_account_number = $account->getFormattedAccountNumberAttribute();
            return $account;
        });

        // Statistics
        $stats = [
            'total_accounts' => BankAccount::count(),
            'active_accounts' => BankAccount::where('is_active', true)->count(),
            'try_accounts' => BankAccount::where('currency', 'TRY')->count(),
            'foreign_accounts' => BankAccount::where('currency', '!=', 'TRY')->count(),
            'business_accounts' => BankAccount::where('account_type', 'business')->count(),
            'default_account' => BankAccount::where('is_default', true)->first(),
        ];

        // Currencies distribution
        $currencyDistribution = BankAccount::selectRaw('currency, COUNT(*) as count')
            ->groupBy('currency')
            ->pluck('count', 'currency')
            ->toArray();

        // Account types distribution
        $typeDistribution = BankAccount::selectRaw('account_type, COUNT(*) as count')
            ->groupBy('account_type')
            ->get()
            ->mapWithKeys(function ($item) {
                $typeText = match($item->account_type) {
                    'checking' => 'Vadesiz',
                    'savings' => 'Vadeli',
                    'business' => 'Ticari',
                    'other' => 'Diğer',
                    default => $item->account_type
                };
                return [$typeText => $item->count];
            })->toArray();

        // Banks distribution
        $bankDistribution = BankAccount::selectRaw('bank_name, COUNT(*) as count')
            ->groupBy('bank_name')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->pluck('count', 'bank_name')
            ->toArray();

        return Inertia::render('Accounting/BankAccounts/Index', [
            'bankAccounts' => $bankAccounts,
            'stats' => $stats,
            'charts' => [
                'currencyDistribution' => $currencyDistribution,
                'typeDistribution' => $typeDistribution,
                'bankDistribution' => $bankDistribution,
            ],
            'filters' => $request->all([
                'search', 'bank_name', 'currency', 'account_type', 
                'is_active', 'sort_field', 'sort_direction'
            ]),
        ]);
    }

    /**
     * Show the form for creating a new bank account
     */
    public function create(): Response
    {
        return Inertia::render('Accounting/BankAccounts/Create');
    }

    /**
     * Store a newly created bank account
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'account_name' => 'required|string|max:200',
            'bank_name' => 'required|string|max:100',
            'branch_name' => 'nullable|string|max:100',
            'branch_code' => 'nullable|string|max:20',
            'account_number' => 'required|string|max:50',
            'iban' => 'nullable|string|max:34|unique:bank_accounts,iban',
            'swift_code' => 'nullable|string|max:11',
            'currency' => 'required|in:TRY,USD,EUR,GBP',
            'account_type' => 'required|in:checking,savings,business,other',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
        ], [
            'account_name.required' => 'Hesap adı zorunludur.',
            'bank_name.required' => 'Banka adı zorunludur.',
            'account_number.required' => 'Hesap numarası zorunludur.',
            'iban.unique' => 'Bu IBAN numarası zaten kayıtlı.',
            'currency.required' => 'Para birimi seçilmelidir.',
            'account_type.required' => 'Hesap tipi seçilmelidir.',
        ]);

        // If this is set as default, remove default from others
        if ($validated['is_default'] ?? false) {
            BankAccount::where('is_default', true)->update(['is_default' => false]);
        }

        // If no default account exists and this is the first account, make it default
        if (!isset($validated['is_default']) && BankAccount::count() === 0) {
            $validated['is_default'] = true;
        }

        $bankAccount = BankAccount::create($validated);

        return redirect()->route('accounting.bank-accounts.show', $bankAccount)
            ->with('success', 'Banka hesabı başarıyla oluşturuldu.');
    }

    /**
     * Display the specified bank account
     */
    public function show(BankAccount $bankAccount): Response
    {
        // Add computed attributes
        $bankAccount->account_type_text = $bankAccount->getAccountTypeTextAttribute();
        $bankAccount->formatted_account_number = $bankAccount->getFormattedAccountNumberAttribute();

        return Inertia::render('Accounting/BankAccounts/Show', [
            'bankAccount' => $bankAccount,
        ]);
    }

    /**
     * Show the form for editing the specified bank account
     */
    public function edit(BankAccount $bankAccount): Response
    {
        return Inertia::render('Accounting/BankAccounts/Edit', [
            'bankAccount' => $bankAccount,
        ]);
    }

    /**
     * Update the specified bank account
     */
    public function update(Request $request, BankAccount $bankAccount): RedirectResponse
    {
        $validated = $request->validate([
            'account_name' => 'required|string|max:200',
            'bank_name' => 'required|string|max:100',
            'branch_name' => 'nullable|string|max:100',
            'branch_code' => 'nullable|string|max:20',
            'account_number' => 'required|string|max:50',
            'iban' => [
                'nullable',
                'string',
                'max:34',
                Rule::unique('bank_accounts', 'iban')->ignore($bankAccount->id)
            ],
            'swift_code' => 'nullable|string|max:11',
            'currency' => 'required|in:TRY,USD,EUR,GBP',
            'account_type' => 'required|in:checking,savings,business,other',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
        ], [
            'account_name.required' => 'Hesap adı zorunludur.',
            'bank_name.required' => 'Banka adı zorunludur.',
            'account_number.required' => 'Hesap numarası zorunludur.',
            'iban.unique' => 'Bu IBAN numarası zaten kayıtlı.',
            'currency.required' => 'Para birimi seçilmelidir.',
            'account_type.required' => 'Hesap tipi seçilmelidir.',
        ]);

        // If this is set as default, remove default from others
        if ($validated['is_default'] ?? false) {
            BankAccount::where('id', '!=', $bankAccount->id)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $bankAccount->update($validated);

        return redirect()->route('accounting.bank-accounts.show', $bankAccount)
            ->with('success', 'Banka hesabı başarıyla güncellendi.');
    }

    /**
     * Remove the specified bank account
     */
    public function destroy(BankAccount $bankAccount): RedirectResponse
    {
        // Check if this account is used in collections
        $collectionsCount = \App\Models\Collection::where('bank_account_id', $bankAccount->id)->count();
        
        if ($collectionsCount > 0) {
            return redirect()->route('accounting.bank-accounts.index')
                ->with('error', 'Bu banka hesabı tahsilat kayıtlarında kullanıldığı için silinemez.');
        }

        // If this is the default account, set another one as default
        if ($bankAccount->is_default) {
            $newDefault = BankAccount::where('id', '!=', $bankAccount->id)
                ->where('is_active', true)
                ->first();
            
            if ($newDefault) {
                $newDefault->update(['is_default' => true]);
            }
        }

        $bankAccount->delete();

        return redirect()->route('accounting.bank-accounts.index')
            ->with('success', 'Banka hesabı başarıyla silindi.');
    }

    /**
     * Toggle account status
     */
    public function toggleStatus(BankAccount $bankAccount): RedirectResponse
    {
        $bankAccount->update([
            'is_active' => !$bankAccount->is_active,
        ]);

        $status = $bankAccount->is_active ? 'aktif' : 'pasif';
        
        return redirect()->route('accounting.bank-accounts.index')
            ->with('success', "Banka hesabı {$status} duruma getirildi.");
    }

    /**
     * Set as default account
     */
    public function setDefault(BankAccount $bankAccount): RedirectResponse
    {
        // Remove default from all accounts
        BankAccount::where('is_default', true)->update(['is_default' => false]);
        
        // Set this account as default
        $bankAccount->update(['is_default' => true]);

        return redirect()->route('accounting.bank-accounts.index')
            ->with('success', 'Varsayılan banka hesabı olarak ayarlandı.');
    }

    /**
     * Validate IBAN
     */
    public function validateIban(Request $request)
    {
        $iban = $request->get('iban');
        
        if (!$iban) {
            return response()->json(['valid' => false, 'message' => 'IBAN boş olamaz']);
        }

        // Basic IBAN validation (TR for Turkey)
        if (substr($iban, 0, 2) === 'TR' && strlen($iban) === 26) {
            $isValid = $this->checkIbanChecksum($iban);
            return response()->json([
                'valid' => $isValid,
                'message' => $isValid ? 'Geçerli IBAN' : 'Geçersiz IBAN kontrolü'
            ]);
        }

        return response()->json(['valid' => false, 'message' => 'Geçersiz IBAN formatı']);
    }

    /**
     * Simple IBAN checksum validation
     */
    private function checkIbanChecksum($iban): bool
    {
        // Move first 4 characters to end
        $rearranged = substr($iban, 4) . substr($iban, 0, 4);
        
        // Replace letters with numbers (A=10, B=11, ..., Z=35)
        $numeric = '';
        for ($i = 0; $i < strlen($rearranged); $i++) {
            $char = $rearranged[$i];
            if (is_numeric($char)) {
                $numeric .= $char;
            } else {
                $numeric .= (ord(strtoupper($char)) - ord('A') + 10);
            }
        }
        
        // Calculate mod 97
        return bcmod($numeric, 97) === '1';
    }

    /**
     * Export bank accounts
     */
    public function export(Request $request)
    {
        // TODO: Implement Excel/CSV export
        return redirect()->route('accounting.bank-accounts.index')
            ->with('info', 'Export özelliği yakında eklenecek.');
    }
}