<?php

namespace App\Http\Controllers;

use App\Models\Tax;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SettingsTaxController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of the taxes.
     */
    public function index(Request $request): Response
    {
        $query = Tax::query();

        // Search filter
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Type filter
        if ($request->filled('type')) {
            $query->where('type', $request->get('type'));
        }

        $taxes = $query->orderBy('is_default', 'desc')
                      ->orderBy('name')
                      ->paginate(20)
                      ->withQueryString();

        return Inertia::render('Settings/Tax/Index', [
            'taxes' => $taxes,
            'filters' => $request->only(['search', 'is_active', 'type']),
            'flash' => [
                'success' => session('success'),
                'error' => session('error')
            ]
        ]);
    }

    /**
     * Store a newly created tax.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:taxes,code',
            'type' => 'required|in:percentage,fixed',
            'rate' => 'required_if:type,percentage|nullable|numeric|min:0|max:100',
            'fixed_amount' => 'required_if:type,fixed|nullable|numeric|min:0',
            'description' => 'nullable|string|max:500',
            'country' => 'required|string|max:100',
            'is_active' => 'boolean',
            'is_default' => 'boolean'
        ]);

        // If setting as default, remove default from others
        if ($validated['is_default'] ?? false) {
            Tax::where('is_default', true)->update(['is_default' => false]);
        }

        // Set rate or fixed_amount based on type
        if ($validated['type'] === 'percentage') {
            $validated['fixed_amount'] = null;
        } else {
            $validated['rate'] = null;
        }

        Tax::create($validated);

        return redirect()->route('settings.tax.index')
            ->with('success', 'Vergi başarıyla eklendi.');
    }

    /**
     * Update the specified tax.
     */
    public function update(Request $request, Tax $tax): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:taxes,code,' . $tax->id,
            'type' => 'required|in:percentage,fixed',
            'rate' => 'required_if:type,percentage|nullable|numeric|min:0|max:100',
            'fixed_amount' => 'required_if:type,fixed|nullable|numeric|min:0',
            'description' => 'nullable|string|max:500',
            'country' => 'required|string|max:100',
            'is_active' => 'boolean',
            'is_default' => 'boolean'
        ]);

        // If setting as default, remove default from others
        if ($validated['is_default'] ?? false) {
            Tax::where('id', '!=', $tax->id)
               ->where('is_default', true)
               ->update(['is_default' => false]);
        }

        // Set rate or fixed_amount based on type
        if ($validated['type'] === 'percentage') {
            $validated['fixed_amount'] = null;
        } else {
            $validated['rate'] = null;
        }

        $tax->update($validated);

        return redirect()->route('settings.tax.index')
            ->with('success', 'Vergi başarıyla güncellendi.');
    }

    /**
     * Remove the specified tax.
     */
    public function destroy(Tax $tax): RedirectResponse
    {
        // Check if tax is being used
        if ($tax->products()->exists()) {
            return redirect()->route('settings.tax.index')
                ->with('error', 'Bu vergi silinemiyor çünkü ürünlerde kullanılıyor.');
        }

        // Prevent deleting default tax
        if ($tax->is_default) {
            return redirect()->route('settings.tax.index')
                ->with('error', 'Varsayılan vergi silinemez.');
        }

        $tax->delete();

        return redirect()->route('settings.tax.index')
            ->with('success', 'Vergi başarıyla silindi.');
    }

    /**
     * Set tax as default
     */
    public function setDefault(Tax $tax): RedirectResponse
    {
        // Remove default from all taxes
        Tax::where('is_default', true)->update(['is_default' => false]);
        
        // Set this tax as default
        $tax->update(['is_default' => true]);

        return redirect()->route('settings.tax.index')
            ->with('success', 'Varsayılan vergi güncellendi.');
    }

    /**
     * Toggle tax status
     */
    public function toggleStatus(Tax $tax): RedirectResponse
    {
        $tax->update(['is_active' => !$tax->is_active]);

        $status = $tax->is_active ? 'aktif' : 'pasif';
        return redirect()->route('settings.tax.index')
            ->with('success', "Vergi {$status} duruma getirildi.");
    }
}
