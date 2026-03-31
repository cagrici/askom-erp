<?php

namespace App\Http\Controllers;

use App\Models\ProductUnit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductUnitController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductUnit::with('product');

        // Arama
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('unit_name', 'like', '%' . $request->search . '%')
                  ->orWhere('unit_code', 'like', '%' . $request->search . '%')
                  ->orWhere('barcode', 'like', '%' . $request->search . '%')
                  ->orWhereHas('product', function ($productQuery) use ($request) {
                      $productQuery->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        // Durum filtresi
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Base unit filtresi
        if ($request->has('is_base_unit')) {
            $query->where('is_base_unit', $request->boolean('is_base_unit'));
        }

        // Product filtresi
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        $units = $query->orderBy('product_id')
            ->orderBy('is_base_unit', 'desc')
            ->orderBy('sort_order')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Products/Units/Index', [
            'units' => $units,
            'filters' => $request->all(['search', 'is_active', 'is_base_unit', 'product_id']),
            'products' => \App\Models\Product::select('id', 'name')->orderBy('name')->get()
        ]);
    }

    public function create()
    {
        return Inertia::render('Products/Units/Create', [
            'products' => \App\Models\Product::select('id', 'name')->orderBy('name')->get(),
            'commonUnits' => ProductUnit::commonUnits()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'unit_name' => 'required|string|max:50',
            'unit_code' => 'required|string|max:20',
            'conversion_factor' => 'required|numeric|min:0',
            'barcode' => 'nullable|string|max:50|unique:product_units,barcode',
            'sale_price' => 'nullable|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'min_sale_price' => 'nullable|numeric|min:0',
            'min_order_quantity' => 'nullable|integer|min:1',
            'is_base_unit' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        // Ensure unique unit_code per product
        $existingUnit = ProductUnit::where('product_id', $validated['product_id'])
            ->where('unit_code', $validated['unit_code'])
            ->first();

        if ($existingUnit) {
            return back()->withErrors(['unit_code' => 'Bu ürün için bu birim kodu zaten kullanılıyor.']);
        }

        ProductUnit::create($validated);

        return redirect()->route('product-units.index')
            ->with('success', 'Ürün birimi başarıyla oluşturuldu.');
    }

    public function show(ProductUnit $productUnit)
    {
        return Inertia::render('Products/Units/Show', [
            'unit' => $productUnit->load('product')
        ]);
    }

    public function edit(ProductUnit $productUnit)
    {
        return Inertia::render('Products/Units/Edit', [
            'unit' => $productUnit->load('product'),
            'products' => \App\Models\Product::select('id', 'name')->orderBy('name')->get(),
            'commonUnits' => ProductUnit::commonUnits()
        ]);
    }

    public function update(Request $request, ProductUnit $productUnit)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'unit_name' => 'required|string|max:50',
            'unit_code' => 'required|string|max:20',
            'conversion_factor' => 'required|numeric|min:0',
            'barcode' => 'nullable|string|max:50|unique:product_units,barcode,' . $productUnit->id,
            'sale_price' => 'nullable|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'min_sale_price' => 'nullable|numeric|min:0',
            'min_order_quantity' => 'nullable|integer|min:1',
            'is_base_unit' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        // Ensure unique unit_code per product (excluding current record)
        $existingUnit = ProductUnit::where('product_id', $validated['product_id'])
            ->where('unit_code', $validated['unit_code'])
            ->where('id', '!=', $productUnit->id)
            ->first();

        if ($existingUnit) {
            return back()->withErrors(['unit_code' => 'Bu ürün için bu birim kodu zaten kullanılıyor.']);
        }

        $productUnit->update($validated);

        return redirect()->route('product-units.index')
            ->with('success', 'Ürün birimi başarıyla güncellendi.');
    }

    public function destroy(ProductUnit $productUnit)
    {
        // Check if this is a base unit with other dependent units
        if ($productUnit->is_base_unit) {
            $dependentUnits = ProductUnit::where('product_id', $productUnit->product_id)
                ->where('is_base_unit', false)
                ->count();
                
            if ($dependentUnits > 0) {
                return back()->withErrors(['delete' => 'Ana birim silinmeden önce bağımlı birimler silinmelidir.']);
            }
        }

        $productUnit->delete();

        return redirect()->route('product-units.index')
            ->with('success', 'Ürün birimi başarıyla silindi.');
    }
}