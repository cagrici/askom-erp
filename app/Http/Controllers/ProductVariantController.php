<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductAttribute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductVariantController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductVariant::with(['product', 'attributeValues.attribute']);

        // Arama
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('variant_code', 'like', '%' . $request->search . '%')
                  ->orWhere('variant_name', 'like', '%' . $request->search . '%')
                  ->orWhereHas('product', function($productQuery) use ($request) {
                      $productQuery->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        // Ürün filtresi
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        // Durum filtresi
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Stok durumu filtresi
        if ($request->filled('stock_status')) {
            if ($request->stock_status === 'in_stock') {
                $query->where('stock_quantity', '>', 0);
            } elseif ($request->stock_status === 'out_of_stock') {
                $query->where('stock_quantity', '<=', 0);
            } elseif ($request->stock_status === 'low_stock') {
                $query->where('stock_quantity', '>', 0)
                      ->where('stock_quantity', '<=', 10); // Düşük stok sınırı
            }
        }

        $variants = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Products/Variants/Index', [
            'variants' => $variants,
            'filters' => $request->all(['search', 'product_id', 'is_active', 'stock_status']),
            'products' => Product::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Products/Variants/Create', [
            'products' => Product::select('id', 'name')->orderBy('name')->get(),
            'attributes' => ProductAttribute::where('is_variant', true)
                ->with('attributeValues')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_name' => 'required|string|max:255',
            'variant_code' => 'nullable|string|unique:product_variants,variant_code',
            'barcode' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'attributes' => 'nullable|array',
        ]);

        // Variant code oluştur
        if (empty($validated['variant_code'])) {
            $product = Product::find($validated['product_id']);
            $variantCount = ProductVariant::where('product_id', $validated['product_id'])->count();
            $validated['variant_code'] = $product->code . '-V' . str_pad($variantCount + 1, 3, '0', STR_PAD_LEFT);
        }

        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['stock_quantity'] = $validated['stock_quantity'] ?? 0;
        $validated['attributes'] = $validated['attributes'] ?? [];

        ProductVariant::create($validated);

        return redirect()->route('product-variants.index')
            ->with('success', 'Ürün varyantı başarıyla oluşturuldu.');
    }

    public function show(ProductVariant $productVariant)
    {
        $productVariant->load(['product', 'attributeValues.attribute']);
        
        return Inertia::render('Products/Variants/Show', [
            'variant' => $productVariant
        ]);
    }

    public function edit(ProductVariant $productVariant)
    {
        $productVariant->load(['product', 'attributeValues']);

        return Inertia::render('Products/Variants/Edit', [
            'variant' => $productVariant,
            'products' => Product::select('id', 'name')->orderBy('name')->get(),
            'attributes' => ProductAttribute::where('is_variant', true)
                ->with('attributeValues')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function update(Request $request, ProductVariant $productVariant)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_name' => 'required|string|max:255',
            'variant_code' => 'nullable|string|unique:product_variants,variant_code,' . $productVariant->id,
            'barcode' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'attributes' => 'nullable|array',
        ]);

        $validated['attributes'] = $validated['attributes'] ?? [];

        $productVariant->update($validated);

        return redirect()->route('product-variants.index')
            ->with('success', 'Ürün varyantı başarıyla güncellendi.');
    }

    public function destroy(ProductVariant $productVariant)
    {
        $productVariant->delete();

        return redirect()->route('product-variants.index')
            ->with('success', 'Ürün varyantı başarıyla silindi.');
    }

    public function bulkUpdateStock(Request $request)
    {
        $validated = $request->validate([
            'variants' => 'required|array',
            'variants.*.id' => 'required|exists:product_variants,id',
            'variants.*.stock_quantity' => 'required|integer|min:0',
        ]);

        foreach ($validated['variants'] as $variantData) {
            ProductVariant::where('id', $variantData['id'])
                ->update(['stock_quantity' => $variantData['stock_quantity']]);
        }

        return redirect()->back()
            ->with('success', 'Stok miktarları başarıyla güncellendi.');
    }
}