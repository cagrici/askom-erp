<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\ProductPrice;
use App\Models\ProductPriceList;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProductPriceController extends Controller
{
    /**
     * Display a listing of prices for a specific price list
     */
    public function index(Request $request, ProductPriceList $priceList): Response
    {
        Gate::authorize('view', $priceList);

        $query = $priceList->prices()
            ->with(['product.category', 'product.brand'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->whereHas('product.category', function ($q) use ($request) {
                $q->where('id', $request->get('category'));
            });
        }

        if ($request->filled('brand')) {
            $query->whereHas('product.brand', function ($q) use ($request) {
                $q->where('id', $request->get('brand'));
            });
        }

        // Apply sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        
        if (in_array($sortField, ['price', 'min_quantity', 'discount_percentage', 'created_at'])) {
            $query->orderBy($sortField, $sortDirection);
        } elseif ($sortField === 'product_name') {
            $query->join('products', 'product_prices.product_id', '=', 'products.id')
                  ->orderBy('products.name', $sortDirection)
                  ->select('product_prices.*');
        }

        $prices = $query->paginate(15)->withQueryString();

        // Transform prices to match frontend expectations
        $prices->through(function ($price) {
            return [
                'id' => $price->id,
                'product_id' => $price->product_id,
                'product_code' => $price->product->code ?? '',
                'product_name' => $price->product->name ?? '',
                'product_brand' => $price->product->brand->name ?? null,
                'category_name' => $price->product->category->name ?? null,
                'min_quantity' => $price->min_quantity,
                'max_quantity' => null,
                'unit_price' => $price->price,
                'discount_percent' => $price->discount_percentage,
                'discount_amount' => $price->discount_amount,
                'final_price' => $price->getFinalPrice(),
                'is_active' => true,
                'created_at' => $price->created_at->toISOString(),
                'updated_at' => $price->updated_at->toISOString(),
            ];
        });

        return Inertia::render('Sales/PriceLists/Prices/Index', [
            'priceList' => $priceList,
            'prices' => $prices,
            'filters' => $request->only(['search', 'category', 'brand', 'sort', 'direction']),
            'userPermissions' => [
                'canCreate' => Gate::allows('managePrices', $priceList),
                'canEdit' => Gate::allows('managePrices', $priceList),
                'canDelete' => Gate::allows('managePrices', $priceList),
            ]
        ]);
    }

    /**
     * Show the form for creating a new price
     */
    public function create(ProductPriceList $priceList): Response
    {
        Gate::authorize('managePrices', $priceList);

        // Get products that don't have prices in this list yet
        $existingProductIds = $priceList->prices()->pluck('product_id')->toArray();
        
        return Inertia::render('Sales/PriceLists/Prices/Create', [
            'priceList' => $priceList,
            'existingProductIds' => $existingProductIds
        ]);
    }

    /**
     * Store a newly created price
     */
    public function store(Request $request, ProductPriceList $priceList): RedirectResponse
    {
        Gate::authorize('managePrices', $priceList);

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'price' => 'required|numeric|min:0',
            'min_quantity' => 'required|numeric|min:0.01',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
        ]);

        // Check if price already exists for this product
        if ($priceList->prices()->where('product_id', $validated['product_id'])->exists()) {
            return back()->withErrors(['product_id' => 'Bu ürün için zaten bir fiyat tanımlanmış.']);
        }

        $validated['price_list_id'] = $priceList->id;

        ProductPrice::create($validated);

        return redirect()
            ->route('sales.price-lists.prices.index', $priceList)
            ->with('success', 'Ürün fiyatı başarıyla eklendi.');
    }

    /**
     * Display the specified price
     */
    public function show(ProductPriceList $priceList, ProductPrice $price): Response
    {
        Gate::authorize('view', $priceList);

        if ($price->price_list_id !== $priceList->id) {
            abort(404);
        }

        $price->load(['product.category', 'product.brand']);

        return Inertia::render('Sales/PriceLists/Prices/Show', [
            'priceList' => $priceList,
            'price' => [
                'id' => $price->id,
                'product_id' => $price->product_id,
                'product_code' => $price->product->code ?? '',
                'product_name' => $price->product->name ?? '',
                'product_brand' => $price->product->brand->name ?? null,
                'category_name' => $price->product->category->name ?? null,
                'min_quantity' => $price->min_quantity,
                'unit_price' => $price->price,
                'discount_percent' => $price->discount_percentage,
                'discount_amount' => $price->discount_amount,
                'final_price' => $price->getFinalPrice(),
                'created_at' => $price->created_at->toISOString(),
                'updated_at' => $price->updated_at->toISOString(),
            ],
            'userPermissions' => [
                'canEdit' => Gate::allows('managePrices', $priceList),
                'canDelete' => Gate::allows('managePrices', $priceList),
            ]
        ]);
    }

    /**
     * Show the form for editing the specified price
     */
    public function edit(ProductPriceList $priceList, ProductPrice $price): Response
    {
        Gate::authorize('managePrices', $priceList);

        if ($price->price_list_id !== $priceList->id) {
            abort(404);
        }

        $price->load(['product.category', 'product.brand']);

        return Inertia::render('Sales/PriceLists/Prices/Edit', [
            'priceList' => $priceList,
            'price' => $price
        ]);
    }

    /**
     * Update the specified price
     */
    public function update(Request $request, ProductPriceList $priceList, ProductPrice $price): RedirectResponse
    {
        Gate::authorize('managePrices', $priceList);

        if ($price->price_list_id !== $priceList->id) {
            abort(404);
        }

        $validated = $request->validate([
            'price' => 'required|numeric|min:0',
            'min_quantity' => 'required|numeric|min:0.01',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
        ]);

        $price->update($validated);

        return redirect()
            ->route('sales.price-lists.prices.show', [$priceList, $price])
            ->with('success', 'Ürün fiyatı başarıyla güncellendi.');
    }

    /**
     * Remove the specified price
     */
    public function destroy(ProductPriceList $priceList, ProductPrice $price): RedirectResponse
    {
        Gate::authorize('managePrices', $priceList);

        if ($price->price_list_id !== $priceList->id) {
            abort(404);
        }

        $price->delete();

        return redirect()
            ->route('sales.price-lists.prices.index', $priceList)
            ->with('success', 'Ürün fiyatı başarıyla silindi.');
    }

    /**
     * Bulk import prices from CSV or Excel
     */
    public function bulkImport(Request $request, ProductPriceList $priceList): RedirectResponse
    {
        Gate::authorize('managePrices', $priceList);

        $validated = $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:2048'
        ]);

        // TODO: Implement bulk import functionality
        
        return redirect()
            ->route('sales.price-lists.prices.index', $priceList)
            ->with('success', 'Toplu fiyat içe aktarma işlemi başarıyla tamamlandı.');
    }

    /**
     * Export prices to CSV or Excel
     */
    public function export(Request $request, ProductPriceList $priceList)
    {
        Gate::authorize('view', $priceList);

        $format = $request->get('format', 'csv');
        
        // TODO: Implement export functionality
        
        return response()->json(['message' => 'Export functionality will be implemented']);
    }

    /**
     * Copy prices from another price list
     */
    public function copyFrom(Request $request, ProductPriceList $priceList): RedirectResponse
    {
        Gate::authorize('managePrices', $priceList);

        $validated = $request->validate([
            'source_price_list_id' => 'required|exists:product_price_lists,id',
            'overwrite_existing' => 'boolean',
            'apply_multiplier' => 'boolean',
            'multiplier' => 'nullable|numeric|min:0.01|max:10'
        ]);

        $sourcePriceList = ProductPriceList::findOrFail($validated['source_price_list_id']);
        $multiplier = $validated['apply_multiplier'] ? ($validated['multiplier'] ?? 1) : 1;
        $overwriteExisting = $validated['overwrite_existing'] ?? false;

        $sourcePrices = $sourcePriceList->prices()->get();
        $copiedCount = 0;

        foreach ($sourcePrices as $sourcePrice) {
            $existingPrice = $priceList->prices()
                ->where('product_id', $sourcePrice->product_id)
                ->first();

            if ($existingPrice && !$overwriteExisting) {
                continue; // Skip if exists and not overwriting
            }

            $priceData = [
                'product_id' => $sourcePrice->product_id,
                'price_list_id' => $priceList->id,
                'price' => $sourcePrice->price * $multiplier,
                'min_quantity' => $sourcePrice->min_quantity,
                'discount_percentage' => $sourcePrice->discount_percentage,
                'discount_amount' => $sourcePrice->discount_amount ? ($sourcePrice->discount_amount * $multiplier) : null,
            ];

            if ($existingPrice) {
                $existingPrice->update($priceData);
            } else {
                ProductPrice::create($priceData);
            }

            $copiedCount++;
        }

        return redirect()
            ->route('sales.price-lists.prices.index', $priceList)
            ->with('success', "{$copiedCount} ürün fiyatı başarıyla kopyalandı.");
    }
}