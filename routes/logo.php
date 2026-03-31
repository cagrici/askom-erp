<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LogoTestController;

/*
|--------------------------------------------------------------------------
| Logo Integration Routes
|--------------------------------------------------------------------------
|
| Routes for Logo ERP integration and testing
|
*/

Route::prefix('logo')->name('logo.')->middleware(['auth'])->group(function () {
    // Test page
    Route::get('/test', [LogoTestController::class, 'index'])->name('test');

    // API endpoints
    Route::prefix('api')->name('api.')->group(function () {
        // Connection test
        Route::get('/test-connection', [LogoTestController::class, 'testConnection'])->name('test-connection');

        // Table operations
        Route::get('/tables', [LogoTestController::class, 'getTables'])->name('tables');
        Route::post('/table-columns', [LogoTestController::class, 'getTableColumns'])->name('table-columns');
        Route::post('/table-count', [LogoTestController::class, 'getTableCount'])->name('table-count');
        Route::post('/from-table', [LogoTestController::class, 'getFromTable'])->name('from-table');

        // Data retrieval
        Route::get('/customers', [LogoTestController::class, 'getCustomers'])->name('customers');
        Route::get('/products', [LogoTestController::class, 'getProducts'])->name('products');
        Route::get('/invoices', [LogoTestController::class, 'getInvoices'])->name('invoices');

        // Custom query
        Route::post('/query', [LogoTestController::class, 'query'])->name('query');
    });
});
