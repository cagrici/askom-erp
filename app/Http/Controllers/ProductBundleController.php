<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductBundle;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductBundleController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductBundle::with(['product', 'bundleItems.product']);

        // Arama
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
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

        $bundles = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Products/Bundles/Index', [
            'bundles' => $bundles,
            'filters' => $request->all(['search', 'product_id', 'is_active']),
            'products' => Product::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Products/Bundles/Create', [
            'products' => Product::select('id', 'name', 'sku', 'price')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'bundle_price' => 'nullable|numeric|min:0',
            'discount_type' => 'required|in:fixed,percentage',
            'discount_value' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'bundle_items' => 'required|array|min:2',
            'bundle_items.*.product_id' => 'required|exists:products,id',
            'bundle_items.*.quantity' => 'required|integer|min:1',
            'bundle_items.*.price_override' => 'nullable|numeric|min:0',
        ]);

        $bundle = ProductBundle::create($validated);

        // Bundle items oluştur
        foreach ($validated['bundle_items'] as $item) {
            $bundle->bundleItems()->create($item);
        }

        return redirect()->route('product-bundles.index')
            ->with('success', 'Ürün seti başarıyla oluşturuldu.');
    }

    public function show(ProductBundle $productBundle)
    {
        $productBundle->load(['product', 'bundleItems.product']);
        
        return Inertia::render('Products/Bundles/Show', [
            'bundle' => $productBundle
        ]);
    }

    public function edit(ProductBundle $productBundle)
    {
        $productBundle->load(['product', 'bundleItems.product']);

        return Inertia::render('Products/Bundles/Edit', [
            'bundle' => $productBundle,
            'products' => Product::select('id', 'name', 'sku', 'price')->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, ProductBundle $productBundle)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'bundle_price' => 'nullable|numeric|min:0',
            'discount_type' => 'required|in:fixed,percentage',
            'discount_value' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'bundle_items' => 'required|array|min:2',
            'bundle_items.*.product_id' => 'required|exists:products,id',
            'bundle_items.*.quantity' => 'required|integer|min:1',
            'bundle_items.*.price_override' => 'nullable|numeric|min:0',
        ]);

        $productBundle->update($validated);

        // Bundle items güncelle
        $productBundle->bundleItems()->delete();
        foreach ($validated['bundle_items'] as $item) {
            $productBundle->bundleItems()->create($item);
        }

        return redirect()->route('product-bundles.index')
            ->with('success', 'Ürün seti başarıyla güncellendi.');
    }

    public function destroy(ProductBundle $productBundle)
    {
        $productBundle->delete();

        return redirect()->route('product-bundles.index')
            ->with('success', 'Ürün seti başarıyla silindi.');
    }

    public function calculateBundlePrice(Request $request)
    {
        $validated = $request->validate([
            'bundle_items' => 'required|array|min:1',
            'bundle_items.*.product_id' => 'required|exists:products,id',
            'bundle_items.*.quantity' => 'required|integer|min:1',
            'bundle_items.*.price_override' => 'nullable|numeric|min:0',
            'discount_type' => 'required|in:fixed,percentage',
            'discount_value' => 'nullable|numeric|min:0',
        ]);

        $totalPrice = 0;

        foreach ($validated['bundle_items'] as $item) {
            $product = Product::find($item['product_id']);
            $itemPrice = $item['price_override'] ?? $product->price ?? 0;
            $totalPrice += $itemPrice * $item['quantity'];
        }

        $bundlePrice = $totalPrice;

        if ($validated['discount_value'] > 0) {
            if ($validated['discount_type'] === 'fixed') {
                $bundlePrice = max(0, $totalPrice - $validated['discount_value']);
            } else { // percentage
                $bundlePrice = $totalPrice * (1 - ($validated['discount_value'] / 100));
            }
        }

        return response()->json([
            'total_price' => $totalPrice,
            'bundle_price' => round($bundlePrice, 2),
            'savings' => round($totalPrice - $bundlePrice, 2),
        ]);
    }
}