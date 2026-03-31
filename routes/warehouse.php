<?php

use App\Http\Controllers\Warehouse\ShippingOrderController;
use App\Http\Controllers\Warehouse\PickingTaskController;
use App\Http\Controllers\Warehouse\VehicleController;
use App\Http\Controllers\Warehouse\DriverController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Warehouse Routes
|--------------------------------------------------------------------------
|
| Depo yönetimi, sevkiyat ve toplama işlemleri için route'lar
|
*/

Route::middleware(['auth'])->prefix('warehouse')->name('warehouse.')->group(function () {

    // Shipping Orders (Sevk Emirleri)
    Route::prefix('shipping-orders')->name('shipping-orders.')->group(function () {
        // List & Dashboard
        Route::get('/', [ShippingOrderController::class, 'index'])->middleware('permission:warehouse.shipping.view')->name('index');

        // Create shipping order (Satışçı)
        Route::get('/create', [ShippingOrderController::class, 'create'])->middleware('permission:warehouse.shipping.create')->name('create');
        Route::post('/', [ShippingOrderController::class, 'store'])->middleware('permission:warehouse.shipping.create')->name('store');

        // API endpoints
        Route::get('/shippable-orders', [ShippingOrderController::class, 'getShippableSalesOrders'])
            ->middleware('permission:warehouse.shipping.view')->name('shippable-orders');

        // Show
        Route::get('/{shippingOrder}', [ShippingOrderController::class, 'show'])->middleware('permission:warehouse.shipping.view')->name('show');

        // Edit
        Route::get('/{shippingOrder}/edit', [ShippingOrderController::class, 'edit'])->middleware('permission:warehouse.shipping.edit')->name('edit');
        Route::put('/{shippingOrder}', [ShippingOrderController::class, 'update'])->middleware('permission:warehouse.shipping.edit')->name('update');

        // Actions
        Route::post('/{shippingOrder}/assign-picking', [ShippingOrderController::class, 'assignPicking'])
            ->middleware('permission:warehouse.shipping.assign')->name('assign-picking');
        Route::post('/{shippingOrder}/ship', [ShippingOrderController::class, 'ship'])
            ->middleware('permission:warehouse.shipping.ship')->name('ship');
        Route::post('/{shippingOrder}/mark-delivered', [ShippingOrderController::class, 'markDelivered'])
            ->middleware('permission:warehouse.shipping.deliver')->name('mark-delivered');
        Route::post('/{shippingOrder}/cancel', [ShippingOrderController::class, 'cancel'])
            ->middleware('permission:warehouse.shipping.cancel')->name('cancel');
    });

    // Picking Tasks (Toplama Görevleri)
    Route::prefix('picking-tasks')->name('picking-tasks.')->group(function () {
        // List
        Route::get('/', [PickingTaskController::class, 'index'])->middleware('permission:warehouse.picking.view')->name('index');

        // Show (Barkod okuma ekranı)
        Route::get('/{pickingTask}', [PickingTaskController::class, 'show'])->middleware('permission:warehouse.picking.view')->name('show');

        // Actions
        Route::post('/{pickingTask}/start', [PickingTaskController::class, 'start'])
            ->middleware('permission:warehouse.picking.start')->name('start');
        Route::post('/{pickingTask}/complete', [PickingTaskController::class, 'complete'])
            ->middleware('permission:warehouse.picking.complete')->name('complete');
        Route::post('/{pickingTask}/cancel', [PickingTaskController::class, 'cancel'])
            ->middleware('permission:warehouse.picking.complete')->name('cancel');

        // Barcode scanning API
        Route::post('/{pickingTask}/scan', [PickingTaskController::class, 'scanBarcode'])
            ->middleware('permission:warehouse.picking.scan')->name('scan');

        // Item actions
        Route::post('/{pickingTask}/items/{pickingTaskItem}/skip', [PickingTaskController::class, 'skipItem'])
            ->middleware('permission:warehouse.picking.complete')->name('items.skip');
        Route::post('/{pickingTask}/items/{pickingTaskItem}/partial', [PickingTaskController::class, 'markItemPartial'])
            ->middleware('permission:warehouse.picking.complete')->name('items.partial');

        // PDF
        Route::get('/{pickingTask}/pdf', [PickingTaskController::class, 'downloadPdf'])
            ->middleware('permission:warehouse.picking.view')->name('pdf');
    });

    // Vehicles (Araçlar) - Quick add API
    Route::prefix('vehicles')->name('vehicles.')->group(function () {
        Route::post('/', [VehicleController::class, 'store'])->middleware('permission:warehouse.vehicles.manage')->name('store');
    });

    // Drivers (Şoförler) - Full CRUD
    Route::prefix('drivers')->name('drivers.')->group(function () {
        Route::get('/', [DriverController::class, 'index'])->middleware('permission:warehouse.drivers.view')->name('index');
        Route::get('/create', [DriverController::class, 'create'])->middleware('permission:warehouse.drivers.manage')->name('create');
        Route::post('/', [DriverController::class, 'store'])->middleware('permission:warehouse.drivers.manage')->name('store');
        Route::get('/{driver}/edit', [DriverController::class, 'edit'])->middleware('permission:warehouse.drivers.manage')->name('edit');
        Route::put('/{driver}', [DriverController::class, 'update'])->middleware('permission:warehouse.drivers.manage')->name('update');
        Route::delete('/{driver}', [DriverController::class, 'destroy'])->middleware('permission:warehouse.drivers.manage')->name('destroy');
        Route::post('/{driver}/toggle-active', [DriverController::class, 'toggleActive'])->middleware('permission:warehouse.drivers.manage')->name('toggle-active');
    });

});
