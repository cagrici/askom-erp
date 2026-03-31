<?php

use App\Http\Controllers\Purchasing\PurchaseRequestController;
use App\Http\Controllers\Purchasing\PurchaseOrderController;
use App\Http\Controllers\Purchasing\PurchasingOfferController;
use App\Http\Controllers\Purchasing\ComingSoonController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Purchasing Routes
|--------------------------------------------------------------------------
|
| Here is where you can register purchasing routes for your application.
| These routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group.
|
*/

Route::middleware(['auth'])->prefix('purchasing')->name('purchasing.')->group(function () {
    
    // Purchase Requests
    Route::prefix('requests')->name('requests.')->group(function () {
        Route::get('/', [PurchaseRequestController::class, 'index'])->name('index');
        Route::get('/create', [PurchaseRequestController::class, 'create'])->name('create');
        Route::post('/', [PurchaseRequestController::class, 'store'])->name('store');
        
        // AJAX endpoints - MUST come BEFORE wildcard routes
        Route::get('/search-products', [PurchaseRequestController::class, 'searchProducts'])->name('search-products');
        
        // Wildcard routes - MUST come LAST
        Route::get('/{purchaseRequest}', [PurchaseRequestController::class, 'show'])->name('show');
        Route::get('/{purchaseRequest}/edit', [PurchaseRequestController::class, 'edit'])->name('edit');
        Route::put('/{purchaseRequest}', [PurchaseRequestController::class, 'update'])->name('update');
        Route::delete('/{purchaseRequest}', [PurchaseRequestController::class, 'destroy'])->name('destroy');
        
        // Approval actions
        Route::post('/{purchaseRequest}/approve', [PurchaseRequestController::class, 'approve'])->name('approve');
        Route::post('/{purchaseRequest}/reject', [PurchaseRequestController::class, 'reject'])->name('reject');
    });

    // Purchase Orders
    Route::prefix('orders')->name('orders.')->group(function () {
        Route::get('/', [PurchaseOrderController::class, 'index'])->name('index');
        Route::get('/create', [PurchaseOrderController::class, 'create'])->name('create');
        Route::post('/', [PurchaseOrderController::class, 'store'])->name('store');
        Route::get('/{order}', [PurchaseOrderController::class, 'show'])->name('show');
        Route::get('/{order}/edit', [PurchaseOrderController::class, 'edit'])->name('edit');
        Route::put('/{order}', [PurchaseOrderController::class, 'update'])->name('update');
        Route::delete('/{order}', [PurchaseOrderController::class, 'destroy'])->name('destroy');

        // Order actions
        Route::post('/{order}/approve', [PurchaseOrderController::class, 'approve'])->name('approve');
        Route::post('/{order}/send', [PurchaseOrderController::class, 'send'])->name('send');
        Route::post('/{order}/confirm', [PurchaseOrderController::class, 'confirm'])->name('confirm');
        Route::post('/{order}/cancel', [PurchaseOrderController::class, 'cancel'])->name('cancel');

        // PDF export
        Route::get('/{order}/pdf', [PurchaseOrderController::class, 'generatePdf'])->name('pdf');
    });

    // Supplier Offers
    Route::prefix('offers')->name('offers.')->group(function () {
        Route::get('/', [PurchasingOfferController::class, 'index'])->name('index');
        Route::get('/create', [PurchasingOfferController::class, 'create'])->name('create');
        Route::post('/', [PurchasingOfferController::class, 'store'])->name('store');
        Route::get('/{offer}', [PurchasingOfferController::class, 'show'])->name('show');
        Route::get('/{offer}/edit', [PurchasingOfferController::class, 'edit'])->name('edit');
        Route::put('/{offer}', [PurchasingOfferController::class, 'update'])->name('update');
        Route::delete('/{offer}', [PurchasingOfferController::class, 'destroy'])->name('destroy');

        // Offer actions
        Route::post('/{offer}/approve', [PurchasingOfferController::class, 'approve'])->name('approve');
        Route::post('/{offer}/reject', [PurchasingOfferController::class, 'reject'])->name('reject');
    });

    // Coming Soon Pages
    Route::get('/contracts', [ComingSoonController::class, 'contracts'])->name('contracts');
    Route::get('/invoices', [ComingSoonController::class, 'invoices'])->name('invoices');
    Route::get('/performance', [ComingSoonController::class, 'performance'])->name('performance');
});