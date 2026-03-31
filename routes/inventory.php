<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Inventory\InventoryController;
use App\Http\Controllers\Inventory\BarcodeController;

// Inventory Management Routes
Route::middleware(['auth', 'verified'])->prefix('inventory')->name('inventory.')->group(function () {

    // Dashboard
    Route::get('/', [InventoryController::class, 'dashboard'])->middleware('permission:inventory.dashboard')->name('dashboard');

    // Inventory Items
    Route::get('/items', [InventoryController::class, 'items'])->middleware('permission:inventory.items.view')->name('items.index');
    Route::get('/items/{item}', [InventoryController::class, 'showItem'])->middleware('permission:inventory.items.view')->name('items.show');

    // Stock Management
    Route::get('/stocks', [InventoryController::class, 'stocks'])->middleware('permission:inventory.stocks.view')->name('stocks.index');

    // Inventory Movements
    Route::get('/movements', [InventoryController::class, 'movements'])->middleware('permission:inventory.movements.view')->name('movements.index');

    // Stock Adjustments
    Route::post('/adjustments', [InventoryController::class, 'createAdjustment'])->middleware('permission:inventory.movements.create')->name('adjustments.create');

    // Cycle Counting
    Route::post('/cycle-count', [InventoryController::class, 'cycleCount'])->middleware('permission:stock.count')->name('cycle-count');

    // Barcode Scanning
    Route::post('/scan', [InventoryController::class, 'scanBarcode'])->middleware('permission:inventory.barcodes.view')->name('scan');

    // Alerts
    Route::get('/alerts', [InventoryController::class, 'alerts'])->middleware('permission:inventory.alerts.view')->name('alerts.index');

    // Reports
    Route::get('/reports', [InventoryController::class, 'reports'])->middleware('permission:inventory.reports')->name('reports');

    // Barcode Management
    Route::prefix('barcodes')->name('barcodes.')->group(function () {
        // Barcode CRUD
        Route::get('/', [BarcodeController::class, 'index'])->middleware('permission:inventory.barcodes.view')->name('index');
        Route::get('/{barcode}', [BarcodeController::class, 'show'])->middleware('permission:inventory.barcodes.view')->name('show');
        Route::put('/{barcode}', [BarcodeController::class, 'update'])->middleware('permission:inventory.barcodes.manage')->name('update');
        Route::delete('/{barcode}', [BarcodeController::class, 'destroy'])->middleware('permission:inventory.barcodes.manage')->name('destroy');

        // Barcode Generation
        Route::post('/generate', [BarcodeController::class, 'generate'])->middleware('permission:inventory.barcodes.manage')->name('generate');
        Route::post('/bulk-generate', [BarcodeController::class, 'bulkGenerate'])->middleware('permission:inventory.barcodes.manage')->name('bulk-generate');

        // Barcode Operations
        Route::post('/scan', [BarcodeController::class, 'scan'])->middleware('permission:inventory.barcodes.view')->name('scan');
        Route::post('/{barcode}/print', [BarcodeController::class, 'print'])->middleware('permission:inventory.barcodes.view')->name('print');
        Route::post('/{barcode}/replace', [BarcodeController::class, 'replace'])->middleware('permission:inventory.barcodes.manage')->name('replace');

        // Barcode Validation
        Route::post('/validate', [BarcodeController::class, 'validateBarcode'])->middleware('permission:inventory.barcodes.view')->name('validate');

        // Statistics
        Route::get('/statistics', [BarcodeController::class, 'statistics'])->middleware('permission:inventory.barcodes.view')->name('statistics');
    });
    
    // API Routes for mobile/scanner integration
    Route::prefix('api')->name('api.')->group(function () {
        // Barcode scanning API
        Route::post('/scan', [BarcodeController::class, 'scan'])->name('scan');
        Route::post('/validate', [BarcodeController::class, 'validateBarcode'])->name('validate');
        
        // Quick lookup
        Route::get('/items/search', function(\Illuminate\Http\Request $request) {
            $query = $request->get('q');
            
            $items = \App\Models\InventoryItem::where('name', 'like', "%{$query}%")
                ->orWhere('sku', 'like', "%{$query}%")
                ->orWhere('barcode', 'like', "%{$query}%")
                ->with(['stocks' => function($q) {
                    $q->where('status', 'active');
                }])
                ->limit(10)
                ->get();
            
            return response()->json($items);
        })->name('items.search');
        
        // Stock lookup by location
        Route::get('/stocks/location/{location}', function(\App\Models\WarehouseLocation $location) {
            $stocks = $location->stocks()
                ->with('inventoryItem')
                ->where('status', 'active')
                ->where('quantity_on_hand', '>', 0)
                ->get();
            
            return response()->json($stocks);
        })->name('stocks.by-location');
        
        // Quick stock adjustment
        Route::post('/adjust', [InventoryController::class, 'createAdjustment'])->name('adjust');
        
        // Mobile dashboard data
        Route::get('/dashboard', function() {
            return response()->json([
                'low_stock_count' => \App\Models\InventoryItem::active()
                    ->whereHas('stocks', function($q) {
                        $q->whereRaw('quantity_available <= reorder_point');
                    })->count(),
                'alerts_count' => \App\Models\InventoryAlert::active()->count(),
                'recent_movements' => \App\Models\InventoryMovement::with(['inventoryItem', 'warehouse'])
                    ->latest()
                    ->limit(5)
                    ->get(),
            ]);
        })->name('dashboard');
    });
});

