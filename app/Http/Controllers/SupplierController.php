<?php

namespace App\Http\Controllers;

use App\Models\CurrentAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = CurrentAccount::where('account_type', 'supplier');

        // Arama
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('account_code', 'like', '%' . $request->search . '%')
                  ->orWhere('contact_person', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('tax_number', 'like', '%' . $request->search . '%');
            });
        }

        // Durum filtresi
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Kişi tipi filtresi
        if ($request->filled('person_type')) {
            $query->where('person_type', $request->person_type);
        }

        $suppliers = $query->orderBy('title')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Purchasing/Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters' => $request->all(['search', 'is_active', 'person_type']),
            'personTypes' => [
                ['value' => 'individual', 'label' => 'Gerçek Kişi'],
                ['value' => 'corporate', 'label' => 'Tüzel Kişi']
            ]
        ]);
    }

    public function create()
    {
        return redirect()->route('accounting.current-accounts.create', ['type' => 'supplier']);
    }

    public function store(Request $request)
    {
        // Redirect to current-accounts store with supplier type
        $request->merge(['account_type' => 'supplier']);
        return redirect()->route('accounting.current-accounts.store')
            ->withInput($request->all());
    }

    public function apiStore(Request $request)
    {
        // Permission check
        if (!auth()->user()->hasRole('Super Admin') && !auth()->user()->can('create suppliers')) {
            return response()->json(['error' => 'Bu işlem için yetkiniz yok.'], 403);
        }

        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'account_code' => 'nullable|string|unique:current_accounts,account_code',
                'person_type' => 'nullable|in:individual,corporate',
                'phone_1' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:150',
                'is_active' => 'boolean',
            ]);

            // Code oluştur
            if (empty($validated['account_code'])) {
                $lastAccount = CurrentAccount::where('account_type', 'supplier')->orderBy('id', 'desc')->first();
                $nextNumber = $lastAccount ? $lastAccount->id + 1 : 1;
                $validated['account_code'] = '320.' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
            }

            $validated['is_active'] = $validated['is_active'] ?? true;
            $validated['account_type'] = 'supplier';
            $validated['person_type'] = $validated['person_type'] ?? 'corporate';

            $supplier = CurrentAccount::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Tedarikçi başarıyla oluşturuldu.',
                'data' => [
                    'id' => $supplier->id,
                    'name' => $supplier->title . ' (' . $supplier->account_code . ')',
                    'code' => $supplier->account_code
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation hatası.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Tedarikçi oluşturulurken bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(CurrentAccount $supplier)
    {
        // Tedarikçi olduğunu kontrol et
        if ($supplier->account_type !== 'supplier') {
            abort(404);
        }
        
        return Inertia::render('Purchasing/Suppliers/Show', [
            'supplier' => $supplier
        ]);
    }

    public function edit(CurrentAccount $supplier)
    {
        // Tedarikçi olduğunu kontrol et
        if ($supplier->account_type !== 'supplier') {
            abort(404);
        }
        
        return redirect()->route('accounting.current-accounts.edit', [$supplier->id, 'type' => 'supplier']);
    }

    public function update(Request $request, CurrentAccount $supplier)
    {
        // Tedarikçi olduğunu kontrol et
        if ($supplier->account_type !== 'supplier') {
            abort(404);
        }
        
        // Redirect to current-accounts update with supplier type
        $request->merge(['account_type' => 'supplier']);
        return redirect()->route('accounting.current-accounts.update', $supplier->id)
            ->withInput($request->all());
    }

    public function destroy(CurrentAccount $supplier)
    {
        // Tedarikçi olduğunu kontrol et
        if ($supplier->account_type !== 'supplier') {
            abort(404);
        }
        
        // İlişkili sipariş kontrolü
        if ($supplier->purchaseOrders()->exists()) {
            return back()->withErrors(['error' => 'Bu tedarikçiye ait aktif siparişler var. Tedarikçi silinemez.']);
        }

        $supplier->delete();

        return redirect()->route('suppliers.index')
            ->with('success', 'Tedarikçi başarıyla silindi.');
    }
}