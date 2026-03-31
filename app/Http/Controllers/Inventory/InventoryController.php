<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryStock;
use App\Models\InventoryMovement;
use App\Models\InventoryAlert;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    /**
     * Display inventory dashboard
     */
    public function dashboard()
    {
        $dashboardData = [
            // Key metrics
            'metrics' => [
                'total_items' => InventoryItem::active()->count(),
                'total_stock_value' => InventoryStock::active()->sum('total_cost'),
                'low_stock_items' => InventoryItem::active()->whereHas('stocks', function($q) {
                    $q->whereRaw('quantity_available <= reorder_point');
                })->count(),
                'out_of_stock_items' => InventoryItem::active()->whereHas('stocks', function($q) {
                    $q->where('quantity_available', '<=', 0);
                })->count(),
                'expired_items' => InventoryItem::active()->whereHas('stocks', function($q) {
                    $q->where('expiry_date', '<', now())->where('quantity_on_hand', '>', 0);
                })->count(),
                'active_alerts' => InventoryAlert::active()->count(),
            ],

            // Recent movements
            'recent_movements' => InventoryMovement::with(['inventoryItem', 'warehouse', 'creator'])
                ->latest()
                ->limit(10)
                ->get(),

            // Stock by warehouse
            'stock_by_warehouse' => Warehouse::with(['stocks' => function($query) {
                    $query->where('status', 'active');
                }])
                ->get()
                ->map(function($warehouse) {
                    $activeStocks = $warehouse->stocks->where('status', 'active');
                    return [
                        'id' => $warehouse->id,
                        'name' => $warehouse->name,
                        'total_quantity' => $activeStocks->sum('quantity_on_hand'),
                        'total_cost' => $activeStocks->sum('total_cost'),
                    ];
                })
                ->filter(function($warehouse) {
                    return $warehouse['total_quantity'] > 0;
                })
                ->values(),

            // Low stock alerts
            'low_stock_items' => InventoryItem::with(['stocks'])
                ->whereHas('stocks', function($q) {
                    $q->whereRaw('quantity_available <= reorder_point')
                      ->where('quantity_available', '>', 0);
                })
                ->limit(10)
                ->get(),

            // Expiring items
            'expiring_items' => InventoryItem::with(['stocks' => function($query) {
                    $query->where('expiry_date', '<=', now()->addDays(30))
                          ->where('expiry_date', '>', now())
                          ->where('quantity_on_hand', '>', 0);
                }])
                ->whereHas('stocks', function($q) {
                    $q->where('expiry_date', '<=', now()->addDays(30))
                      ->where('expiry_date', '>', now())
                      ->where('quantity_on_hand', '>', 0);
                })
                ->limit(10)
                ->get(),

            // Movement trends (last 30 days)
            'movement_trends' => InventoryMovement::selectRaw('DATE(movement_date) as date, movement_type, COUNT(*) as count')
                ->where('movement_date', '>=', now()->subDays(30))
                ->groupBy('date', 'movement_type')
                ->orderBy('date')
                ->get()
                ->groupBy('date'),

            // ABC Analysis summary
            'abc_summary' => InventoryItem::active()
                ->selectRaw('abc_classification, COUNT(*) as count, SUM(annual_consumption_value) as total_value')
                ->whereNotNull('abc_classification')
                ->groupBy('abc_classification')
                ->get(),
        ];

        return Inertia::render('Inventory/Dashboard', [
            'dashboardData' => $dashboardData,
        ]);
    }

    /**
     * Display inventory items
     */
    public function items(Request $request)
    {
        $query = InventoryItem::with(['stocks', 'movements' => function($q) {
            $q->latest()->limit(3);
        }]);

        // Search filter
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('sku', 'like', '%' . $request->search . '%')
                  ->orWhere('barcode', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Type filter
        if ($request->filled('item_type')) {
            $query->where('item_type', $request->item_type);
        }

        // Category filter
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Stock level filter
        if ($request->filled('stock_level')) {
            switch ($request->stock_level) {
                case 'low':
                    $query->whereHas('stocks', function($q) {
                        $q->whereRaw('quantity_available <= reorder_point');
                    });
                    break;
                case 'out':
                    $query->whereHas('stocks', function($q) {
                        $q->where('quantity_available', '<=', 0);
                    });
                    break;
                case 'normal':
                    $query->whereHas('stocks', function($q) {
                        $q->whereRaw('quantity_available > reorder_point');
                    });
                    break;
            }
        }

        // ABC Classification filter
        if ($request->filled('abc_classification')) {
            $query->where('abc_classification', $request->abc_classification);
        }

        // Sorting
        $sortField = $request->get('sort_field', 'name');
        $sortDirection = $request->get('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $items = $query->paginate(20)->withQueryString();

        // Add computed attributes
        $items->getCollection()->transform(function ($item) {
            $item->total_stock = $item->stocks->sum('quantity_on_hand');
            $item->available_stock = $item->stocks->sum('quantity_available');
            $item->allocated_stock = $item->stocks->sum('quantity_allocated');
            $item->total_value = $item->stocks->sum('total_cost');
            return $item;
        });

        return Inertia::render('Inventory/Items/Index', [
            'items' => $items,
            'filters' => $request->all(['search', 'status', 'item_type', 'category', 'stock_level', 'abc_classification', 'sort_field', 'sort_direction']),
            'categories' => InventoryItem::distinct()->pluck('category')->filter()->sort()->values(),
        ]);
    }

    /**
     * Show inventory item details
     */
    public function showItem(InventoryItem $item)
    {
        $item->load([
            'stocks.warehouse',
            'stocks.location',
            'movements' => function($query) {
                $query->with(['warehouse', 'creator'])->latest()->limit(20);
            },
            'alerts' => function($query) {
                $query->active()->latest();
            },
            'barcodes' => function($query) {
                $query->active();
            }
        ]);

        // Stock summary by warehouse
        $stockByWarehouse = $item->stocks()
            ->with('warehouse')
            ->selectRaw('warehouse_id, SUM(quantity_on_hand) as total_quantity, SUM(quantity_available) as available_quantity, SUM(total_cost) as total_value')
            ->where('status', 'active')
            ->groupBy('warehouse_id')
            ->get();

        // Movement summary by type (last 30 days)
        $movementSummary = $item->movements()
            ->selectRaw('movement_type, direction, COUNT(*) as count, SUM(quantity) as total_quantity')
            ->where('movement_date', '>=', now()->subDays(30))
            ->groupBy('movement_type', 'direction')
            ->get();

        return Inertia::render('Inventory/Items/Show', [
            'item' => $item,
            'stockByWarehouse' => $stockByWarehouse,
            'movementSummary' => $movementSummary,
        ]);
    }

    /**
     * Display inventory movements
     */
    public function movements(Request $request)
    {
        $query = InventoryMovement::with(['inventoryItem', 'warehouse', 'location', 'creator']);

        // Search filter
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('movement_number', 'like', '%' . $request->search . '%')
                  ->orWhere('reference_number', 'like', '%' . $request->search . '%')
                  ->orWhereHas('inventoryItem', function($subQ) use ($request) {
                      $subQ->where('name', 'like', '%' . $request->search . '%')
                           ->orWhere('sku', 'like', '%' . $request->search . '%');
                  });
            });
        }

        // Movement type filter
        if ($request->filled('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }

        // Direction filter
        if ($request->filled('direction')) {
            $query->where('direction', $request->direction);
        }

        // Warehouse filter
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('movement_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('movement_date', '<=', $request->date_to);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Sorting
        $sortField = $request->get('sort_field', 'movement_date');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $movements = $query->paginate(20)->withQueryString();

        return Inertia::render('Inventory/Movements/Index', [
            'movements' => $movements,
            'filters' => $request->all(['search', 'movement_type', 'direction', 'warehouse_id', 'date_from', 'date_to', 'status', 'sort_field', 'sort_direction']),
            'warehouses' => Warehouse::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Display stock levels
     */
    public function stocks(Request $request)
    {
        $query = InventoryStock::with(['inventoryItem', 'warehouse', 'location']);

        // Search filter
        if ($request->filled('search')) {
            $query->whereHas('inventoryItem', function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('sku', 'like', '%' . $request->search . '%');
            });
        }

        // Warehouse filter
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Condition filter
        if ($request->filled('condition')) {
            $query->where('condition', $request->condition);
        }

        // Stock level filter
        if ($request->filled('stock_level')) {
            switch ($request->stock_level) {
                case 'available':
                    $query->where('quantity_available', '>', 0);
                    break;
                case 'allocated':
                    $query->where('quantity_allocated', '>', 0);
                    break;
                case 'empty':
                    $query->where('quantity_on_hand', '<=', 0);
                    break;
            }
        }

        // Expiry filter
        if ($request->filled('expiry_status')) {
            switch ($request->expiry_status) {
                case 'expiring':
                    $query->where('expiry_date', '<=', now()->addDays(30))
                          ->where('expiry_date', '>', now());
                    break;
                case 'expired':
                    $query->where('expiry_date', '<', now());
                    break;
            }
        }

        // Sorting
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $stocks = $query->paginate(20)->withQueryString();

        return Inertia::render('Inventory/Stocks/Index', [
            'stocks' => $stocks,
            'filters' => $request->all(['search', 'warehouse_id', 'status', 'condition', 'stock_level', 'expiry_status', 'sort_field', 'sort_direction']),
            'warehouses' => Warehouse::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Display inventory alerts
     */
    public function alerts(Request $request)
    {
        $query = InventoryAlert::with(['inventoryItem', 'warehouse', 'assignedTo']);

        // Search filter
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('message', 'like', '%' . $request->search . '%')
                  ->orWhereHas('inventoryItem', function($subQ) use ($request) {
                      $subQ->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        // Alert type filter
        if ($request->filled('alert_type')) {
            $query->where('alert_type', $request->alert_type);
        }

        // Severity filter
        if ($request->filled('severity')) {
            $query->where('severity', $request->severity);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Warehouse filter
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        // Assignment filter
        if ($request->filled('assigned')) {
            if ($request->assigned === 'me') {
                $query->where('assigned_to', auth()->id());
            } elseif ($request->assigned === 'unassigned') {
                $query->whereNull('assigned_to');
            }
        }

        // Sorting
        $sortField = $request->get('sort_field', 'triggered_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $alerts = $query->paginate(20)->withQueryString();

        return Inertia::render('Inventory/Alerts/Index', [
            'alerts' => $alerts,
            'filters' => $request->all(['search', 'alert_type', 'severity', 'status', 'warehouse_id', 'assigned', 'sort_field', 'sort_direction']),
            'warehouses' => Warehouse::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Create stock adjustment
     */
    public function createAdjustment(Request $request)
    {
        $validated = $request->validate([
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
            'adjustment_type' => 'required|in:increase,decrease,set',
            'quantity' => 'required|numeric|min:0',
            'reason' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'lot_number' => 'nullable|string|max:50',
            'expiry_date' => 'nullable|date|after:today',
        ]);

        DB::beginTransaction();
        try {
            $item = InventoryItem::findOrFail($validated['inventory_item_id']);
            
            // Find or create stock record
            $stock = InventoryStock::firstOrCreate([
                'inventory_item_id' => $validated['inventory_item_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'warehouse_location_id' => $validated['warehouse_location_id'],
                'lot_number' => $validated['lot_number'],
            ], [
                'quantity_on_hand' => 0,
                'quantity_available' => 0,
                'unit_cost' => $item->standard_cost ?? 0,
                'condition' => 'good',
                'status' => 'active',
                'expiry_date' => $validated['expiry_date'],
                'created_by' => auth()->id(),
            ]);

            // Calculate adjustment quantity
            $adjustmentQuantity = match($validated['adjustment_type']) {
                'increase' => $validated['quantity'],
                'decrease' => -$validated['quantity'],
                'set' => $validated['quantity'] - $stock->quantity_on_hand,
            };

            // Apply adjustment
            $stock->adjustQuantity($adjustmentQuantity, $validated['reason'], auth()->id());

            // Create movement record
            InventoryMovement::create([
                'movement_number' => InventoryMovement::generateMovementNumber('adjustment'),
                'inventory_item_id' => $validated['inventory_item_id'],
                'inventory_stock_id' => $stock->id,
                'movement_type' => 'adjustment',
                'direction' => $adjustmentQuantity > 0 ? 'in' : 'out',
                'warehouse_id' => $validated['warehouse_id'],
                'warehouse_location_id' => $validated['warehouse_location_id'],
                'quantity' => abs($adjustmentQuantity),
                'unit' => $item->base_unit,
                'base_quantity' => abs($adjustmentQuantity),
                'lot_number' => $validated['lot_number'],
                'unit_cost' => $stock->unit_cost,
                'total_cost' => abs($adjustmentQuantity) * $stock->unit_cost,
                'movement_date' => now(),
                'reason_description' => $validated['reason'],
                'notes' => $validated['notes'],
                'stock_before' => $stock->quantity_on_hand - $adjustmentQuantity,
                'stock_after' => $stock->quantity_on_hand,
                'created_by' => auth()->id(),
            ]);

            DB::commit();

            return back()->with('success', 'Stok düzeltmesi başarıyla oluşturuldu.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Stok düzeltmesi oluşturulurken hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Perform cycle count
     */
    public function cycleCount(Request $request)
    {
        $validated = $request->validate([
            'stock_id' => 'required|exists:inventory_stocks,id',
            'counted_quantity' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $stock = InventoryStock::findOrFail($validated['stock_id']);
        
        try {
            $variance = $stock->performCycleCount(
                $validated['counted_quantity'],
                auth()->id(),
                $validated['notes']
            );

            $message = $variance == 0 
                ? 'Sayım tamamlandı, fark bulunmadı.'
                : "Sayım tamamlandı. Fark: {$variance} {$stock->inventoryItem->base_unit}";

            return back()->with('success', $message);

        } catch (\Exception $e) {
            return back()->with('error', 'Sayım işlemi sırasında hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Scan barcode
     */
    public function scanBarcode(Request $request)
    {
        $validated = $request->validate([
            'barcode' => 'required|string',
            'action' => 'required|in:lookup,receive,issue,count',
            'warehouse_id' => 'required|exists:warehouses,id',
        ]);

        // Find item by barcode
        $item = InventoryItem::where('barcode', $validated['barcode'])->first();
        
        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Barkod bulunamadı.'
            ], 404);
        }

        // Record scan
        $barcode = $item->barcodes()->where('barcode', $validated['barcode'])->first();
        if ($barcode) {
            $barcode->scan(auth()->id());
        }

        // Get item data based on action
        $data = [
            'item' => $item,
            'stocks' => $item->stocks()
                ->where('warehouse_id', $validated['warehouse_id'])
                ->where('status', 'active')
                ->with(['location'])
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Generate reports
     */
    public function reports(Request $request)
    {
        $reportType = $request->get('type', 'stock_summary');
        
        switch ($reportType) {
            case 'stock_summary':
                return $this->stockSummaryReport($request);
            case 'movement_report':
                return $this->movementReport($request);
            case 'abc_analysis':
                return $this->abcAnalysisReport($request);
            case 'expiry_report':
                return $this->expiryReport($request);
            default:
                return $this->stockSummaryReport($request);
        }
    }

    private function stockSummaryReport($request)
    {
        $query = InventoryItem::with(['stocks' => function($q) use ($request) {
            if ($request->filled('warehouse_id')) {
                $q->where('warehouse_id', $request->warehouse_id);
            }
        }]);

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $items = $query->get();

        return Inertia::render('Inventory/Reports/StockSummary', [
            'items' => $items,
            'filters' => $request->all(),
            'warehouses' => Warehouse::select('id', 'name')->get(),
        ]);
    }

    private function movementReport($request)
    {
        $query = InventoryMovement::with(['inventoryItem', 'warehouse']);

        if ($request->filled('date_from')) {
            $query->whereDate('movement_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('movement_date', '<=', $request->date_to);
        }

        $movements = $query->orderBy('movement_date', 'desc')->get();

        return Inertia::render('Inventory/Reports/Movement', [
            'movements' => $movements,
            'filters' => $request->all(),
        ]);
    }

    private function abcAnalysisReport($request)
    {
        $items = InventoryItem::whereNotNull('abc_classification')
            ->orderBy('annual_consumption_value', 'desc')
            ->get();

        return Inertia::render('Inventory/Reports/ABCAnalysis', [
            'items' => $items,
        ]);
    }

    private function expiryReport($request)
    {
        $expiringItems = InventoryStock::with(['inventoryItem', 'warehouse', 'location'])
            ->where('expiry_date', '<=', now()->addDays(90))
            ->where('expiry_date', '>', now())
            ->where('quantity_on_hand', '>', 0)
            ->orderBy('expiry_date')
            ->get();

        return Inertia::render('Inventory/Reports/Expiry', [
            'expiringItems' => $expiringItems,
        ]);
    }
}