// Alert Management Routes
Route::middleware(['auth', 'verified'])->prefix('inventory/alerts')->name('inventory.alerts.')->group(function () {
    // Alert actions
    Route::post('/{alert}/acknowledge', function(\App\Models\InventoryAlert $alert, \Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);
        
        $alert->acknowledge(auth()->id(), $validated['notes']);
        
        return back()->with('success', 'Uyarı onaylandı.');
    })->name('acknowledge');
    
    Route::post('/{alert}/resolve', function(\App\Models\InventoryAlert $alert, \Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'notes' => 'nullable|string',
            'resolution_type' => 'required|in:fixed,false_positive,ignored,duplicate',
        ]);
        
        $alert->resolve(auth()->id(), $validated['notes'], $validated['resolution_type']);
        
        return back()->with('success', 'Uyarı çözüldü.');
    })->name('resolve');
    
    Route::post('/{alert}/dismiss', function(\App\Models\InventoryAlert $alert, \Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);
        
        $alert->dismiss(auth()->id(), $validated['notes']);
        
        return back()->with('success', 'Uyarı reddedildi.');
    })->name('dismiss');
    
    Route::post('/{alert}/assign', function(\App\Models\InventoryAlert $alert, \Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);
        
        $alert->assign($validated['user_id'], auth()->id());
        
        return back()->with('success', 'Uyarı atandı.');
    })->name('assign');
    
    Route::post('/{alert}/escalate', function(\App\Models\InventoryAlert $alert, \Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'reason' => 'nullable|string',
        ]);
        
        $alert->escalate(auth()->id(), $validated['reason']);
        
        return back()->with('success', 'Uyarı yükseltildi.');
    })->name('escalate');
    
    Route::post('/{alert}/snooze', function(\App\Models\InventoryAlert $alert, \Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'minutes' => 'required|integer|min:5|max:1440',
        ]);
        
        $alert->snooze($validated['minutes'], auth()->id());
        
        return back()->with('success', "Uyarı {$validated['minutes']} dakika ertelendi.");
    })->name('snooze');
});

// Warehouse Integration Routes (if not already defined in warehouse routes)
Route::middleware(['auth', 'verified'])->prefix('warehouses/{warehouse}')->name('warehouses.')->group(function () {
    // Inventory in specific warehouse
    Route::get('/inventory', function(\App\Models\Warehouse $warehouse, \Illuminate\Http\Request $request) {
        $items = \App\Models\InventoryItem::with(['stocks' => function($q) use ($warehouse) {
            $q->where('warehouse_id', $warehouse->id)->where('status', 'active');
        }])
        ->whereHas('stocks', function($q) use ($warehouse) {
            $q->where('warehouse_id', $warehouse->id)->where('quantity_on_hand', '>', 0);
        })
        ->paginate(20);
        
        return \Inertia\Inertia::render('Warehouse/Inventory/Index', [
            'warehouse' => $warehouse,
            'items' => $items,
        ]);
    })->name('inventory.index');
    
    // Stock movements in specific warehouse
    Route::get('/movements', function(\App\Models\Warehouse $warehouse, \Illuminate\Http\Request $request) {
        $movements = \App\Models\InventoryMovement::with(['inventoryItem', 'location', 'creator'])
            ->where('warehouse_id', $warehouse->id)
            ->latest()
            ->paginate(20);
        
        return \Inertia\Inertia::render('Warehouse/Inventory/Movements', [
            'warehouse' => $warehouse,
            'movements' => $movements,
        ]);
    })->name('inventory.movements');
});