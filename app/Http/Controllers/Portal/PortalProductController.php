<?php

namespace App\Http\Controllers\Portal;

use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PortalProductController extends BasePortalController
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'images', 'unit'])
            ->where('is_active', true);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($request->filled('category')) {
            $query->where('category_id', $request->category);
        }

        // Sort
        $sortField = $request->get('sort', 'name');
        $sortDirection = $request->get('direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $products = $query->paginate(24)->withQueryString();
        $categories = ProductCategory::where('is_active', true)->get();

        return Inertia::render('Portal/Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'sort', 'direction']),
        ]);
    }

    public function show($id)
    {
        $product = Product::with([
            'category',
            'images',
            'unit',
            'brand',
            'supplier'
        ])->findOrFail($id);

        // Get related products from same category
        $relatedProducts = Product::with(['images', 'unit'])
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->where('is_active', true)
            ->limit(4)
            ->get();

        return Inertia::render('Portal/Products/Show', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
        ]);
    }

    public function addToFavorites(Request $request, $id)
    {
        $customerId = $this->getSelectedAccountId();
        $product = Product::findOrFail($id);

        // Toggle favorite (you'll need to create favorites table)
        // For now, just return success
        return back()->with('success', 'Ürün favorilere eklendi.');
    }
}
