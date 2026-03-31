<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\LogoPriceSyncCompleteMail;
use App\Models\ProductPriceList;
use App\Models\CurrentAccount;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Services\LogoPriceSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductPriceListController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of price lists
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', ProductPriceList::class);

        $query = ProductPriceList::query()
            ->withCount('prices')
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->filled('currency')) {
            $query->where('currency', $request->get('currency'));
        }

        if ($request->filled('status')) {
            $status = $request->get('status');
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Apply sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        
        if (in_array($sortField, ['name', 'code', 'type', 'currency', 'is_active', 'is_default', 'created_at'])) {
            $query->orderBy($sortField, $sortDirection);
        }

        $priceLists = $query->paginate(15)->withQueryString();

        return Inertia::render('Sales/PriceLists/Index', [
            'priceLists' => $priceLists,
            'filters' => $request->only(['search', 'type', 'currency', 'status', 'sort', 'direction']),
            'types' => [
                'sale' => 'Satış',
                'purchase' => 'Alış',
                'special' => 'Özel'
            ],
            'currencies' => [
                'TRY' => 'Türk Lirası',
                'USD' => 'Amerikan Doları',
                'EUR' => 'Euro'
            ],
            'userPermissions' => [
                'canCreate' => Gate::allows('create', ProductPriceList::class),
                'canEdit' => auth()->user()->hasPermissionTo('sales.price_lists.edit') || auth()->user()->hasRole(['admin', 'sales-manager']),
                'canDelete' => auth()->user()->hasPermissionTo('sales.price_lists.delete') || auth()->user()->hasRole(['admin']),
            ]
        ]);
    }

    /**
     * Show the form for creating a new price list
     */
    public function create(): Response
    {
        Gate::authorize('create', ProductPriceList::class);

        // Get customer groups for assignment
        $customerGroups = collect(CurrentAccount::CUSTOMER_GROUPS)->map(function ($label, $value) {
            return ['value' => $value, 'label' => $label];
        })->values()->toArray();

        return Inertia::render('Sales/PriceLists/Create', [
            'types' => [
                'sale' => 'Satış',
                'purchase' => 'Alış',
                'special' => 'Özel'
            ],
            'currencies' => [
                'TRY' => 'Türk Lirası',
                'USD' => 'Amerikan Doları',
                'EUR' => 'Euro'
            ],
            'customerGroups' => $customerGroups
        ]);
    }

    /**
     * Store a newly created price list
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', ProductPriceList::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:product_price_lists,code',
            'description' => 'nullable|string|max:1000',
            'type' => 'required|in:sale,purchase,special',
            'currency' => 'required|string|size:3',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'customer_groups' => 'nullable|array',
            'customer_groups.*' => 'string|in:' . implode(',', array_keys(CurrentAccount::CUSTOMER_GROUPS))
        ]);

        // Auto-generate code if not provided
        if (empty($validated['code'])) {
            $validated['code'] = 'PL-' . strtoupper(uniqid());
        }

        // If this is set as default, remove default from others
        if ($validated['is_default'] ?? false) {
            ProductPriceList::where('type', $validated['type'])
                ->where('currency', $validated['currency'])
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $priceList = ProductPriceList::create($validated);

        return redirect()
            ->route('sales.price-lists.show', $priceList)
            ->with('success', 'Fiyat listesi başarıyla oluşturuldu.');
    }

    /**
     * Display the specified price list
     */
    public function show(ProductPriceList $priceList): Response
    {
        Gate::authorize('view', $priceList);

        $priceList->load(['prices.product.category', 'prices.product.brand']);
        
        // Transform prices to match frontend expectations
        $priceList->prices->transform(function ($price) {
            return [
                'id' => $price->id,
                'product_id' => $price->product_id,
                'product_code' => $price->product->code ?? '',
                'product_name' => $price->product->name ?? '',
                'product_brand' => $price->product->brand->name ?? null,
                'min_quantity' => $price->min_quantity,
                'max_quantity' => null, // Not implemented in current model
                'unit_price' => $price->price,
                'discount_percent' => $price->discount_percentage,
                'final_price' => $price->getFinalPrice(),
                'margin_percent' => null, // Not implemented in current model
                'cost_price' => null, // Not implemented in current model
                'is_active' => true, // Not implemented in current model
                'valid_from' => null, // Not implemented in current model
                'valid_until' => null, // Not implemented in current model
                'created_at' => $price->created_at->toISOString(),
                'updated_at' => $price->updated_at->toISOString(),
            ];
        });

        // Get pricing statistics
        $stats = [
            'total_products' => $priceList->prices()->count(),
            'avg_price' => $priceList->prices()->avg('price'),
            'min_price' => $priceList->prices()->min('price'),
            'max_price' => $priceList->prices()->max('price'),
            'total_discounted' => $priceList->prices()
                ->where(function ($q) {
                    $q->where('discount_percentage', '>', 0)
                      ->orWhere('discount_amount', '>', 0);
                })->count()
        ];

        // Get customer groups for display
        $customerGroups = collect(CurrentAccount::CUSTOMER_GROUPS)->map(function ($label, $value) {
            return ['value' => $value, 'label' => $label];
        })->values()->toArray();
        
        return Inertia::render('Sales/PriceLists/Show', [
            'priceList' => $priceList,
            'stats' => $stats,
            'types' => [
                'sale' => 'Satış',
                'purchase' => 'Alış',
                'special' => 'Özel'
            ],
            'currencies' => [
                'TRY' => 'Türk Lirası',
                'USD' => 'Amerikan Doları',
                'EUR' => 'Euro'
            ],
            'customerGroups' => $customerGroups,
            'userPermissions' => [
                'canEdit' => Gate::allows('update', $priceList),
                'canDelete' => Gate::allows('delete', $priceList),
                'canManagePrices' => Gate::allows('managePrices', $priceList),
            ]
        ]);
    }

    /**
     * Show the form for editing the specified price list
     */
    public function edit(ProductPriceList $priceList): Response
    {
        Gate::authorize('update', $priceList);

        // Get customer groups for assignment
        $customerGroups = collect(CurrentAccount::CUSTOMER_GROUPS)->map(function ($label, $value) {
            return ['value' => $value, 'label' => $label];
        })->values()->toArray();

        return Inertia::render('Sales/PriceLists/Edit', [
            'priceList' => $priceList,
            'types' => [
                'sale' => 'Satış',
                'purchase' => 'Alış',
                'special' => 'Özel'
            ],
            'currencies' => [
                'TRY' => 'Türk Lirası',
                'USD' => 'Amerikan Doları',
                'EUR' => 'Euro'
            ],
            'customerGroups' => $customerGroups
        ]);
    }

    /**
     * Update the specified price list
     */
    public function update(Request $request, ProductPriceList $priceList): RedirectResponse
    {
        Gate::authorize('update', $priceList);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('product_price_lists', 'code')->ignore($priceList->id)
            ],
            'description' => 'nullable|string|max:1000',
            'type' => 'required|in:sale,purchase,special',
            'currency' => 'required|string|size:3',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'customer_groups' => 'nullable|array',
            'customer_groups.*' => 'string|in:' . implode(',', array_keys(CurrentAccount::CUSTOMER_GROUPS))
        ]);

        // If this is set as default, remove default from others
        if ($validated['is_default'] ?? false) {
            ProductPriceList::where('type', $validated['type'])
                ->where('currency', $validated['currency'])
                ->where('is_default', true)
                ->where('id', '!=', $priceList->id)
                ->update(['is_default' => false]);
        }

        $priceList->update($validated);

        return redirect()
            ->route('sales.price-lists.show', $priceList)
            ->with('success', 'Fiyat listesi başarıyla güncellendi.');
    }

    /**
     * Export price list to Excel/CSV
     */
    public function export(Request $request, ProductPriceList $priceList)
    {
        Gate::authorize('view', $priceList);

        $format = $request->get('format', 'excel'); // excel, csv
        
        $priceList->load(['prices.product.category', 'prices.product.brand']);
        
        $data = [];
        $data[] = [
            'Ürün Kodu',
            'Ürün Adı', 
            'Kategori',
            'Marka',
            'Minimum Miktar',
            'Birim Fiyat',
            'İndirim %',
            'İndirim Tutar',
            'Final Fiyat',
            'Para Birimi',
            'Oluşturulma Tarihi',
            'Güncellenme Tarihi'
        ];

        foreach ($priceList->prices as $price) {
            $data[] = [
                $price->product->code ?? '',
                $price->product->name ?? '',
                $price->product->category->name ?? '',
                $price->product->brand->name ?? '',
                $price->min_quantity,
                $price->price,
                $price->discount_percentage ?? 0,
                $price->discount_amount ?? 0,
                $price->getFinalPrice(),
                $priceList->currency,
                $price->created_at->format('Y-m-d H:i:s'),
                $price->updated_at->format('Y-m-d H:i:s'),
            ];
        }

        $filename = "fiyat_listesi_{$priceList->code}_" . date('Y-m-d_H-i-s');
        
        if ($format === 'csv') {
            $filename .= '.csv';
            
            $output = fopen('php://temp', 'w');
            
            // Add UTF-8 BOM for proper encoding in Excel
            fputs($output, "\xEF\xBB\xBF");
            
            foreach ($data as $row) {
                fputcsv($output, $row, ';'); // Use semicolon for Excel compatibility
            }
            
            rewind($output);
            $content = stream_get_contents($output);
            fclose($output);
            
            return response($content)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', "attachment; filename=\"{$filename}\"")
                ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                ->header('Pragma', 'no-cache')
                ->header('Expires', '0');
        }
        
        // Excel format would need a library like PhpSpreadsheet
        // For now, return CSV as fallback
        return $this->export($request->merge(['format' => 'csv']), $priceList);
    }

    /**
     * Show import form
     */
    public function importForm(ProductPriceList $priceList)
    {
        Gate::authorize('update', $priceList);

        return Inertia::render('Sales/PriceLists/Import', [
            'priceList' => $priceList
        ]);
    }

    /**
     * Import prices from Excel/CSV file
     */
    public function import(Request $request, ProductPriceList $priceList)
    {
        Gate::authorize('update', $priceList);

        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:10240', // 10MB max
            'has_header' => 'boolean',
            'update_existing' => 'boolean'
        ]);

        try {
            $file = $request->file('file');
            $hasHeader = $request->boolean('has_header', true);
            $updateExisting = $request->boolean('update_existing', false);
            
            $path = $file->store('temp-imports');
            $fullPath = storage_path('app/' . $path);
            
            $results = $this->processImportFile($fullPath, $priceList, $hasHeader, $updateExisting);
            
            // Clean up temp file
            unlink($fullPath);
            
            return back()->with('success', 
                "Import tamamlandı: {$results['success']} başarılı, {$results['errors']} hata, {$results['skipped']} atlandı."
            )->with('import_details', $results);
            
        } catch (\Exception $e) {
            return back()->with('error', 'Import işlemi başarısız: ' . $e->getMessage());
        }
    }

    /**
     * Process import file and return results
     */
    private function processImportFile(string $filePath, ProductPriceList $priceList, bool $hasHeader, bool $updateExisting): array
    {
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);
        
        if ($extension === 'csv') {
            return $this->processCsvImport($filePath, $priceList, $hasHeader, $updateExisting);
        }
        
        // For Excel files, you would need PhpSpreadsheet library
        throw new \Exception('Excel import not implemented yet. Please use CSV format.');
    }

    /**
     * Process CSV import
     */
    private function processCsvImport(string $filePath, ProductPriceList $priceList, bool $hasHeader, bool $updateExisting): array
    {
        $handle = fopen($filePath, 'r');
        
        if (!$handle) {
            throw new \Exception('Dosya açılamadı.');
        }

        $results = [
            'success' => 0,
            'errors' => 0,
            'skipped' => 0,
            'details' => []
        ];

        $rowNumber = 0;
        
        // Skip header if exists
        if ($hasHeader) {
            fgetcsv($handle, 1000, ';');
            $rowNumber++;
        }

        while (($row = fgetcsv($handle, 1000, ';')) !== false) {
            $rowNumber++;
            
            try {
                // Expected format: product_code, min_quantity, price, discount_percentage, discount_amount
                if (count($row) < 3) {
                    $results['errors']++;
                    $results['details'][] = "Satır {$rowNumber}: Yetersiz sütun sayısı";
                    continue;
                }

                $productCode = trim($row[0]);
                $minQuantity = floatval($row[1] ?? 1);
                $price = floatval($row[2]);
                $discountPercentage = floatval($row[3] ?? 0);
                $discountAmount = floatval($row[4] ?? 0);

                if (empty($productCode) || $price <= 0) {
                    $results['errors']++;
                    $results['details'][] = "Satır {$rowNumber}: Geçersiz ürün kodu veya fiyat";
                    continue;
                }

                // Find product
                $product = Product::where('code', $productCode)->first();
                if (!$product) {
                    $results['errors']++;
                    $results['details'][] = "Satır {$rowNumber}: Ürün kodu bulunamadı: {$productCode}";
                    continue;
                }

                // Check if price already exists
                $existingPrice = ProductPrice::where('price_list_id', $priceList->id)
                    ->where('product_id', $product->id)
                    ->where('min_quantity', $minQuantity)
                    ->first();

                if ($existingPrice && !$updateExisting) {
                    $results['skipped']++;
                    continue;
                }

                $priceData = [
                    'price_list_id' => $priceList->id,
                    'product_id' => $product->id,
                    'min_quantity' => $minQuantity,
                    'price' => $price,
                    'discount_percentage' => $discountPercentage,
                    'discount_amount' => $discountAmount,
                ];

                if ($existingPrice) {
                    $existingPrice->update($priceData);
                } else {
                    ProductPrice::create($priceData);
                }

                $results['success']++;
                
            } catch (\Exception $e) {
                $results['errors']++;
                $results['details'][] = "Satır {$rowNumber}: " . $e->getMessage();
            }
        }

        fclose($handle);
        
        return $results;
    }

    /**
     * Download import template
     */
    public function downloadTemplate()
    {
        $data = [];
        $data[] = [
            'Ürün Kodu',
            'Minimum Miktar', 
            'Birim Fiyat',
            'İndirim %',
            'İndirim Tutar'
        ];
        
        // Add sample data
        $data[] = ['PRD001', 1, 100.00, 0, 0];
        $data[] = ['PRD001', 10, 95.00, 5, 0];
        $data[] = ['PRD002', 1, 250.50, 0, 10];

        $filename = 'fiyat_listesi_template_' . date('Y-m-d') . '.csv';
        
        $output = fopen('php://temp', 'w');
        
        // Add UTF-8 BOM
        fputs($output, "\xEF\xBB\xBF");
        
        foreach ($data as $row) {
            fputcsv($output, $row, ';');
        }
        
        rewind($output);
        $content = stream_get_contents($output);
        fclose($output);
        
        return response($content)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"")
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    /**
     * Remove the specified price list
     */
    public function destroy(ProductPriceList $priceList): RedirectResponse
    {
        Gate::authorize('delete', $priceList);

        // Check if price list has any prices
        if ($priceList->prices()->count() > 0) {
            return back()->with('error', 'Fiyat listesi silinemiyor: Bu listeye ait ürün fiyatları bulunmaktadır.');
        }

        $priceList->delete();

        return redirect()
            ->route('sales.price-lists.index')
            ->with('success', 'Fiyat listesi başarıyla silindi.');
    }

    /**
     * Toggle price list status
     */
    public function toggleStatus(ProductPriceList $priceList): RedirectResponse
    {
        Gate::authorize('update', $priceList);

        $priceList->update([
            'is_active' => !$priceList->is_active
        ]);

        $status = $priceList->is_active ? 'aktifleştirildi' : 'pasifleştirildi';

        return back()->with('success', "Fiyat listesi başarıyla {$status}.");
    }

    /**
     * Set as default price list
     */
    public function setDefault(ProductPriceList $priceList): RedirectResponse
    {
        Gate::authorize('update', $priceList);

        // Remove default from others
        ProductPriceList::where('type', $priceList->type)
            ->where('currency', $priceList->currency)
            ->where('is_default', true)
            ->update(['is_default' => false]);

        // Set this as default
        $priceList->update(['is_default' => true]);

        return back()->with('success', 'Fiyat listesi varsayılan olarak ayarlandı.');
    }

    /**
     * Duplicate price list
     */
    public function duplicate(ProductPriceList $priceList): RedirectResponse
    {
        Gate::authorize('create', ProductPriceList::class);

        $newPriceList = $priceList->replicate();
        $newPriceList->name = $priceList->name . ' (Kopya)';
        $newPriceList->code = 'PL-' . strtoupper(uniqid());
        $newPriceList->is_default = false;
        $newPriceList->save();

        // Copy all prices
        foreach ($priceList->prices as $price) {
            $newPrice = $price->replicate();
            $newPrice->price_list_id = $newPriceList->id;
            $newPrice->save();
        }

        return redirect()
            ->route('sales.price-lists.show', $newPriceList)
            ->with('success', 'Fiyat listesi başarıyla kopyalandı.');
    }

    /**
     * Get Logo price sync statistics
     */
    public function syncStats(LogoPriceSyncService $syncService): JsonResponse
    {
        try {
            Gate::authorize('viewAny', ProductPriceList::class);

            $stats = $syncService->getSyncStats();

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], $e instanceof \Illuminate\Auth\Access\AuthorizationException ? 403 : 500);
        }
    }

    /**
     * Start Logo price synchronization
     */
    public function startSync(Request $request, LogoPriceSyncService $syncService): JsonResponse
    {
        try {
            Gate::authorize('viewAny', ProductPriceList::class);

            set_time_limit(300);

            $firmNo = (int) config('services.logo.firm_no', 12);
            $notifyEmail = $request->boolean('notify_email', false);

            $result = $syncService->syncProductPrices($firmNo);

            if ($notifyEmail && $request->user()?->email) {
                try {
                    Mail::to($request->user()->email)->send(
                        new LogoPriceSyncCompleteMail(
                            $result['success'],
                            $result['stats'] ?? [],
                            $result['error'] ?? null
                        )
                    );
                } catch (\Exception $e) {
                    \Log::warning('Logo sync email notification failed: ' . $e->getMessage());
                }
            }

            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error('Logo price sync controller error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], $e instanceof \Illuminate\Auth\Access\AuthorizationException ? 403 : 500);
        }
    }
}