<?php

use App\Http\Controllers\Portal\PortalDashboardController;
use App\Http\Controllers\Portal\PortalOrderController;
use App\Http\Controllers\Portal\PortalOfferController;
use App\Http\Controllers\Portal\PortalReturnController;
use App\Http\Controllers\Portal\PortalInvoiceController;
use App\Http\Controllers\Portal\PortalProfileController;
use App\Http\Controllers\Portal\PortalAccountController;
use App\Http\Controllers\Portal\PortalProductController;
use App\Http\Controllers\Portal\PortalAccountSummaryController;
use Illuminate\Support\Facades\Route;

/**
 * B2B Customer Portal Routes
 *
 * These routes are accessible by customers (B2B users) to:
 * - View their orders, offers, invoices
 * - Create and track returns
 * - Manage their profile
 * - Switch between assigned customer accounts
 */

Route::middleware(['auth', 'role:customer|customer_admin'])->prefix('portal')->name('portal.')->group(function () {

    // Account Selection & Switching (No SelectCurrentAccount middleware)
    Route::prefix('account')->name('account.')->group(function () {
        Route::post('/switch', [PortalAccountController::class, 'switch'])->name('switch');
        Route::get('/available', [PortalAccountController::class, 'available'])->name('available');
        Route::get('/none', [PortalAccountController::class, 'none'])->name('none');
    });

    // All other portal routes require selected account
    Route::middleware(['App\Http\Middleware\SelectCurrentAccount'])->group(function () {

    // Dashboard - Ana sayfa
    Route::get('/', [PortalDashboardController::class, 'index'])->name('dashboard');

    // Orders - Siparişlerim
    Route::prefix('orders')->name('orders.')->group(function () {
        Route::get('/', [PortalOrderController::class, 'index'])->name('index');
        Route::get('/{id}', [PortalOrderController::class, 'show'])->name('show');
        Route::get('/{id}/pdf', [PortalOrderController::class, 'downloadPdf'])->name('pdf');
        Route::get('/{id}/track', [PortalOrderController::class, 'track'])->name('track');
    });

    // Offers - Tekliflerim
    Route::prefix('offers')->name('offers.')->group(function () {
        Route::get('/', [PortalOfferController::class, 'index'])->name('index');
        Route::get('/{id}', [PortalOfferController::class, 'show'])->name('show');
        Route::get('/{id}/pdf', [PortalOfferController::class, 'downloadPdf'])->name('pdf');
        Route::post('/{id}/accept', [PortalOfferController::class, 'accept'])->name('accept');
        Route::post('/{id}/reject', [PortalOfferController::class, 'reject'])->name('reject');
    });

    // Returns - İadelerim
    Route::prefix('returns')->name('returns.')->group(function () {
        Route::get('/', [PortalReturnController::class, 'index'])->name('index');
        Route::get('/create', [PortalReturnController::class, 'create'])->name('create');
        Route::post('/', [PortalReturnController::class, 'store'])->name('store');
        Route::get('/{id}', [PortalReturnController::class, 'show'])->name('show');

        // AJAX endpoints
        Route::get('/returnable-orders', [PortalReturnController::class, 'getReturnableOrders'])->name('returnable-orders');
    });

    // Products - Ürün Kataloğu
    Route::prefix('products')->name('products.')->group(function () {
        Route::get('/', [PortalProductController::class, 'index'])->name('index');
        Route::get('/{id}', [PortalProductController::class, 'show'])->name('show');
        Route::post('/{id}/favorite', [PortalProductController::class, 'addToFavorites'])->name('favorite');
    });

    // Invoices - Faturalarım
    Route::prefix('invoices')->name('invoices.')->group(function () {
        Route::get('/', [PortalInvoiceController::class, 'index'])->name('index');
        Route::get('/{id}', [PortalInvoiceController::class, 'show'])->name('show');
        Route::get('/{id}/pdf', [PortalInvoiceController::class, 'downloadPdf'])->name('pdf');
    });

    // Account Summary - Cari Hesap Özeti
    Route::prefix('account-summary')->name('account-summary.')->group(function () {
        Route::get('/', [PortalAccountSummaryController::class, 'index'])->name('index');
        Route::get('/transactions', [PortalAccountSummaryController::class, 'transactions'])->name('transactions');
    });

    // Profile - Profilim
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', [PortalProfileController::class, 'index'])->name('index');
        Route::put('/', [PortalProfileController::class, 'updateProfile'])->name('update');
        Route::put('/password', [PortalProfileController::class, 'updatePassword'])->name('password.update');

        // Delivery Addresses
        Route::prefix('delivery-addresses')->name('delivery-addresses.')->group(function () {
            Route::post('/', [PortalProfileController::class, 'storeDeliveryAddress'])->name('store');
            Route::put('/{id}', [PortalProfileController::class, 'updateDeliveryAddress'])->name('update');
            Route::delete('/{id}', [PortalProfileController::class, 'deleteDeliveryAddress'])->name('destroy');
        });
    });

    }); // End SelectCurrentAccount middleware group

}); // End portal routes
