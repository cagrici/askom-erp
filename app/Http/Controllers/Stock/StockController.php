<?php

namespace App\Http\Controllers\Stock;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\Category;
use App\Models\Brand;
use App\Models\InventoryMovement;
use App\Models\StockAdjustment;
use App\Models\StockAdjustmentItem;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    /**
     * Güvenli bölme işlemi - sıfıra bölme hatalarını önler
     */
    private function safeDivision($dividend, $divisor, $default = 0)
    {
        return ($divisor != 0 && $divisor !== null) ? $dividend / $divisor : $default;
    }

    /**
     * Güvenli yüzde hesaplama
     */
    private function safePercentage($value, $total, $default = 0)
    {
        return ($total > 0) ? round(($value / $total) * 100, 2) : $default;
    }

    /**
     * Stok listesi - tüm ürünlerin mevcut stok durumu
     */
    public function index(Request $request)
    {
        $query = Product::with(['category', 'brand', 'primaryImage']);

        // Arama
        if ($request->filled('search') && $request->search != '') {
            $query->search($request->search);
        }

        // Çoklu stok kodu sorgulama
        if ($request->filled('codes')) {
            $codes = array_map('trim', preg_split('/[,\n\r]+/', $request->codes));
            $codes = array_filter($codes, fn($c) => $c !== '');
            if (!empty($codes)) {
                $query->where(function ($q) use ($codes) {
                    $q->whereIn('code', $codes)
                      ->orWhereIn('sku', $codes)
                      ->orWhereIn('barcode', $codes);
                });
            }
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
                case 'critical_stock':
                    $query->whereColumn('stock_quantity', '<=', DB::raw('min_stock_level * 0.5'));
                    break;
                case 'overstock':
                    $query->whereColumn('stock_quantity', '>', 'max_stock_level');
                    break;
            }
        }

        // Stok değeri filtresi
        if ($request->filled('stock_value_min')) {
            $query->havingRaw('(stock_quantity * cost_price) >= ?', [$request->stock_value_min]);
        }
        if ($request->filled('stock_value_max')) {
            $query->havingRaw('(stock_quantity * cost_price) <= ?', [$request->stock_value_max]);
        }

        // Durum filtresi
        $isActiveValue = $request->get('is_active');
        if ($isActiveValue !== null && $isActiveValue !== '' && in_array($isActiveValue, ['0', '1', 'true', 'false'])) {
            $query->where('is_active', filter_var($isActiveValue, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE));
        }

        // Sıralama
        $allowedSortFields = ['name', 'code', 'stock_quantity', 'min_stock_level', 'max_stock_level', 'cost_price', 'created_at'];
        $sortField = $request->get('sort_field', 'stock_quantity');
        $sortDirection = $request->get('sort_direction', 'asc');
        
        if (empty($sortField) || $sortField === '') {
            $sortField = 'stock_quantity';
        }
        if (empty($sortDirection) || $sortDirection === '') {
            $sortDirection = 'asc';
        }
        
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'stock_quantity';
        }
        
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'asc';
        }
        
        $query->orderBy($sortField, $sortDirection);

        $products = $query->paginate(20)->withQueryString();

        // Stok istatistikleri
        $stockStats = $this->getStockStatistics();

        return Inertia::render('Stock/Index', [
            'products' => $products,
            'filters' => $request->all(['search', 'category_id', 'brand_id', 'stock_status', 'stock_value_min', 'stock_value_max', 'is_active', 'sort_field', 'sort_direction', 'codes']),
            'categories' => Category::active()->get(),
            'brands' => Brand::active()->get(),
            'stockStats' => $stockStats,
        ]);
    }

    /**
     * Stok istatistiklerini hesapla
     */
    private function getStockStatistics()
    {
        $totalProducts = Product::count();
        $inStockProducts = Product::inStock()->count();
        $outOfStockProducts = Product::where('stock_quantity', 0)->count();
        $lowStockProducts = Product::lowStock()->count();
        $criticalStockProducts = Product::whereColumn('stock_quantity', '<=', DB::raw('min_stock_level * 0.5'))->count();
        
        $totalStockValue = Product::selectRaw('SUM(stock_quantity * cost_price) as total_value')->first()->total_value ?? 0;
        $averageStockLevel = Product::avg('stock_quantity') ?? 0;

        return [
            'total_products' => $totalProducts,
            'in_stock_products' => $inStockProducts,
            'out_of_stock_products' => $outOfStockProducts,
            'low_stock_products' => $lowStockProducts,
            'critical_stock_products' => $criticalStockProducts,
            'total_stock_value' => $totalStockValue,
            'average_stock_level' => round($averageStockLevel, 2),
            'stock_turnover_rate' => 0, // Bu hesaplama için satış verisi gerekli
        ];
    }

    /**
     * Toplu stok güncelleme
     */
    public function bulkUpdateStock(Request $request)
    {
        $validated = $request->validate([
            'updates' => 'required|array',
            'updates.*.product_id' => 'required|exists:products,id',
            'updates.*.stock_quantity' => 'required|integer|min:0',
            'updates.*.reason' => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();

        try {
            foreach ($validated['updates'] as $update) {
                $product = Product::find($update['product_id']);
                $oldQuantity = $product->stock_quantity;
                $newQuantity = $update['stock_quantity'];
                $difference = $newQuantity - $oldQuantity;

                // Ürün stoğunu güncelle
                $product->update(['stock_quantity' => $newQuantity]);

                // Stok hareketini kaydet
                if ($difference != 0) {
                    InventoryMovement::create([
                        'product_id' => $product->id,
                        'movement_type' => 'adjustment',
                        'quantity' => abs($difference),
                        'unit_cost' => $product->cost_price,
                        'total_cost' => abs($difference) * $product->cost_price,
                        'reference_type' => 'bulk_adjustment',
                        'notes' => $update['reason'] ?? 'Toplu stok güncelleme',
                        'created_by' => auth()->id(),
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => count($validated['updates']) . ' ürünün stoğu başarıyla güncellendi.',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Stok güncellenirken bir hata oluştu: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tek ürün stok güncelleme - ERP standartlarında
     */
    public function updateStock(Request $request, Product $product)
    {
        $validated = $request->validate([
            'adjustment_type' => 'required|in:absolute,increase,decrease',
            'current_quantity' => 'required|numeric|min:0',
            'new_quantity' => 'required|numeric|min:0',
            'quantity_change' => 'required|numeric',
            'reason_code' => 'required|string|in:PHYSICAL_COUNT,DAMAGE,THEFT,EXPIRY,SYSTEM_ERROR,TRANSFER_ERROR,OTHER',
            'reason_description' => 'nullable|string|max:255',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();

        try {
            $oldQuantity = $product->stock_quantity;
            $newQuantity = $validated['new_quantity'];
            $difference = $newQuantity - $oldQuantity;
            
            // Validate the adjustment type matches the calculation
            switch ($validated['adjustment_type']) {
                case 'absolute':
                    $calculatedNew = $validated['new_quantity'];
                    break;
                case 'increase':
                    $calculatedNew = $oldQuantity + abs($validated['quantity_change']);
                    break;
                case 'decrease':
                    $calculatedNew = $oldQuantity - abs($validated['quantity_change']);
                    break;
            }
            
            if (abs($calculatedNew - $newQuantity) > 0.01) {
                throw new \Exception('Düzeltme tipi ve miktar değerleri tutarsız.');
            }

            // Update product stock
            $product->update(['stock_quantity' => $newQuantity]);

            // Create inventory movement record if there's a change
            if (abs($difference) > 0.01) {
                $reasonCodeMap = [
                    'PHYSICAL_COUNT' => 'Fiziki Sayım',
                    'DAMAGE' => 'Hasar',
                    'THEFT' => 'Kayıp/Çalınma',
                    'EXPIRY' => 'Son Kullanma Tarihi',
                    'SYSTEM_ERROR' => 'Sistem Hatası',
                    'TRANSFER_ERROR' => 'Transfer Hatası',
                    'OTHER' => 'Diğer'
                ];

                $movementNotes = $reasonCodeMap[$validated['reason_code']] ?? 'Stok Düzeltmesi';
                if ($validated['reason_description']) {
                    $movementNotes .= ' - ' . $validated['reason_description'];
                }
                if ($validated['notes']) {
                    $movementNotes .= "\nDetaylar: " . $validated['notes'];
                }
                if ($validated['reference_number']) {
                    $movementNotes .= "\nReferans: " . $validated['reference_number'];
                }

                InventoryMovement::create([
                    'product_id' => $product->id,
                    'movement_type' => 'adjustment',
                    'quantity' => abs($difference),
                    'direction' => $difference > 0 ? 'in' : 'out',
                    'unit_cost' => $product->cost_price,
                    'total_cost' => abs($difference) * $product->cost_price,
                    'warehouse_id' => $validated['warehouse_id'],
                    'reference_type' => 'stock_adjustment',
                    'reference_id' => null,
                    'reference_number' => $validated['reference_number'],
                    'reason_code' => $validated['reason_code'],
                    'notes' => $movementNotes,
                    'movement_date' => now(),
                    'effective_date' => now(),
                    'created_by' => auth()->id(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Stok düzeltmesi başarıyla kaydedildi.',
                'data' => [
                    'old_quantity' => $oldQuantity,
                    'new_quantity' => $newQuantity,
                    'change' => $difference,
                    'adjustment_type' => $validated['adjustment_type'],
                    'reason' => $reasonCodeMap[$validated['reason_code']] ?? 'Stok Düzeltmesi',
                    'reference_number' => $validated['reference_number'],
                    'movement_created' => abs($difference) > 0.01
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Stok düzeltmesi sırasında bir hata oluştu: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Düşük stok uyarıları
     */
    public function lowStockAlerts(Request $request)
    {
        $query = Product::with(['category', 'brand'])
            ->lowStock()
            ->where('is_active', true);

        // Kritik stok filtresi
        if ($request->filled('critical_only') && $request->critical_only === 'true') {
            $query->whereColumn('stock_quantity', '<=', DB::raw('min_stock_level * 0.5'));
        }

        $products = $query->orderBy('stock_quantity', 'asc')->paginate(20)->withQueryString();

        return Inertia::render('Stock/LowStockAlerts', [
            'products' => $products,
            'filters' => $request->all(['critical_only']),
        ]);
    }

    /**
     * Stok hareketleri listesi
     */
    public function movements(Request $request)
    {
        $query = InventoryMovement::with(['inventoryItem', 'creator', 'warehouse']);

        // Ürün filtresi
        if ($request->filled('product_id') && $request->product_id != '') {
            $query->where('inventory_item_id', $request->product_id);
        }

        // Hareket türü filtresi
        if ($request->filled('movement_type') && $request->movement_type != '') {
            $query->where('movement_type', $request->movement_type);
        }

        // Referans türü filtresi
        if ($request->filled('reference_type') && $request->reference_type != '') {
            $query->where('reference_type', $request->reference_type);
        }

        // Kullanıcı filtresi
        if ($request->filled('user_id') && $request->user_id != '') {
            $query->where('created_by', $request->user_id);
        }

        // Tarih aralığı filtresi
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Miktar filtresi
        if ($request->filled('quantity_min')) {
            $query->where('quantity', '>=', $request->quantity_min);
        }
        if ($request->filled('quantity_max')) {
            $query->where('quantity', '<=', $request->quantity_max);
        }

        // Arama
        if ($request->filled('search') && $request->search != '') {
            $query->whereHas('product', function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%')
                  ->orWhere('sku', 'like', '%' . $request->search . '%');
            })->orWhere('notes', 'like', '%' . $request->search . '%');
        }

        // Sıralama
        $allowedSortFields = ['created_at', 'movement_type', 'quantity', 'unit_cost', 'total_cost'];
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        
        if (empty($sortField) || $sortField === '') {
            $sortField = 'created_at';
        }
        if (empty($sortDirection) || $sortDirection === '') {
            $sortDirection = 'desc';
        }
        
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }
        
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }
        
        $query->orderBy($sortField, $sortDirection);

        $movements = $query->paginate(20)->withQueryString();

        // Hareket istatistikleri
        $movementStats = $this->getMovementStatistics($request);

        return Inertia::render('Stock/Movements', [
            'movements' => $movements,
            'filters' => $request->all(['search', 'product_id', 'movement_type', 'reference_type', 'user_id', 'date_from', 'date_to', 'quantity_min', 'quantity_max', 'sort_field', 'sort_direction']),
            'products' => Product::select('id', 'name', 'code')->orderBy('name')->get(),
            'users' => \App\Models\User::select('id', 'name')->orderBy('name')->get(),
            'movementStats' => $movementStats,
        ]);
    }

    /**
     * Stok hareket istatistiklerini hesapla
     */
    private function getMovementStatistics($request = null)
    {
        $query = InventoryMovement::query();
        
        // Aynı filtreleri uygula
        if ($request) {
            if ($request->filled('product_id') && $request->product_id != '') {
                $query->where('inventory_item_id', $request->product_id);
            }
            if ($request->filled('movement_type') && $request->movement_type != '') {
                $query->where('movement_type', $request->movement_type);
            }
            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
        }

        $totalMovements = $query->count();
        $inMovements = (clone $query)->where('movement_type', 'in')->count();
        $outMovements = (clone $query)->where('movement_type', 'out')->count();
        $adjustmentMovements = (clone $query)->where('movement_type', 'adjustment')->count();
        
        $totalInValue = (clone $query)->where('movement_type', 'in')->sum('total_cost') ?? 0;
        $totalOutValue = (clone $query)->where('movement_type', 'out')->sum('total_cost') ?? 0;
        $totalAdjustmentValue = (clone $query)->where('movement_type', 'adjustment')->sum('total_cost') ?? 0;

        return [
            'total_movements' => $totalMovements,
            'in_movements' => $inMovements,
            'out_movements' => $outMovements,
            'adjustment_movements' => $adjustmentMovements,
            'total_in_value' => $totalInValue,
            'total_out_value' => $totalOutValue,
            'total_adjustment_value' => $totalAdjustmentValue,
            'net_movement_value' => $totalInValue - $totalOutValue,
        ];
    }

    /**
     * Stok düzeltmeleri listesi
     */
    public function adjustments(Request $request)
    {
        $query = StockAdjustment::with(['creator', 'approver', 'items.product']);

        // Durum filtresi
        if ($request->filled('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        // Tip filtresi
        if ($request->filled('adjustment_type') && $request->adjustment_type != '') {
            $query->where('adjustment_type', $request->adjustment_type);
        }

        // Kullanıcı filtresi
        if ($request->filled('user_id') && $request->user_id != '') {
            $query->where('created_by', $request->user_id);
        }

        // Tarih aralığı filtresi
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Arama
        if ($request->filled('search') && $request->search != '') {
            $query->where(function($q) use ($request) {
                $q->where('adjustment_number', 'like', '%' . $request->search . '%')
                  ->orWhere('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        // Sıralama
        $allowedSortFields = ['created_at', 'adjustment_number', 'title', 'status', 'total_value'];
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        
        if (empty($sortField) || !in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }
        if (empty($sortDirection) || !in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }
        
        $query->orderBy($sortField, $sortDirection);

        $adjustments = $query->paginate(20)->withQueryString();

        // Düzeltme istatistikleri
        $adjustmentStats = $this->getAdjustmentStatistics($request);

        return Inertia::render('Stock/Adjustments', [
            'adjustments' => $adjustments,
            'filters' => $request->all(['search', 'status', 'adjustment_type', 'user_id', 'date_from', 'date_to', 'sort_field', 'sort_direction']),
            'users' => \App\Models\User::select('id', 'name')->orderBy('name')->get(),
            'adjustmentStats' => $adjustmentStats,
        ]);
    }

    /**
     * Yeni stok düzeltmesi oluşturma formu
     */
    public function createAdjustment()
    {
        return Inertia::render('Stock/CreateAdjustment', [
            'products' => Product::with(['units'])->select('id', 'name', 'code', 'sku', 'stock_quantity', 'cost_price')->orderBy('name')->get(),
            'adjustmentTypes' => [
                ['value' => 'increase', 'label' => 'Stok Artırma'],
                ['value' => 'decrease', 'label' => 'Stok Azaltma'],
                ['value' => 'count_adjustment', 'label' => 'Sayım Düzeltmesi'],
                ['value' => 'damage', 'label' => 'Hasar/Zayi'],
                ['value' => 'expiry', 'label' => 'Son Kullanma Tarihi'],
                ['value' => 'transfer_correction', 'label' => 'Transfer Düzeltmesi'],
                ['value' => 'other', 'label' => 'Diğer'],
            ],
            'reasonCodes' => [
                'PHYSICAL_COUNT' => 'Fiziki Sayım',
                'DAMAGE' => 'Hasar',
                'THEFT' => 'Kayıp/Çalınma',
                'EXPIRY' => 'Son Kullanma Tarihi',
                'SYSTEM_ERROR' => 'Sistem Hatası',
                'TRANSFER_ERROR' => 'Transfer Hatası',
                'OTHER' => 'Diğer'
            ]
        ]);
    }

    /**
     * Stok düzeltmesi kaydetme
     */
    public function storeAdjustment(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'adjustment_type' => 'required|in:increase,decrease,count_adjustment,damage,expiry,transfer_correction,other',
            'reason_code' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_unit_id' => 'nullable|exists:product_units,id',
            'items.*.current_quantity' => 'required|numeric|min:0',
            'items.*.adjusted_quantity' => 'required|numeric|min:0',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'items.*.reason' => 'nullable|string|max:255',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Create adjustment
            $adjustment = StockAdjustment::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'adjustment_type' => $validated['adjustment_type'],
                'reason_code' => $validated['reason_code'],
                'notes' => $validated['notes'],
                'status' => 'pending'
            ]);

            $totalItems = 0;
            $totalValue = 0;

            // Create adjustment items
            foreach ($validated['items'] as $itemData) {
                $currentQty = $itemData['current_quantity'];
                $adjustedQty = $itemData['adjusted_quantity'];
                $differenceQty = $adjustedQty - $currentQty;
                $unitCost = $itemData['unit_cost'];
                $totalCost = abs($differenceQty) * $unitCost;

                if ($differenceQty != 0) { // Only create items with actual changes
                    StockAdjustmentItem::create([
                        'stock_adjustment_id' => $adjustment->id,
                        'product_id' => $itemData['product_id'],
                        'product_unit_id' => $itemData['product_unit_id'],
                        'current_quantity' => $currentQty,
                        'adjusted_quantity' => $adjustedQty,
                        'difference_quantity' => $differenceQty,
                        'unit_cost' => $unitCost,
                        'total_cost' => $totalCost,
                        'reason' => $itemData['reason'],
                        'notes' => $itemData['notes'],
                    ]);

                    $totalItems++;
                    $totalValue += $totalCost;
                }
            }

            // Update adjustment totals
            $adjustment->update([
                'total_items' => $totalItems,
                'total_value' => $totalValue
            ]);

            DB::commit();

            return redirect()->route('stock.adjustments')
                ->with('success', 'Stok düzeltmesi başarıyla oluşturuldu.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 'Stok düzeltmesi oluşturulurken bir hata oluştu: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Stok düzeltmesi detayı
     */
    public function showAdjustment(StockAdjustment $adjustment)
    {
        $adjustment->load(['items.product', 'items.unit', 'creator', 'approver']);

        return Inertia::render('Stock/ShowAdjustment', [
            'adjustment' => $adjustment,
        ]);
    }

    /**
     * Stok düzeltmesi onaylama
     */
    public function approveAdjustment(StockAdjustment $adjustment)
    {
        if (!$adjustment->canBeApproved()) {
            return back()->with('error', 'Bu düzeltme onaylanamaz.');
        }

        DB::beginTransaction();

        try {
            $adjustment->approve();
            
            DB::commit();

            return back()->with('success', 'Stok düzeltmesi onaylandı.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 'Onaylama sırasında bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Stok düzeltmesi reddetme
     */
    public function rejectAdjustment(StockAdjustment $adjustment)
    {
        if (!$adjustment->canBeRejected()) {
            return back()->with('error', 'Bu düzeltme reddedilemez.');
        }

        DB::beginTransaction();

        try {
            $adjustment->reject();
            
            DB::commit();

            return back()->with('success', 'Stok düzeltmesi reddedildi.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 'Reddetme sırasında bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Stok düzeltmesi tamamlama (stok hareketlerini uygula)
     */
    public function completeAdjustment(StockAdjustment $adjustment)
    {
        if (!$adjustment->canBeCompleted()) {
            return back()->with('error', 'Bu düzeltme tamamlanamaz.');
        }

        DB::beginTransaction();

        try {
            $adjustment->complete();
            
            DB::commit();

            return back()->with('success', 'Stok düzeltmesi tamamlandı ve stok hareketleri uygulandı.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 'Tamamlama sırasında bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Stok düzeltmesi silme
     */
    public function destroyAdjustment(StockAdjustment $adjustment)
    {
        if (!$adjustment->canBeDeleted()) {
            return back()->with('error', 'Bu düzeltme silinemez.');
        }

        try {
            $adjustment->delete();

            return redirect()->route('stock.adjustments')
                ->with('success', 'Stok düzeltmesi silindi.');

        } catch (\Exception $e) {
            return back()->with('error', 'Silme sırasında bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Stok düzeltme istatistiklerini hesapla
     */
    private function getAdjustmentStatistics($request = null)
    {
        $query = StockAdjustment::query();
        
        // Aynı filtreleri uygula
        if ($request) {
            if ($request->filled('status') && $request->status != '') {
                $query->where('status', $request->status);
            }
            if ($request->filled('adjustment_type') && $request->adjustment_type != '') {
                $query->where('adjustment_type', $request->adjustment_type);
            }
            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
        }

        $totalAdjustments = $query->count();
        $pendingAdjustments = (clone $query)->where('status', 'pending')->count();
        $approvedAdjustments = (clone $query)->where('status', 'approved')->count();
        $completedAdjustments = (clone $query)->where('status', 'completed')->count();
        $rejectedAdjustments = (clone $query)->where('status', 'rejected')->count();
        
        $totalValue = (clone $query)->where('status', 'completed')->sum('total_value') ?? 0;

        return [
            'total_adjustments' => $totalAdjustments,
            'pending_adjustments' => $pendingAdjustments,
            'approved_adjustments' => $approvedAdjustments,
            'completed_adjustments' => $completedAdjustments,
            'rejected_adjustments' => $rejectedAdjustments,
            'total_adjustment_value' => $totalValue,
        ];
    }

    /**
     * Stok transferleri listesi
     */
    public function transfers(Request $request)
    {
        $query = StockTransfer::with(['fromLocation', 'toLocation', 'requester', 'items.product']);

        // Durum filtresi
        if ($request->filled('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        // Transfer türü filtresi
        if ($request->filled('transfer_type') && $request->transfer_type != '') {
            $query->where('transfer_type', $request->transfer_type);
        }

        // Kaynak lokasyon filtresi
        if ($request->filled('from_location_id') && $request->from_location_id != '') {
            $query->where('from_location_id', $request->from_location_id);
        }

        // Hedef lokasyon filtresi
        if ($request->filled('to_location_id') && $request->to_location_id != '') {
            $query->where('to_location_id', $request->to_location_id);
        }

        // Öncelik filtresi
        if ($request->filled('priority') && $request->priority != '') {
            $query->where('priority', $request->priority);
        }

        // Kullanıcı filtresi
        if ($request->filled('user_id') && $request->user_id != '') {
            $query->where('requested_by', $request->user_id);
        }

        // Tarih aralığı filtresi
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Arama
        if ($request->filled('search') && $request->search != '') {
            $query->where(function($q) use ($request) {
                $q->where('transfer_number', 'like', '%' . $request->search . '%')
                  ->orWhere('title', 'like', '%' . $request->search . '%')
                  ->orWhere('tracking_number', 'like', '%' . $request->search . '%');
            });
        }

        // Sıralama
        $allowedSortFields = ['created_at', 'transfer_number', 'title', 'status', 'expected_date', 'total_value'];
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        
        if (empty($sortField) || !in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }
        if (empty($sortDirection) || !in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }
        
        $query->orderBy($sortField, $sortDirection);

        $transfers = $query->paginate(20)->withQueryString();

        // Transfer istatistikleri
        $transferStats = $this->getTransferStatistics($request);

        return Inertia::render('Stock/Transfers', [
            'transfers' => $transfers,
            'filters' => $request->all(['search', 'status', 'transfer_type', 'from_location_id', 'to_location_id', 'priority', 'user_id', 'date_from', 'date_to', 'sort_field', 'sort_direction']),
            'locations' => Location::active()->select('id', 'name', 'code')->orderBy('name')->get(),
            'users' => \App\Models\User::select('id', 'name')->orderBy('name')->get(),
            'transferStats' => $transferStats,
        ]);
    }

    /**
     * Yeni stok transferi oluşturma formu
     */
    public function createTransfer()
    {
        return Inertia::render('Stock/CreateTransfer', [
            'locations' => Location::active()->select('id', 'name', 'code', 'address')->orderBy('name')->get(),
            'products' => Product::with(['units'])->select('id', 'name', 'code', 'sku', 'stock_quantity', 'cost_price')->orderBy('name')->get(),
            'productUnits' => ProductUnit::join('units', 'product_units.unit_id', '=', 'units.id')
                ->select('product_units.id', 'product_units.product_id', 'units.name as name', 'product_units.conversion_factor', 'product_units.is_base_unit')
                ->orderBy('units.name')
                ->get(),
            'transferTypes' => [
                ['value' => 'internal', 'label' => 'İç Transfer'],
                ['value' => 'external', 'label' => 'Dış Transfer'],
                ['value' => 'warehouse_to_store', 'label' => 'Depo → Mağaza'],
                ['value' => 'store_to_warehouse', 'label' => 'Mağaza → Depo'],
                ['value' => 'store_to_store', 'label' => 'Mağaza → Mağaza'],
                ['value' => 'emergency', 'label' => 'Acil Transfer'],
                ['value' => 'return', 'label' => 'İade Transfer'],
            ],
            'priorities' => [
                ['value' => 'low', 'label' => 'Düşük'],
                ['value' => 'normal', 'label' => 'Normal'],
                ['value' => 'high', 'label' => 'Yüksek'],
                ['value' => 'urgent', 'label' => 'Acil'],
            ]
        ]);
    }

    /**
     * Stok transferi kaydetme
     */
    public function storeTransfer(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'from_location_id' => 'required|exists:locations,id',
            'to_location_id' => 'required|exists:locations,id|different:from_location_id',
            'transfer_type' => 'required|in:internal,external,warehouse_to_store,store_to_warehouse,store_to_store,emergency,return',
            'priority' => 'required|in:low,normal,high,urgent',
            'expected_date' => 'nullable|date|after_or_equal:today',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_unit_id' => 'nullable|exists:product_units,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Create transfer
            $transfer = StockTransfer::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'from_location_id' => $validated['from_location_id'],
                'to_location_id' => $validated['to_location_id'],
                'transfer_type' => $validated['transfer_type'],
                'priority' => $validated['priority'],
                'expected_date' => $validated['expected_date'],
                'notes' => $validated['notes'],
                'status' => 'pending'
            ]);

            $totalItems = 0;
            $totalValue = 0;

            // Create transfer items
            foreach ($validated['items'] as $itemData) {
                $quantity = $itemData['quantity'];
                $unitCost = $itemData['unit_cost'];
                $totalCost = $quantity * $unitCost;

                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'product_id' => $itemData['product_id'],
                    'product_unit_id' => $itemData['product_unit_id'],
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'total_cost' => $totalCost,
                    'notes' => $itemData['notes'],
                ]);

                $totalItems++;
                $totalValue += $totalCost;
            }

            // Update transfer totals
            $transfer->update([
                'total_items' => $totalItems,
                'total_value' => $totalValue
            ]);

            DB::commit();

            return redirect()->route('stock.transfers')
                ->with('success', 'Stok transferi başarıyla oluşturuldu.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 'Stok transferi oluşturulurken bir hata oluştu: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Stok transferi detayı
     */
    public function showTransfer(StockTransfer $transfer)
    {
        $transfer->load([
            'items.product', 
            'items.unit', 
            'fromLocation', 
            'toLocation', 
            'requester', 
            'approver', 
            'shipper', 
            'receiver'
        ]);

        return Inertia::render('Stock/ShowTransfer', [
            'transfer' => $transfer,
        ]);
    }

    /**
     * Stok transferi onaylama
     */
    public function approveTransfer(StockTransfer $transfer)
    {
        if (!$transfer->canBeApproved()) {
            return back()->with('error', 'Bu transfer onaylanamaz.');
        }

        try {
            $transfer->approve();
            
            return back()->with('success', 'Stok transferi onaylandı.');

        } catch (\Exception $e) {
            return back()->with('error', 'Onaylama sırasında bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Stok transferi gönderme
     */
    public function shipTransfer(Request $request, StockTransfer $transfer)
    {
        $validated = $request->validate([
            'tracking_number' => 'nullable|string|max:255',
            'carrier' => 'nullable|string|max:255',
        ]);

        if (!$transfer->canBeShipped()) {
            return back()->with('error', 'Bu transfer gönderilemez.');
        }

        DB::beginTransaction();

        try {
            $transfer->ship(
                auth()->id(),
                $validated['tracking_number'] ?? null,
                $validated['carrier'] ?? null
            );
            
            DB::commit();

            return back()->with('success', 'Stok transferi gönderildi ve stok hareketleri oluşturuldu.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 'Gönderme sırasında bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Stok transferi teslim alma
     */
    public function receiveTransfer(Request $request, StockTransfer $transfer)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.item_id' => 'required|exists:stock_transfer_items,id',
            'items.*.received_quantity' => 'required|numeric|min:0',
        ]);

        if (!$transfer->canBeReceived()) {
            return back()->with('error', 'Bu transfer teslim alınamaz.');
        }

        DB::beginTransaction();

        try {
            $receivedItems = [];
            foreach ($validated['items'] as $itemData) {
                $receivedItems[$itemData['item_id']] = [
                    'received_quantity' => $itemData['received_quantity']
                ];
            }

            $transfer->receive(auth()->id(), $receivedItems);
            
            DB::commit();

            return back()->with('success', 'Stok transferi teslim alındı ve stok hareketleri oluşturuldu.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 'Teslim alma sırasında bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Stok transferi iptal etme
     */
    public function cancelTransfer(Request $request, StockTransfer $transfer)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        if (!$transfer->canBeCancelled()) {
            return back()->with('error', 'Bu transfer iptal edilemez.');
        }

        try {
            $transfer->cancel($validated['reason'] ?? null);

            return back()->with('success', 'Stok transferi iptal edildi.');

        } catch (\Exception $e) {
            return back()->with('error', 'İptal sırasında bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Stok transferi silme
     */
    public function destroyTransfer(StockTransfer $transfer)
    {
        if (!$transfer->canBeDeleted()) {
            return back()->with('error', 'Bu transfer silinemez.');
        }

        try {
            $transfer->delete();

            return redirect()->route('stock.transfers')
                ->with('success', 'Stok transferi silindi.');

        } catch (\Exception $e) {
            return back()->with('error', 'Silme sırasında bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Stok transfer istatistiklerini hesapla
     */
    private function getTransferStatistics($request = null)
    {
        $query = StockTransfer::query();
        
        // Aynı filtreleri uygula
        if ($request) {
            if ($request->filled('status') && $request->status != '') {
                $query->where('status', $request->status);
            }
            if ($request->filled('transfer_type') && $request->transfer_type != '') {
                $query->where('transfer_type', $request->transfer_type);
            }
            if ($request->filled('from_location_id') && $request->from_location_id != '') {
                $query->where('from_location_id', $request->from_location_id);
            }
            if ($request->filled('to_location_id') && $request->to_location_id != '') {
                $query->where('to_location_id', $request->to_location_id);
            }
            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
        }

        $totalTransfers = $query->count();
        $pendingTransfers = (clone $query)->where('status', 'pending')->count();
        $approvedTransfers = (clone $query)->where('status', 'approved')->count();
        $shippedTransfers = (clone $query)->where('status', 'shipped')->count();
        $receivedTransfers = (clone $query)->where('status', 'received')->count();
        $completedTransfers = (clone $query)->where('status', 'completed')->count();
        $cancelledTransfers = (clone $query)->where('status', 'cancelled')->count();
        
        $totalValue = (clone $query)->whereIn('status', ['completed', 'received'])->sum('total_value') ?? 0;
        $inTransitCount = (clone $query)->whereIn('status', ['shipped', 'received'])->count();

        return [
            'total_transfers' => $totalTransfers,
            'pending_transfers' => $pendingTransfers,
            'approved_transfers' => $approvedTransfers,
            'shipped_transfers' => $shippedTransfers,
            'received_transfers' => $receivedTransfers,
            'completed_transfers' => $completedTransfers,
            'cancelled_transfers' => $cancelledTransfers,
            'in_transit_transfers' => $inTransitCount,
            'total_transfer_value' => $totalValue,
        ];
    }

    /**
     * Stok raporu export
     */
    public function exportStock(Request $request)
    {
        // Bu method Excel export için implement edilecek
        // Şimdilik CSV export yapalım

        $query = Product::with(['category', 'brand']);

        // Filtreleri uygula (index method'undaki gibi)
        if ($request->filled('search') && $request->search != '') {
            $query->search($request->search);
        }

        if ($request->filled('category_id') && $request->category_id != '') {
            $query->byCategory($request->category_id);
        }

        if ($request->filled('brand_id') && $request->brand_id != '') {
            $query->byBrand($request->brand_id);
        }

        $products = $query->get();

        $filename = 'stok_raporu_' . date('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($products) {
            $file = fopen('php://output', 'w');
            
            // UTF-8 BOM for Excel compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Header
            fputcsv($file, [
                'Ürün Kodu',
                'Ürün Adı',
                'SKU',
                'Kategori',
                'Marka',
                'Mevcut Stok',
                'Min. Stok',
                'Max. Stok',
                'Maliyet Fiyatı',
                'Stok Değeri',
                'Stok Durumu'
            ], ';');

            foreach ($products as $product) {
                $stockStatus = '';
                if ($product->stock_quantity == 0) {
                    $stockStatus = 'Stokta Yok';
                } elseif ($product->stock_quantity <= $product->min_stock_level) {
                    $stockStatus = 'Düşük Stok';
                } else {
                    $stockStatus = 'Stokta';
                }

                fputcsv($file, [
                    $product->code,
                    $product->name,
                    $product->sku,
                    $product->category->name ?? '',
                    $product->brand->name ?? '',
                    $product->stock_quantity,
                    $product->min_stock_level,
                    $product->max_stock_level,
                    number_format($product->cost_price, 2, ',', '.'),
                    number_format($product->stock_quantity * $product->cost_price, 2, ',', '.'),
                    $stockStatus
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Stok raporları ana sayfası
     */
    public function reports(Request $request)
    {
        return Inertia::render('Stock/Reports', [
            'categories' => Category::select('id', 'name')->orderBy('name')->get(),
            'brands' => Brand::select('id', 'name')->orderBy('name')->get(),
            'locations' => Location::active()->select('id', 'name', 'code')->orderBy('name')->get(),
        ]);
    }

    /**
     * Stok durumu raporu
     */
    public function stockStatusReport(Request $request)
    {
        $query = Product::with(['category', 'brand']);

        // Filtreleri uygula
        if ($request->filled('category_id')) {
            $query->byCategory($request->category_id);
        }
        if ($request->filled('brand_id')) {
            $query->byBrand($request->brand_id);
        }
        if ($request->filled('stock_status')) {
            switch ($request->stock_status) {
                case 'in_stock':
                    $query->where('stock_quantity', '>', 0);
                    break;
                case 'out_of_stock':
                    $query->where('stock_quantity', 0);
                    break;
                case 'low_stock':
                    $query->whereRaw('stock_quantity > 0 AND stock_quantity <= min_stock_level');
                    break;
                case 'overstock':
                    $query->whereRaw('stock_quantity > max_stock_level');
                    break;
            }
        }

        $products = $query->orderBy('name')->get()->map(function($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'category' => $product->category->name ?? '',
                'brand' => $product->brand->name ?? '',
                'stock_quantity' => $product->stock_quantity,
                'cost_price' => $product->cost_price,
                'stock_value' => $product->stock_quantity * $product->cost_price,
            ];
        });

        // İstatistikler
        $totalProducts = $products->count();
        $totalStockValue = $products->sum('stock_value');
        $inStockCount = $products->where('stock_quantity', '>', 0)->count();
        $outOfStockCount = $products->where('stock_quantity', 0)->count();
        $lowStockCount = $products->filter(function($product) {
            return $product['stock_quantity'] > 0 && $product['stock_quantity'] <= 10; // min_stock_level yerine sabit değer
        })->count();

        return response()->json([
            'products' => $products,
            'statistics' => [
                'total_products' => $totalProducts,
                'total_stock_value' => $totalStockValue,
                'in_stock_count' => $inStockCount,
                'out_of_stock_count' => $outOfStockCount,
                'low_stock_count' => $lowStockCount,
            ]
        ]);
    }

    /**
     * Stok hareket raporu
     */
    public function stockMovementReport(Request $request)
    {
        $query = InventoryMovement::with(['inventoryItem', 'warehouse', 'creator']);

        // Tarih aralığı
        if ($request->filled('date_from')) {
            $query->whereDate('movement_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('movement_date', '<=', $request->date_to);
        }

        // Ürün filtresi
        if ($request->filled('product_id')) {
            $query->where('inventory_item_id', $request->product_id);
        }

        // Hareket tipi filtresi
        if ($request->filled('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }

        // Depo filtresi
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        $movements = $query->orderBy('created_at', 'desc')->get();

        // İstatistikler
        $totalInbound = $movements->where('type', 'inbound')->sum('quantity');
        $totalOutbound = $movements->where('type', 'outbound')->sum('quantity');
        $totalAdjustments = $movements->where('type', 'adjustment')->sum('quantity');
        $totalTransfers = $movements->where('type', 'transfer')->sum('quantity');

        return response()->json([
            'movements' => $movements,
            'statistics' => [
                'total_inbound' => $totalInbound,
                'total_outbound' => $totalOutbound,
                'total_adjustments' => $totalAdjustments,
                'total_transfers' => $totalTransfers,
                'net_movement' => $totalInbound - $totalOutbound,
            ]
        ]);
    }

    /**
     * ABC analizi raporu
     */
    public function abcAnalysisReport(Request $request)
    {
        // Date range handling
        $dateFrom = $request->filled('date_from') ? $request->date_from : now()->subMonths(12)->format('Y-m-d');
        $dateTo = $request->filled('date_to') ? $request->date_to : now()->format('Y-m-d');
        $dateRange = [
            'from' => $dateFrom,
            'to' => $dateTo
        ];
        
        // ABC analizi için ürünlerin değer bazında sıralaması
        $query = Product::with(['category', 'brand']);

        // Tarih aralığına göre satış verilerini dahil et (eğer sales tablosu varsa)
        // Şimdilik stok değeri bazında analiz yapalım
        
        $products = $query->get()->map(function($product) {
            // Null veya negatif değerleri kontrol et
            $stockQuantity = max(0, $product->stock_quantity ?? 0);
            $costPrice = max(0, $product->cost_price ?? 0);
            $stockValue = $stockQuantity * $costPrice;
            
            return [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'category' => $product->category->name ?? '',
                'brand' => $product->brand->name ?? '',
                'stock_quantity' => $stockQuantity,
                'cost_price' => $costPrice,
                'stock_value' => $stockValue,
            ];
        })->sortByDesc('stock_value')->values();

        $totalValue = $products->sum('stock_value');
        $runningTotal = 0;
        
        // Sıfıra bölme hatasını önle
        if ($totalValue == 0) {
            return Inertia::render('Stock/Reports/AbcAnalysis', [
                'products' => collect([]),
                'categoryStats' => [
                    'A' => ['count' => 0, 'percentage' => 0, 'value' => 0, 'value_percentage' => 0],
                    'B' => ['count' => 0, 'percentage' => 0, 'value' => 0, 'value_percentage' => 0],
                    'C' => ['count' => 0, 'percentage' => 0, 'value' => 0, 'value_percentage' => 0],
                ],
                'totalValue' => 0,
                'totalProducts' => 0,
                'dateRange' => $dateRange,
                'message' => 'Analiz için yeterli stok verisi bulunamadı. Ürünlerin maliyet fiyatlarını kontrol edin.'
            ]);
        }
        
        $productsWithABC = $products->map(function($product, $index) use ($totalValue, &$runningTotal) {
            $runningTotal += $product['stock_value'];
            $cumulativePercentage = $this->safePercentage($runningTotal, $totalValue);
            
            if ($cumulativePercentage <= 80) {
                $category = 'A';
            } elseif ($cumulativePercentage <= 95) {
                $category = 'B';
            } else {
                $category = 'C';
            }
            
            return array_merge($product, [
                'abc_category' => $category,
                'cumulative_percentage' => $cumulativePercentage,
                'value_percentage' => $this->safePercentage($product['stock_value'], $totalValue),
            ]);
        });

        // Kategori istatistikleri
        $categoryStats = [
            'A' => $productsWithABC->where('abc_category', 'A'),
            'B' => $productsWithABC->where('abc_category', 'B'),
            'C' => $productsWithABC->where('abc_category', 'C'),
        ];

        $statistics = [
            'total_products' => $products->count(),
            'total_value' => $totalValue,
            'category_a_count' => $categoryStats['A']->count(),
            'category_a_value' => $categoryStats['A']->sum('stock_value'),
            'category_b_count' => $categoryStats['B']->count(),
            'category_b_value' => $categoryStats['B']->sum('stock_value'),
            'category_c_count' => $categoryStats['C']->count(),
            'category_c_value' => $categoryStats['C']->sum('stock_value'),
        ];

        return response()->json([
            'products' => $productsWithABC,
            'statistics' => $statistics,
            'dateRange' => $dateRange
        ]);
    }

    /**
     * Stok yaşlandırma raporu
     */
    public function stockAgingReport(Request $request)
    {
        // Ürünlerin son hareket tarihlerine dayalı yaşlandırma analizi
        $query = Product::with(['category', 'brand'])
            ->leftJoin('inventory_movements', function($join) {
                $join->on('products.id', '=', 'inventory_movements.inventory_item_id')
                     ->where('inventory_movements.direction', 'out');
            })
            ->select('products.*', DB::raw('MAX(inventory_movements.movement_date) as last_movement_date'))
            ->groupBy('products.id');

        if ($request->filled('category_id')) {
            $query->where('products.category_id', $request->category_id);
        }
        if ($request->filled('brand_id')) {
            $query->where('products.brand_id', $request->brand_id);
        }

        $products = $query->get()->map(function($product) {
            $lastMovementDate = $product->last_movement_date ? 
                \Carbon\Carbon::parse($product->last_movement_date) : 
                \Carbon\Carbon::parse($product->created_at);
            
            $daysOld = $lastMovementDate->diffInDays(now());
            
            if ($daysOld <= 30) {
                $ageCategory = '0-30 gün';
            } elseif ($daysOld <= 60) {
                $ageCategory = '31-60 gün';
            } elseif ($daysOld <= 90) {
                $ageCategory = '61-90 gün';
            } elseif ($daysOld <= 180) {
                $ageCategory = '91-180 gün';
            } else {
                $ageCategory = '180+ gün';
            }

            return [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'category' => $product->category->name ?? '',
                'brand' => $product->brand->name ?? '',
                'stock_quantity' => $product->stock_quantity,
                'cost_price' => $product->cost_price,
                'stock_value' => $product->stock_quantity * $product->cost_price,
                'last_movement_date' => $product->last_movement_date,
                'days_old' => $daysOld,
                'age_category' => $ageCategory,
            ];
        });

        // Yaş kategorisi istatistikleri
        $ageStats = $products->groupBy('age_category')->map(function($items, $category) {
            return [
                'category' => $category,
                'count' => $items->count(),
                'total_quantity' => $items->sum('stock_quantity'),
                'total_value' => $items->sum('stock_value'),
            ];
        })->values();

        return response()->json([
            'products' => $products->sortByDesc('days_old')->values(),
            'age_statistics' => $ageStats
        ]);
    }

    /**
     * Stok dönüş hızı raporu
     */
    public function stockTurnoverReport(Request $request)
    {
        // Son 12 ayın verileri için stok dönüş hızı analizi
        $startDate = now()->subMonths(12);
        $endDate = now();

        $query = Product::with(['category', 'brand']);

        if ($request->filled('category_id')) {
            $query->byCategory($request->category_id);
        }
        if ($request->filled('brand_id')) {
            $query->byBrand($request->brand_id);
        }

        $products = $query->get()->map(function($product) use ($startDate, $endDate) {
            // Çıkış hareketlerinin toplamı (COGS - Cost of Goods Sold)
            $totalOutbound = InventoryMovement::where('inventory_item_id', $product->id)
                ->where('direction', 'out')
                ->whereBetween('movement_date', [$startDate, $endDate])
                ->sum('base_quantity');

            // Ortalama stok (basit hesaplama - başlangıç + bitiş / 2)
            $averageStock = $product->stock_quantity; // Geliştirilecek

            // Stok dönüş hızı = Yıllık Satış Miktarı / Ortalama Stok
            $turnoverRate = $this->safeDivision($totalOutbound, $averageStock, 0);

            // Stok günleri = 365 / Dönüş Hızı
            $stockDays = $this->safeDivision(365, $turnoverRate, 365);

            $performance = '';
            if ($turnoverRate >= 12) {
                $performance = 'Mükemmel';
            } elseif ($turnoverRate >= 6) {
                $performance = 'İyi';
            } elseif ($turnoverRate >= 3) {
                $performance = 'Orta';
            } elseif ($turnoverRate >= 1) {
                $performance = 'Düşük';
            } else {
                $performance = 'Çok Düşük';
            }

            return [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'category' => $product->category->name ?? '',
                'brand' => $product->brand->name ?? '',
                'current_stock' => $product->stock_quantity,
                'total_outbound' => $totalOutbound,
                'average_stock' => $averageStock,
                'turnover_rate' => round($turnoverRate, 2),
                'stock_days' => round($stockDays, 0),
                'performance' => $performance,
                'stock_value' => $product->stock_quantity * $product->cost_price,
            ];
        });

        // Performans kategorilerine göre istatistikler
        $performanceStats = $products->groupBy('performance')->map(function($items, $performance) {
            return [
                'performance' => $performance,
                'count' => $items->count(),
                'total_value' => $items->sum('stock_value'),
                'avg_turnover' => $items->avg('turnover_rate'),
            ];
        })->values();

        return response()->json([
            'products' => $products->sortByDesc('turnover_rate')->values(),
            'performance_statistics' => $performanceStats,
            'period' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d')
            ]
        ]);
    }
}