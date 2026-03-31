<?php

use App\Http\Controllers\Logistics\VehicleController;
use App\Http\Controllers\Logistics\PlanningController;
use App\Http\Controllers\Logistics\RouteController;
use App\Http\Controllers\Logistics\TrackingController;
use App\Http\Controllers\Logistics\CarrierController;
use App\Http\Controllers\Logistics\CostController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Logistics Routes
|--------------------------------------------------------------------------
|
| Here is where you can register logistics-related routes for the application.
| These routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group.
|
*/

Route::middleware(['auth'])->prefix('logistics')->name('logistics.')->group(function () {

    // Vehicles
    Route::prefix('vehicles')->name('vehicles.')->group(function () {
        Route::get('/', [VehicleController::class, 'index'])->name('index');
        Route::get('/create', [VehicleController::class, 'create'])->name('create');
        Route::post('/', [VehicleController::class, 'store'])->name('store');
        Route::get('/{vehicle}', [VehicleController::class, 'show'])->name('show');
        Route::get('/{vehicle}/edit', [VehicleController::class, 'edit'])->name('edit');
        Route::put('/{vehicle}', [VehicleController::class, 'update'])->name('update');
        Route::delete('/{vehicle}', [VehicleController::class, 'destroy'])->name('destroy');
    });

    // Planning
    Route::prefix('planning')->name('planning.')->group(function () {
        Route::get('/', [PlanningController::class, 'index'])->name('index');
        Route::post('/{shipment}/assign', [PlanningController::class, 'assignResources'])->name('assign');
        Route::post('/{shipment}/status', [PlanningController::class, 'updateStatus'])->name('status');
        Route::post('/optimize', [PlanningController::class, 'optimizeRoute'])->name('optimize');
    });

    // Routes
    Route::prefix('routes')->name('routes.')->group(function () {
        Route::get('/', [RouteController::class, 'index'])->name('index');
        Route::post('/{route}/favorite', [RouteController::class, 'toggleFavorite'])->name('favorite');
        Route::post('/{route}/status', [RouteController::class, 'updateStatus'])->name('status');
        Route::delete('/{route}', [RouteController::class, 'destroy'])->name('destroy');
    });

    // Tracking
    Route::prefix('tracking')->name('tracking.')->group(function () {
        Route::get('/', [TrackingController::class, 'index'])->name('index');
        Route::get('/{shipment}', [TrackingController::class, 'show'])->name('show');
        Route::post('/{shipment}/location', [TrackingController::class, 'updateLocation'])->name('location');
        Route::post('/{shipment}/eta', [TrackingController::class, 'updateEta'])->name('eta');
        Route::get('/api/live-data', [TrackingController::class, 'liveData'])->name('live-data');
    });

    // Carriers
    Route::prefix('carriers')->name('carriers.')->group(function () {
        Route::get('/', [CarrierController::class, 'index'])->name('index');
        Route::get('/create', [CarrierController::class, 'create'])->name('create');
        Route::post('/', [CarrierController::class, 'store'])->name('store');
        Route::get('/{carrier}', [CarrierController::class, 'show'])->name('show');
        Route::get('/{carrier}/edit', [CarrierController::class, 'edit'])->name('edit');
        Route::put('/{carrier}', [CarrierController::class, 'update'])->name('update');
        Route::delete('/{carrier}', [CarrierController::class, 'destroy'])->name('destroy');
        Route::post('/{carrier}/preferred', [CarrierController::class, 'togglePreferred'])->name('preferred');
        Route::post('/{carrier}/verified', [CarrierController::class, 'toggleVerified'])->name('verified');
        Route::post('/{carrier}/status', [CarrierController::class, 'updateStatus'])->name('status');
    });

    // Costs
    Route::prefix('costs')->name('costs.')->group(function () {
        Route::get('/', [CostController::class, 'index'])->name('index');
        Route::get('/export', [CostController::class, 'export'])->name('export');
    });
});
