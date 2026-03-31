<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use App\Models\CurrentAccount;
use App\Models\ProductAttribute;
use App\Models\ProductImage;
use App\Models\Unit;
use App\Models\ProductUnit;
use App\Models\Tax;
use App\Models\InventoryMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Intervention\Image\Laravel\Facades\Image; // v3'te doğru facade
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'brand', 'primaryImage'])->withCurrentTranslation();

        // Arama
        if ($request->filled('search') && $request->search != '') {
            $query->search($request->search);
        }

        // Kategori filtresi
        if ($request->filled('category_id') && $request->category_id != '') {
            $query->byCategory($request->category_id);
        }

        // Marka filtresi
        if ($request->filled('brand_id') && $request->brand_id != '') {
            $query->byBrand($request->brand_id);
        }

        // Stok durumu filtresi
        if ($request->filled('stock_status') && $request->stock_status != '') {
            switch ($request->stock_status) {
                case 'in_stock':
                    $query->inStock();
                    break;
                case 'out_of_stock':
                    $query->where('stock_quantity', 0);
                    break;
                case 'low_stock':
                    $query->lowStock();
                    break;
            }
        }

        // Durum filtresi
        $isActiveValue = $request->get('is_active');
        if ($isActiveValue !== null && $isActiveValue !== '' && in_array($isActiveValue, ['0', '1', 'true', 'false'])) {
            $query->where('is_active', filter_var($isActiveValue, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE));
        }

        // Sıralama
        $allowedSortFields = ['name', 'code', 'sale_price', 'cost_price', 'stock_quantity', 'created_at', 'updated_at'];
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');

        // Boş string kontrolü
        if (empty($sortField) || $sortField === '') {
            $sortField = 'created_at';
        }
        if (empty($sortDirection) || $sortDirection === '') {
            $sortDirection = 'desc';
        }

        // Güvenlik kontrolü: sadece izin verilen fieldlar
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        // Direction kontrolü
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        $query->orderBy($sortField, $sortDirection);

        $products = $query->paginate(20)->withQueryString();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'filters' => $request->all(['search', 'category_id', 'brand_id', 'stock_status', 'is_active', 'sort_field', 'sort_direction']),
            'categories' => Category::active()->get(),
            'brands' => Brand::active()->orderBy('name', 'asc')->get(),
        ]);
    }

    public function exportExcel(Request $request)
    {
        $query = Product::with(['category', 'brand'])->withCurrentTranslation();

        if ($request->filled('search') && $request->search != '') {
            $query->search($request->search);
        }
        if ($request->filled('category_id') && $request->category_id != '') {
            $query->byCategory($request->category_id);
        }
        if ($request->filled('brand_id') && $request->brand_id != '') {
            $query->byBrand($request->brand_id);
        }
        if ($request->filled('stock_status') && $request->stock_status != '') {
            switch ($request->stock_status) {
                case 'in_stock': $query->inStock(); break;
                case 'out_of_stock': $query->where('stock_quantity', 0); break;
                case 'low_stock': $query->lowStock(); break;
            }
        }
        $isActiveValue = $request->get('is_active');
        if ($isActiveValue !== null && $isActiveValue !== '' && in_array($isActiveValue, ['0', '1', 'true', 'false'])) {
            $query->where('is_active', filter_var($isActiveValue, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE));
        }

        $products = $query->orderBy('code', 'asc')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Ürünler');

        // Headers
        $headers = ['ID', 'Stok Kodu', 'Ürün Adı', 'Kategori', 'Marka', 'Fiyat', 'Döviz', 'Stok', 'Aktif'];
        foreach ($headers as $col => $header) {
            $sheet->setCellValue([$col + 1, 1], $header);
        }

        // Header styling
        $headerRange = 'A1:I1';
        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ]);

        // Data rows
        $row = 2;
        foreach ($products as $product) {
            $sheet->setCellValue([1, $row], $product->id);
            $sheet->setCellValue([2, $row], $product->code);
            $sheet->setCellValue([3, $row], $product->name);
            $sheet->setCellValue([4, $row], $product->category?->name ?? '');
            $sheet->setCellValue([5, $row], $product->brand?->name ?? '');
            $sheet->setCellValue([6, $row], $product->sale_price);
            $sheet->setCellValue([7, $row], $product->currency ?? 'TRY');
            $sheet->setCellValue([8, $row], $product->stock_quantity);
            $sheet->setCellValue([9, $row], $product->is_active ? 'Evet' : 'Hayır');
            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Data borders
        if ($row > 2) {
            $sheet->getStyle('A2:I' . ($row - 1))->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ]);
        }

        $fileName = 'urunler_' . date('Y-m-d_His') . '.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), 'export_');

        $writer = new Xlsx($spreadsheet);
        $writer->save($tempFile);

        return response()->download($tempFile, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function stockHistory(Product $product)
    {
        $movements = InventoryMovement::where('inventory_item_id', $product->id)
            ->with(['creator'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Products/StockHistory', [
            'product' => $product->only(['id', 'name', 'code', 'sku', 'stock_quantity']),
            'movements' => $movements
        ]);
    }

    public function create()
    {
        return Inertia::render('Products/Create', [
            'categories' => Category::active()->where('type', 'product')->with('parent')->get(),
            'categoriesHierarchy' => $this->getCategoriesHierarchy(),
            'brands' => Brand::active()->orderBy('name', 'asc')->get(),
            'suppliers' => CurrentAccount::where('account_type', 'supplier')->where('is_active', true)->orderBy('title', 'asc')->get(['id', 'title', 'account_code']),
            'units' => Unit::active()->orderBy('name', 'asc')->get(['id', 'name', 'symbol', 'type']),
            'taxes' => Tax::active()->orderBy('name', 'asc')->get(['id', 'name', 'type', 'rate', 'fixed_amount', 'code']),
            'attributes' => ProductAttribute::with('values')->orderBy('name', 'asc')->get(),
            'userPermissions' => [
                'canCreateCategories' => auth()->user()->hasRole('Super Admin') || auth()->user()->can('create product-categories'),
                'canCreateBrands' => auth()->user()->hasRole('Super Admin') || auth()->user()->can('create brands'),
                'canCreateSuppliers' => auth()->user()->hasRole('Super Admin') || auth()->user()->can('create suppliers'),
            ],
            'productTypes' => [
                ['value' => 'raw_material', 'label' => 'Hammadde'],
                ['value' => 'finished_goods', 'label' => 'Mamul'],
                ['value' => 'semi_finished', 'label' => 'Yarı Mamul'],
                ['value' => 'trading_goods', 'label' => 'Ticari Mal'],
                ['value' => 'service', 'label' => 'Hizmet'],
                ['value' => 'consumable', 'label' => 'Sarf Malzeme'],
            ],
            'currencies' => [
                ['value' => 'TRY', 'label' => 'TL'],
                ['value' => 'USD', 'label' => 'USD'],
                ['value' => 'EUR', 'label' => 'EUR'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|unique:products,code',
            'sku' => 'required|string|unique:products,sku',
            'barcode' => 'nullable|string|unique:products,barcode',
            'category_id' => 'required|exists:categories,id',
            'categories' => 'nullable|array',
            'categories.*' => 'exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'supplier_id' => 'nullable|exists:current_accounts,id',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            
            // Translation fields
            'translations' => 'nullable|array',
            'translations.*.locale' => 'required|string|in:tr,en,de,fr',
            'translations.*.name' => 'required|string|max:255',
            'translations.*.description' => 'nullable|string',
            'translations.*.short_description' => 'nullable|string|max:500',
            'translations.*.meta_title' => 'nullable|string|max:255',
            'translations.*.meta_description' => 'nullable|string',
            'translations.*.meta_keywords' => 'nullable|string',

            // Fiyat
            'cost_price' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'min_sale_price' => 'nullable|numeric|min:0',
            'tax_rate' => 'required|integer|min:0|max:100',
            'currency' => 'required|string|size:3',

            // Stok
            'stock_quantity' => 'required|integer|min:0',
            'min_stock_level' => 'required|integer|min:0',
            'max_stock_level' => 'nullable|integer|min:0',
            'track_inventory' => 'boolean',
            'allow_backorder' => 'boolean',

            // Fiziksel özellikler
            'weight' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'depth' => 'nullable|numeric|min:0',
            'volume' => 'nullable|numeric|min:0',
            'unit_of_measure' => 'required|string',

            // Paketleme
            'items_per_package' => 'nullable|integer|min:1',
            'items_per_box' => 'nullable|integer|min:1',
            'boxes_per_pallet' => 'nullable|integer|min:1',
            'package_type' => 'nullable|string',

            // Tip ve durum
            'product_type' => 'required|in:raw_material,finished_goods,semi_finished,trading_goods,service,consumable',
            'tax_id' => 'nullable|exists:taxes,id',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'is_digital' => 'boolean',
            'is_new' => 'boolean',

            // SEO
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string',

            // Diğer
            'country_of_origin' => 'nullable|string',
            'warranty_period' => 'nullable|integer|min:0',
            'warranty_info' => 'nullable|string',
            'tags' => 'nullable|string',
            'specifications' => 'nullable|string',

            // Görseller
            'images' => 'nullable|array',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp,bmp|max:5120',

            // Özellikler
            'attributes' => 'nullable|array',
            'attributes.*.attribute_id' => 'required|exists:product_attributes,id',
            'attributes.*.value' => 'nullable|string',
            'attributes.*.attribute_value_id' => 'nullable|exists:attribute_values,id',

            // Unit selection from unified units table
            'unit_id' => 'nullable|exists:units,id',

            // Product units (packaging hierarchy)
            'units' => 'nullable|array',
            'units.*.unit_id' => 'required|exists:units,id',
            'units.*.conversion_factor' => 'required|numeric|min:0.0001',
            'units.*.barcode' => 'nullable|string|unique:product_units,barcode',
            'units.*.sale_price' => 'nullable|numeric|min:0',
            'units.*.wholesale_price' => 'nullable|numeric|min:0',
            'units.*.min_order_quantity' => 'nullable|integer|min:1',
            'units.*.is_base_unit' => 'boolean',

            // ERP alanları
            'can_be_purchased' => 'boolean',
            'can_be_sold' => 'boolean',
            'is_stockable' => 'boolean',
            'is_serialized' => 'boolean',
            'lead_time_days' => 'nullable|numeric|min:0',
            'purchase_uom' => 'nullable|string|max:20',
            'sales_uom' => 'nullable|string|max:20',
        ]);

        DB::beginTransaction();

        try {
            // Ürünü oluştur
            $product = Product::create($validated);

            // Çevirileri kaydet
            if (isset($validated['translations']) && is_array($validated['translations'])) {
                foreach ($validated['translations'] as $translation) {
                    $product->translations()->create([
                        'locale' => $translation['locale'],
                        'name' => $translation['name'],
                        'description' => $translation['description'] ?? null,
                        'short_description' => $translation['short_description'] ?? null,
                        'meta_title' => $translation['meta_title'] ?? null,
                        'meta_description' => $translation['meta_description'] ?? null,
                        'meta_keywords' => $translation['meta_keywords'] ?? null,
                    ]);
                }
            }

            // Kategorileri bağla
            if (isset($validated['categories']) && is_array($validated['categories'])) {
                $product->categories()->sync($validated['categories']);
            }

            // Görselleri yükle
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $image) {
                    $path = $image->store('products/' . $product->id, 'public');

                    // Thumbnail oluştur
                    $thumbnailPath = $this->createThumbnail($image, $product->id);

                    $product->images()->create([
                        'image_path' => $path,
                        'thumbnail_path' => $thumbnailPath ?: $path,
                        'is_primary' => $index === 0,
                        'sort_order' => $index,
                    ]);
                }
            }

            // Özellikleri ekle
            if ($request->filled('attributes')) {
                foreach ($request->attributes as $attr) {
                    $product->attributes()->attach($attr['attribute_id'], [
                        'attribute_value_id' => $attr['attribute_value_id'] ?? null,
                        'value' => $attr['value'] ?? null,
                    ]);
                }
            }

            // Product units (packaging hierarchy)
            if ($request->filled('units')) {
                foreach ($request->units as $index => $unitData) {
                    $product->units()->create([
                        'unit_id' => $unitData['unit_id'],
                        'conversion_factor' => $unitData['conversion_factor'],
                        'barcode' => $unitData['barcode'] ?? null,
                        'sale_price' => $unitData['sale_price'] ?? null,
                        'wholesale_price' => $unitData['wholesale_price'] ?? null,
                        'min_order_quantity' => $unitData['min_order_quantity'] ?? 1,
                        'is_base_unit' => $unitData['is_base_unit'] ?? false,
                        'is_active' => true,
                        'sort_order' => $index,
                    ]);
                }
            }

            DB::commit();

            return redirect()->route('products.index')
                ->with('success', 'Ürün başarıyla oluşturuldu.');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Ürün oluşturulurken bir hata oluştu: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function show(Product $product)
    {
        $product->load([
            'category',
            'brand',
            'supplier',
            'tax',
            'images',
            'variants',
            'attributes.values',
            'bundleItems.product',
            'translations',
            'prices.priceList'
        ]);

        // Get current translation for the current locale
        $currentLocale = app()->getLocale();
        $currentTranslation = $product->translations->where('locale', $currentLocale)->first();
        
        // If no translation exists for current locale, fallback to Turkish
        if (!$currentTranslation) {
            $currentTranslation = $product->translations->where('locale', 'tr')->first();
        }
        
        $product->current_translation = $currentTranslation;

        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    public function edit(Product $product)
    {
        $product->load(['images', 'attributes', 'baseUnit', 'units.unit', 'categories', 'translations']);

        return Inertia::render('Products/Edit', [
            'product' => $product,
            'categories' => Category::active()->where('type', 'product')->with('parent')->get(),
            'categoriesHierarchy' => $this->getCategoriesHierarchy(),
            'brands' => Brand::active()->orderBy('name', 'asc')->get(),
            'suppliers' => CurrentAccount::where('account_type', 'supplier')->where('is_active', true)->orderBy('title', 'asc')->get(['id', 'title', 'account_code']),
            'units' => Unit::active()->orderBy('name', 'asc')->get(['id', 'name', 'symbol', 'type']),
            'taxes' => Tax::active()->orderBy('name', 'asc')->get(['id', 'name', 'type', 'rate', 'fixed_amount', 'code']),
            'attributes' => ProductAttribute::with('values')->orderBy('name', 'asc')->get(),
            'userPermissions' => [
                'canCreateCategories' => auth()->user()->hasRole('Super Admin') || auth()->user()->can('create product-categories'),
                'canCreateBrands' => auth()->user()->hasRole('Super Admin') || auth()->user()->can('create brands'),
                'canCreateSuppliers' => auth()->user()->hasRole('Super Admin') || auth()->user()->can('create suppliers'),
            ],
            'productTypes' => [
                ['value' => 'raw_material', 'label' => 'Hammadde'],
                ['value' => 'finished_goods', 'label' => 'Mamul'],
                ['value' => 'semi_finished', 'label' => 'Yarı Mamul'],
                ['value' => 'trading_goods', 'label' => 'Ticari Mal'],
                ['value' => 'service', 'label' => 'Hizmet'],
                ['value' => 'consumable', 'label' => 'Sarf Malzeme'],
            ],
            'currencies' => [
                ['value' => 'TRY', 'label' => 'TL'],
                ['value' => 'USD', 'label' => 'USD'],
                ['value' => 'EUR', 'label' => 'EUR'],
            ],
        ]);
    }

    public function update(Request $request, Product $product)
    {
        \Log::info('ProductController update started', [
            'product_id' => $product->id,
            'has_files' => $request->hasFile('images'),
            'request_method' => $request->method(),
            'content_type' => $request->header('Content-Type')
        ]);

        try {
            // Debug: Gelen units verisini logla
            \Log::info('ProductController: Update request units data', [
                'product_id' => $product->id,
                'has_units' => $request->has('units'),
                'units_data' => $request->get('units'),
                'units_count' => $request->has('units') ? count($request->get('units', [])) : 0,
                'all_request_keys' => array_keys($request->all())
            ]);

            $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            
            // Translation fields
            'translations' => 'nullable|array',
            'translations.*.locale' => 'required|string|in:tr,en,de,fr',
            'translations.*.name' => 'required|string|max:255',
            'translations.*.description' => 'nullable|string',
            'translations.*.short_description' => 'nullable|string|max:500',
            'translations.*.meta_title' => 'nullable|string|max:255',
            'translations.*.meta_description' => 'nullable|string',
            'translations.*.meta_keywords' => 'nullable|string',
            'code' => 'nullable|string|unique:products,code,' . $product->id,
            'barcode' => 'nullable|string|unique:products,barcode,' . $product->id,
            'sku' => 'nullable|string|unique:products,sku,' . $product->id,
            'category_id' => 'nullable|exists:categories,id',
            'categories' => 'nullable|array',
            'categories.*' => 'exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'supplier_id' => 'nullable|exists:current_accounts,id',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',

            // Fiyat
            'cost_price' => 'nullable|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'min_sale_price' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|integer|min:0|max:100',
            'currency' => 'nullable|string|size:3',

            // Stok
            'stock_quantity' => 'nullable|integer|min:0',
            'min_stock_level' => 'nullable|integer|min:0',
            'max_stock_level' => 'nullable|integer|min:0',
            'track_inventory' => 'boolean',
            'allow_backorder' => 'boolean',

            // Fiziksel özellikler
            'weight' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'depth' => 'nullable|numeric|min:0',
            'volume' => 'nullable|numeric|min:0',
            'unit_of_measure' => 'nullable|string',

            // Paketleme
            'items_per_package' => 'nullable|integer|min:1',
            'items_per_box' => 'nullable|integer|min:1',
            'boxes_per_pallet' => 'nullable|integer|min:1',
            'package_type' => 'nullable|string',

            // Tip ve durum
            'product_type' => 'nullable|in:simple,variable,bundle,grouped',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'is_digital' => 'boolean',
            'is_new' => 'boolean',

            // SEO
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string',

            // Diğer
            'country_of_origin' => 'nullable|string',
            'warranty_period' => 'nullable|integer|min:0',
            'warranty_info' => 'nullable|string',
            'tags' => 'nullable|string',
            'specifications' => 'nullable|string',

            // Görseller
            'images' => 'nullable|array',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp,bmp|max:5120',

            // Özellikler
            'attributes' => 'nullable|array',
            'attributes.*.attribute_id' => 'required|exists:product_attributes,id',
            'attributes.*.value' => 'nullable|string',
            'attributes.*.attribute_value_id' => 'nullable|exists:attribute_values,id',

            // Unit selection from unified units table
            'unit_id' => 'nullable|exists:units,id',

            // Product units (packaging hierarchy)
            'units' => 'nullable|array',
            'units.*.unit_id' => 'required|exists:units,id',
            'units.*.conversion_factor' => 'required|numeric|min:0.0001',
            'units.*.barcode' => 'nullable|string',
            'units.*.sale_price' => 'nullable|numeric|min:0',
            'units.*.wholesale_price' => 'nullable|numeric|min:0',
            'units.*.min_order_quantity' => 'nullable|integer|min:1',
            'units.*.is_base_unit' => 'boolean',

            // ERP alanları
            'product_type' => 'nullable|in:raw_material,finished_goods,semi_finished,trading_goods,service,consumable',
            'tax_id' => 'nullable|exists:taxes,id',
            'can_be_purchased' => 'boolean',
            'can_be_sold' => 'boolean',
            'is_stockable' => 'boolean',
            'is_serialized' => 'boolean',
            'lead_time_days' => 'nullable|numeric|min:0',
            'purchase_uom' => 'nullable|string|max:20',
            'sales_uom' => 'nullable|string|max:20',
            ]);

            \Log::info('ProductController: Validation passed', [
                'product_id' => $product->id,
                'validated_keys' => array_keys($validated)
            ]);

            // JSON string'leri array'e çevir
            if (isset($validated['tags']) && is_string($validated['tags'])) {
                $validated['tags'] = json_decode($validated['tags'], true) ?: [];
            }
            if (isset($validated['specifications']) && is_string($validated['specifications'])) {
                $validated['specifications'] = json_decode($validated['specifications'], true) ?: [];
            }

            // NULL olan numeric alanları 0 ile değiştir (database constraint için)
            $numericFields = [
                'cost_price', 'sale_price', 'wholesale_price', 'min_sale_price', 'tax_rate',
                'stock_quantity', 'min_stock_level', 'max_stock_level',
                'weight', 'width', 'height', 'depth', 'volume',
                'items_per_package', 'items_per_box', 'boxes_per_pallet', 'warranty_period'
            ];

            foreach ($numericFields as $field) {
                if (!isset($validated[$field]) || $validated[$field] === null || $validated[$field] === '') {
                    $validated[$field] = 0;
                }
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('ProductController: Validation failed', [
                'product_id' => $product->id,
                'validation_errors' => $e->errors(),
                'request_data_keys' => array_keys($request->all()),
                'request_files' => array_keys($request->allFiles()),
                'unit_specific_errors' => array_filter($e->errors(), function($key) {
                    return strpos($key, 'unit_id') !== false;
                }, ARRAY_FILTER_USE_KEY),
                'unit_data_received' => $request->get('unit_id', 'not_present')
            ]);

            // Validation hata mesajını daha detaylı hale getir
            $errorMessage = 'Form validasyonu başarısız: ';
            if (isset($e->errors()['unit_id'])) {
                $errorMessage .= 'Birim seçimi ile ilgili sorun var. ';
            }
            foreach ($e->errors() as $field => $messages) {
                if (strpos($field, 'unit_id') !== false) {
                    $errorMessage .= $field . ': ' . implode(', ', $messages) . ' ';
                }
            }

            return back()->with('error', $errorMessage)
                ->withErrors($e->errors())->withInput();
        }

        DB::beginTransaction();

        try {
            $product->update($validated);

            // Çevirileri güncelle
            if (isset($validated['translations']) && is_array($validated['translations'])) {
                // Mevcut çevirileri sil ve yenilerini oluştur
                $product->translations()->delete();
                foreach ($validated['translations'] as $translation) {
                    $product->translations()->create([
                        'locale' => $translation['locale'],
                        'name' => $translation['name'],
                        'description' => $translation['description'] ?? null,
                        'short_description' => $translation['short_description'] ?? null,
                        'meta_title' => $translation['meta_title'] ?? null,
                        'meta_description' => $translation['meta_description'] ?? null,
                        'meta_keywords' => $translation['meta_keywords'] ?? null,
                    ]);
                }
            }

            // Kategorileri güncelle
            if (isset($validated['categories']) && is_array($validated['categories'])) {
                $product->categories()->sync($validated['categories']);
            }

            // Görselleri yükle - daha güvenilir kontrol
            $images = $request->file('images');
            $hasImages = $images && is_array($images) && count($images) > 0;

            \Log::info('ProductController: Image check', [
                'product_id' => $product->id,
                'hasFile_images' => $request->hasFile('images'),
                'images_var' => $images ? 'exists' : 'null',
                'is_array' => is_array($images),
                'count' => $images ? count($images) : 0,
                'hasImages' => $hasImages,
                'all_files' => array_keys($request->allFiles()),
                'input_keys' => array_keys($request->all())
            ]);

            if ($hasImages) {
                \Log::info('ProductController: Images received', [
                    'product_id' => $product->id,
                    'image_count' => count($images),
                    'storage_path' => storage_path('app/public/products/' . $product->id),
                    'storage_disk_path' => \Storage::disk('public')->path('products/' . $product->id)
                ]);

                $existingImageCount = $product->images()->count();
                $maxSortOrder = $product->images()->max('sort_order') ?? 0;

                foreach ($images as $index => $image) {
                    try {
                        \Log::info('ProductController: Processing image', [
                            'index' => $index,
                            'filename' => $image->getClientOriginalName(),
                            'size' => $image->getSize()
                        ]);

                        // Görseli kaydet
                        $imagePath = $image->store('products/' . $product->id, 'public');

                        \Log::info('ProductController: Image stored', [
                            'path' => $imagePath,
                            'full_path' => storage_path('app/public/' . $imagePath)
                        ]);

                        // Thumbnail oluştur
                        $thumbnailPath = $this->createThumbnail($image, $product->id);

                        // Veritabanına kaydet
                        $productImage = $product->images()->create([
                            'image_path' => $imagePath,
                            'thumbnail_path' => $thumbnailPath ?: $imagePath,
                            'is_primary' => ($existingImageCount === 0 && $index === 0), // İlk görsel ana görsel olsun
                            'sort_order' => $maxSortOrder + $index + 1,
                        ]);

                        \Log::info('ProductController: Image record created', [
                            'image_id' => $productImage->id,
                            'is_primary' => $productImage->is_primary
                        ]);

                    } catch (\Exception $e) {
                        \Log::error('ProductController: Image processing failed', [
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                        throw $e;
                    }
                }
            }

            // Özellikleri güncelle
            if ($request->has('attributes')) {
                $product->attributes()->detach();

                foreach ($request->attributes as $attr) {
                    $product->attributes()->attach($attr['attribute_id'], [
                        'attribute_value_id' => $attr['attribute_value_id'] ?? null,
                        'value' => $attr['value'] ?? null,
                    ]);
                }
            }

            // Product units (packaging hierarchy)
            if ($request->has('units')) {
                // Önce mevcut birimleri sil
                $product->units()->delete();

                // Yeni birimleri ekle
                foreach ($request->units as $index => $unitData) {
                    $product->units()->create([
                        'unit_id' => $unitData['unit_id'],
                        'conversion_factor' => (float)$unitData['conversion_factor'],
                        'barcode' => !empty($unitData['barcode']) ? $unitData['barcode'] : null,
                        'sale_price' => !empty($unitData['sale_price']) ? (float)$unitData['sale_price'] : null,
                        'wholesale_price' => !empty($unitData['wholesale_price']) ? (float)$unitData['wholesale_price'] : null,
                        'min_order_quantity' => !empty($unitData['min_order_quantity']) ? (int)$unitData['min_order_quantity'] : 1,
                        'is_base_unit' => (bool)($unitData['is_base_unit'] ?? false),
                        'is_active' => true,
                        'sort_order' => $index,
                    ]);
                }
            }

            DB::commit();

            $message = 'Ürün başarıyla güncellendi.';
            if ($request->hasFile('images')) {
                $imageCount = count($request->file('images'));
                $message .= " {$imageCount} görsel eklendi.";
                \Log::info('ProductController: Update completed with images', [
                    'product_id' => $product->id,
                    'images_processed' => $imageCount
                ]);
            }

            return redirect()->route('products.edit', $product->id)
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('ProductController: Update failed', [
                'product_id' => $product->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->with('error', 'Ürün güncellenirken bir hata oluştu: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy(Product $product)
    {
        try {
            $product->delete();

            return redirect()->route('products.index')
                ->with('success', 'Ürün başarıyla silindi.');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Ürün silinirken bir hata oluştu.']);
        }
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:products,id',
        ]);

        try {
            Product::whereIn('id', $validated['ids'])->delete();

            return response()->json([
                'success' => true,
                'message' => count($validated['ids']) . ' ürün başarıyla silindi.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ürünler silinirken bir hata oluştu.',
            ], 500);
        }
    }

    public function updateStock(Request $request, Product $product)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer',
            'operation' => 'required|in:add,subtract',
            'reason' => 'nullable|string|max:255',
        ]);

        try {
            $product->updateStock($validated['quantity'], $validated['operation']);

            // Stok hareketi kaydı oluştur (ileride implement edilecek)

            return response()->json([
                'success' => true,
                'message' => 'Stok başarıyla güncellendi.',
                'new_stock' => $product->stock_quantity,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Stok güncellenirken bir hata oluştu.',
            ], 500);
        }
    }

    public function duplicate(Product $product)
    {
        DB::beginTransaction();

        try {
            $newProduct = $product->replicate();
            $newProduct->code = 'PRD-' . strtoupper(Str::random(8));
            $newProduct->sku = 'SKU-' . strtoupper(Str::random(8));
            $newProduct->name = $product->name . ' (Kopya)';
            $newProduct->slug = Str::slug($newProduct->name);
            $newProduct->barcode = null;
            $newProduct->save();

            // Özellikleri kopyala
            foreach ($product->attributes as $attribute) {
                $newProduct->attributes()->attach($attribute->id, [
                    'attribute_value_id' => $attribute->pivot->attribute_value_id,
                    'value' => $attribute->pivot->value,
                ]);
            }

            DB::commit();

            return redirect()->route('products.edit', $newProduct)
                ->with('success', 'Ürün başarıyla kopyalandı.');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Ürün kopyalanırken bir hata oluştu.']);
        }
    }

    /**
     * Create thumbnail for uploaded image
     */
    private function createThumbnail($uploadedFile, $productId)
    {
        try {
            // Get file info
            $extension = $uploadedFile->getClientOriginalExtension();
            $filename = pathinfo($uploadedFile->getClientOriginalName(), PATHINFO_FILENAME);
            $thumbnailName = $filename . '_thumb.' . $extension;

            // Create thumbnail path
            $thumbnailPath = 'products/' . $productId . '/thumbnails/' . $thumbnailName;
            $fullThumbnailPath = storage_path('app/public/' . $thumbnailPath);

            // Create directory if it doesn't exist
            $thumbnailDir = dirname($fullThumbnailPath);
            if (!file_exists($thumbnailDir)) {
                mkdir($thumbnailDir, 0755, true);
            }

            // Check if Intervention Image is available
            if (class_exists('\Intervention\Image\Facades\Image')) {
                // Create thumbnail using Intervention Image
                $img = Image::make($uploadedFile->getPathname());
                $img->fit(200, 200, function ($constraint) {
                    $constraint->upsize();
                });
                $img->save($fullThumbnailPath, 85);

                return $thumbnailPath;
            } else {
                // Fallback: use GD if available
                $imageInfo = getimagesize($uploadedFile->getPathname());
                if ($imageInfo === false) {
                    return null;
                }

                [$width, $height, $type] = $imageInfo;

                // Create image resource based on type
                switch ($type) {
                    case IMAGETYPE_JPEG:
                        $source = imagecreatefromjpeg($uploadedFile->getPathname());
                        break;
                    case IMAGETYPE_PNG:
                        $source = imagecreatefrompng($uploadedFile->getPathname());
                        break;
                    case IMAGETYPE_GIF:
                        $source = imagecreatefromgif($uploadedFile->getPathname());
                        break;
                    default:
                        return null;
                }

                if (!$source) {
                    return null;
                }

                // Calculate thumbnail dimensions
                $thumbWidth = 200;
                $thumbHeight = 200;

                // Create thumbnail
                $thumb = imagecreatetruecolor($thumbWidth, $thumbHeight);

                // Preserve transparency for PNG and GIF
                if ($type == IMAGETYPE_PNG || $type == IMAGETYPE_GIF) {
                    imagealphablending($thumb, false);
                    imagesavealpha($thumb, true);
                    $transparent = imagecolorallocatealpha($thumb, 255, 255, 255, 127);
                    imagefilledrectangle($thumb, 0, 0, $thumbWidth, $thumbHeight, $transparent);
                }

                // Resize image
                imagecopyresampled($thumb, $source, 0, 0, 0, 0, $thumbWidth, $thumbHeight, $width, $height);

                // Save thumbnail
                switch ($type) {
                    case IMAGETYPE_JPEG:
                        imagejpeg($thumb, $fullThumbnailPath, 85);
                        break;
                    case IMAGETYPE_PNG:
                        imagepng($thumb, $fullThumbnailPath);
                        break;
                    case IMAGETYPE_GIF:
                        imagegif($thumb, $fullThumbnailPath);
                        break;
                }

                // Clean up
                imagedestroy($source);
                imagedestroy($thumb);

                return $thumbnailPath;
            }
        } catch (\Exception $e) {
            \Log::error('Thumbnail creation failed: ' . $e->getMessage());
            return null;
        }
    }

    private function getCategoriesHierarchy()
    {
        $categories = Category::active()
            ->where('type', 'product')
            ->with('parent')
            ->orderBy('name', 'asc')
            ->get();

        return $this->buildCategoryTree($categories);
    }

    private function buildCategoryTree($categories, $parentId = null, $level = 0)
    {
        $tree = [];

        // Filter categories for current level
        $currentLevelCategories = $categories->filter(function($category) use ($parentId) {
            return $category->parent_id == $parentId;
        });

        // Sort alphabetically
        $sortedCategories = $currentLevelCategories->sortBy('name');

        foreach ($sortedCategories as $category) {
            $category->level = $level;
            $category->children = $this->buildCategoryTree($categories, $category->id, $level + 1);
            $tree[] = $category;
        }

        return $tree;
    }

    public function getCategoryParents(Request $request)
    {
        $categoryId = $request->get('category_id');

        if (!$categoryId) {
            return response()->json([]);
        }

        $category = Category::find($categoryId);
        if (!$category) {
            return response()->json([]);
        }

        $parents = [];
        $currentCategory = $category;

        // Get all parent categories
        while ($currentCategory) {
            $parents[] = [
                'id' => $currentCategory->id,
                'name' => $currentCategory->name,
                'level' => $this->getCategoryLevel($currentCategory),
            ];

            $currentCategory = $currentCategory->parent;
        }

        return response()->json(array_reverse($parents));
    }

    private function getCategoryLevel($category, $level = 0)
    {
        if (!$category->parent) {
            return $level;
        }
        return $this->getCategoryLevel($category->parent, $level + 1);
    }
}
