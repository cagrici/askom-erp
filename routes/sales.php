<?php

use App\Http\Controllers\Sales\SalesOrderController;
use App\Http\Controllers\Sales\SalesAnalyticsController;
use App\Http\Controllers\Sales\SalesReturnController;
use App\Http\Controllers\Sales\InvoiceController;
use App\Http\Controllers\Sales\CampaignController;
use App\Http\Controllers\Sales\DiscountController;
use App\Http\Controllers\Sales\SalesTargetController;
use Illuminate\Support\Facades\Route;

// Sales Order Routes
Route::middleware(['auth'])->prefix('sales')->name('sales.')->group(function () {

    // Sales Orders
    Route::prefix('orders')->name('orders.')->group(function () {
        // Basic CRUD routes (non-parameterized first)
        Route::get('/', [SalesOrderController::class, 'index'])->middleware('permission:sales.orders.view')->name('index');
        Route::get('/create', [SalesOrderController::class, 'create'])->middleware('permission:sales.orders.create')->name('create');
        Route::post('/', [SalesOrderController::class, 'store'])->middleware('permission:sales.orders.create')->name('store');

        // Specific routes MUST come before parameterized routes
        // Delivery address endpoints
        Route::get('/delivery-addresses', [SalesOrderController::class, 'getCustomerDeliveryAddresses'])->middleware('permission:sales.orders.view')->name('delivery-addresses');
        Route::post('/delivery-addresses', [SalesOrderController::class, 'storeDeliveryAddress'])->middleware('permission:sales.orders.create')->name('delivery-addresses.store');

        // Test route to debug routing issues
        Route::get('/test-delivery', function() {
            return response()->json(['test' => 'working', 'timestamp' => now()]);
        })->name('test-delivery');

        // AJAX endpoints
        Route::get('/products/search', [SalesOrderController::class, 'searchProducts'])->middleware('permission:sales.orders.view')->name('products.search');
        Route::get('/products/catalog', [SalesOrderController::class, 'productCatalog'])->middleware('permission:sales.orders.view')->name('products.catalog');
        Route::post('/products/bulk-search', [SalesOrderController::class, 'bulkSearchProducts'])->middleware('permission:sales.orders.view')->name('products.bulk-search');
        Route::get('/products/frequent', [SalesOrderController::class, 'getFrequentProducts'])->middleware('permission:sales.orders.view')->name('products.frequent');

        // Customer search endpoints
        Route::get('/customers/search', [SalesOrderController::class, 'searchCustomers'])->middleware('permission:sales.orders.view')->name('customers.search');
        Route::get('/customers/recent', [SalesOrderController::class, 'recentCustomers'])->middleware('permission:sales.orders.view')->name('customers.recent');

        // Product search endpoint for filter
        Route::get('/products/filter-search', [SalesOrderController::class, 'searchProductsForFilter'])->middleware('permission:sales.orders.view')->name('products.filter-search');

        // Sales representatives search endpoint
        Route::get('/salespeople/search', [SalesOrderController::class, 'searchSalesRepresentatives'])->middleware('permission:sales.orders.view')->name('salespeople.search');

        // PDF batch route (non-parameterized)
        Route::post('/pdf/batch', [SalesOrderController::class, 'batchGeneratePdfs'])->middleware('permission:sales.orders.pdf')->name('pdf.batch');

        // Parameterized routes MUST come last
        Route::get('/{salesOrder}', [SalesOrderController::class, 'show'])->middleware('permission:sales.orders.view')->name('show');
        Route::get('/{salesOrder}/edit', [SalesOrderController::class, 'edit'])->middleware('permission:sales.orders.edit')->name('edit');
        Route::put('/{salesOrder}', [SalesOrderController::class, 'update'])->middleware('permission:sales.orders.edit')->name('update');
        Route::delete('/{salesOrder}', [SalesOrderController::class, 'destroy'])->middleware('permission:sales.orders.delete')->name('destroy');

        // Status management
        Route::patch('/{salesOrder}/status', [SalesOrderController::class, 'updateStatus'])->middleware('permission:sales.orders.status')->name('update-status');
        Route::post('/{salesOrder}/approve', [SalesOrderController::class, 'approve'])->middleware('permission:sales.orders.approve')->name('approve');

        // PDF generation
        Route::get('/{salesOrder}/pdf', [SalesOrderController::class, 'viewPdf'])->middleware('permission:sales.orders.pdf')->name('pdf');
        Route::get('/{salesOrder}/pdf/download', [SalesOrderController::class, 'downloadPdf'])->middleware('permission:sales.orders.pdf')->name('pdf.download');
        Route::post('/{salesOrder}/pdf/custom', [SalesOrderController::class, 'generateCustomPdf'])->middleware('permission:sales.orders.pdf')->name('pdf.custom');

        // Excel export
        Route::get('/{salesOrder}/excel', [SalesOrderController::class, 'downloadExcel'])->middleware('permission:sales.orders.pdf')->name('excel');

        // Bulk discount history
        Route::post('/{salesOrder}/bulk-discount-history', [SalesOrderController::class, 'recordBulkDiscount'])->middleware('permission:sales.orders.discount')->name('bulk-discount.record');
        Route::get('/{salesOrder}/bulk-discount-history', [SalesOrderController::class, 'getBulkDiscountHistory'])->middleware('permission:sales.orders.view')->name('bulk-discount.history');

        // Logo Sync
        Route::post('/{salesOrder}/sync-to-logo', [SalesOrderController::class, 'syncToLogo'])->middleware('permission:sales.orders.sync_logo')->name('sync-to-logo');

        // Email
        Route::post('/{salesOrder}/send-email', [SalesOrderController::class, 'sendEmail'])->middleware('permission:sales.orders.email')->name('send-email');
        Route::get('/{salesOrder}/customer-email', [SalesOrderController::class, 'getCustomerEmail'])->middleware('permission:sales.orders.view')->name('customer-email');

        // Order items for expandable rows
        Route::get('/{salesOrder}/items', [SalesOrderController::class, 'getOrderItems'])->middleware('permission:sales.orders.view')->name('items');
    });

    // Sales Analytics Routes
    Route::prefix('analytics')->name('analytics.')->group(function () {
        Route::get('/', [SalesAnalyticsController::class, 'index'])->middleware('permission:sales.analytics.view')->name('index');

        // AJAX endpoints for analytics data
        Route::get('/overview', [SalesAnalyticsController::class, 'getOverview'])->middleware('permission:sales.analytics.view')->name('overview');
        Route::get('/trend', [SalesAnalyticsController::class, 'getTrend'])->middleware('permission:sales.analytics.view')->name('trend');
        Route::get('/top-customers', [SalesAnalyticsController::class, 'getTopCustomers'])->middleware('permission:sales.analytics.view')->name('top-customers');
        Route::get('/top-products', [SalesAnalyticsController::class, 'getTopProducts'])->middleware('permission:sales.analytics.view')->name('top-products');
        Route::get('/salesperson-performance', [SalesAnalyticsController::class, 'getSalespersonPerformance'])->middleware('permission:sales.analytics.view')->name('salesperson-performance');
        Route::get('/status-distribution', [SalesAnalyticsController::class, 'getStatusDistribution'])->middleware('permission:sales.analytics.view')->name('status-distribution');
        Route::get('/revenue-by-currency', [SalesAnalyticsController::class, 'getRevenueByCurrency'])->middleware('permission:sales.analytics.view')->name('revenue-by-currency');
        Route::get('/monthly-comparison', [SalesAnalyticsController::class, 'getMonthlySalesComparison'])->middleware('permission:sales.analytics.view')->name('monthly-comparison');

        // Export endpoints
        Route::post('/export', [SalesAnalyticsController::class, 'export'])->middleware('permission:sales.analytics.export')->name('export');
    });

    // Price Lists Management (Sales Module)
    Route::prefix('price-lists')->name('price-lists.')->group(function () {
        Route::get('/', [App\Http\Controllers\Admin\ProductPriceListController::class, 'index'])->middleware('permission:sales.price_lists.view')->name('index');
        Route::get('/create', [App\Http\Controllers\Admin\ProductPriceListController::class, 'create'])->middleware('permission:sales.price_lists.create')->name('create');
        Route::post('/', [App\Http\Controllers\Admin\ProductPriceListController::class, 'store'])->middleware('permission:sales.price_lists.create')->name('store');

        // Logo Price Sync
        Route::get('/sync-stats', [App\Http\Controllers\Admin\ProductPriceListController::class, 'syncStats'])->middleware('permission:sales.price_lists.view')->name('sync-stats');
        Route::post('/sync-logo', [App\Http\Controllers\Admin\ProductPriceListController::class, 'startSync'])->middleware('permission:sales.price_lists.edit')->name('sync-logo');

        Route::get('/{priceList}', [App\Http\Controllers\Admin\ProductPriceListController::class, 'show'])->middleware('permission:sales.price_lists.view')->name('show');
        Route::get('/{priceList}/edit', [App\Http\Controllers\Admin\ProductPriceListController::class, 'edit'])->middleware('permission:sales.price_lists.edit')->name('edit');
        Route::put('/{priceList}', [App\Http\Controllers\Admin\ProductPriceListController::class, 'update'])->middleware('permission:sales.price_lists.edit')->name('update');
        Route::delete('/{priceList}', [App\Http\Controllers\Admin\ProductPriceListController::class, 'destroy'])->middleware('permission:sales.price_lists.delete')->name('destroy');

        // Price List Actions
        Route::patch('/{priceList}/toggle-status', [App\Http\Controllers\Admin\ProductPriceListController::class, 'toggleStatus'])->middleware('permission:sales.price_lists.edit')->name('toggle-status');
        Route::patch('/{priceList}/set-default', [App\Http\Controllers\Admin\ProductPriceListController::class, 'setDefault'])->middleware('permission:sales.price_lists.edit')->name('set-default');
        Route::post('/{priceList}/duplicate', [App\Http\Controllers\Admin\ProductPriceListController::class, 'duplicate'])->middleware('permission:sales.price_lists.create')->name('duplicate');

        // Import/Export
        Route::get('/{priceList}/export', [App\Http\Controllers\Admin\ProductPriceListController::class, 'export'])->middleware('permission:sales.price_lists.view')->name('export');
        Route::get('/{priceList}/import', [App\Http\Controllers\Admin\ProductPriceListController::class, 'importForm'])->middleware('permission:sales.price_lists.manage_prices')->name('import-form');
        Route::post('/{priceList}/import', [App\Http\Controllers\Admin\ProductPriceListController::class, 'import'])->middleware('permission:sales.price_lists.manage_prices')->name('import');
        Route::get('/template/download', [App\Http\Controllers\Admin\ProductPriceListController::class, 'downloadTemplate'])->middleware('permission:sales.price_lists.view')->name('template');

        // Product Prices within Price Lists
        Route::prefix('/{priceList}/prices')->name('prices.')->group(function () {
            Route::get('/', [App\Http\Controllers\Sales\ProductPriceController::class, 'index'])->middleware('permission:sales.price_lists.view')->name('index');
            Route::get('/create', [App\Http\Controllers\Sales\ProductPriceController::class, 'create'])->middleware('permission:sales.price_lists.manage_prices')->name('create');
            Route::post('/', [App\Http\Controllers\Sales\ProductPriceController::class, 'store'])->middleware('permission:sales.price_lists.manage_prices')->name('store');
            Route::get('/{price}', [App\Http\Controllers\Sales\ProductPriceController::class, 'show'])->middleware('permission:sales.price_lists.view')->name('show');
            Route::get('/{price}/edit', [App\Http\Controllers\Sales\ProductPriceController::class, 'edit'])->middleware('permission:sales.price_lists.manage_prices')->name('edit');
            Route::put('/{price}', [App\Http\Controllers\Sales\ProductPriceController::class, 'update'])->middleware('permission:sales.price_lists.manage_prices')->name('update');
            Route::delete('/{price}', [App\Http\Controllers\Sales\ProductPriceController::class, 'destroy'])->middleware('permission:sales.price_lists.manage_prices')->name('destroy');

            // Bulk operations
            Route::post('/bulk-import', [App\Http\Controllers\Sales\ProductPriceController::class, 'bulkImport'])->middleware('permission:sales.price_lists.manage_prices')->name('bulk-import');
            Route::get('/export', [App\Http\Controllers\Sales\ProductPriceController::class, 'export'])->middleware('permission:sales.price_lists.view')->name('export');
            Route::post('/copy-from', [App\Http\Controllers\Sales\ProductPriceController::class, 'copyFrom'])->middleware('permission:sales.price_lists.manage_prices')->name('copy-from');
        });
    });

    // Sales Returns Routes
    Route::prefix('returns')->name('returns.')->group(function () {
        // Basic CRUD routes (non-parameterized first)
        Route::get('/', [SalesReturnController::class, 'index'])->middleware('permission:sales.returns.view')->name('index');
        Route::get('/create', [SalesReturnController::class, 'create'])->middleware('permission:sales.returns.create')->name('create');
        Route::post('/', [SalesReturnController::class, 'store'])->middleware('permission:sales.returns.create')->name('store');

        // AJAX endpoints
        Route::get('/returnable-orders', [SalesReturnController::class, 'getReturnableOrders'])->middleware('permission:sales.returns.view')->name('returnable-orders');

        // Parameterized routes
        Route::get('/{id}', [SalesReturnController::class, 'show'])->middleware('permission:sales.returns.view')->name('show');

        // Return actions
        Route::post('/{id}/approve', [SalesReturnController::class, 'approve'])->middleware('permission:sales.returns.approve')->name('approve');
        Route::post('/{id}/reject', [SalesReturnController::class, 'reject'])->middleware('permission:sales.returns.reject')->name('reject');
        Route::post('/{id}/assign-driver', [SalesReturnController::class, 'assignDriver'])->middleware('permission:sales.returns.complete')->name('assign-driver');
        Route::post('/{id}/mark-picked-up', [SalesReturnController::class, 'markPickedUp'])->middleware('permission:sales.returns.complete')->name('mark-picked-up');
        Route::post('/{id}/complete', [SalesReturnController::class, 'complete'])->middleware('permission:sales.returns.complete')->name('complete');

        // PDF generation
        Route::get('/{id}/pdf', [SalesReturnController::class, 'downloadPdf'])->middleware('permission:sales.returns.view')->name('pdf');
    });

    // Invoice Routes
    Route::prefix('invoices')->name('invoices.')->group(function () {
        // Basic CRUD routes
        Route::get('/', [InvoiceController::class, 'index'])->middleware('permission:sales.invoices.view')->name('index');
        Route::get('/{invoice}', [InvoiceController::class, 'show'])->middleware('permission:sales.invoices.view')->name('show');

        // Export and PDF
        Route::get('/export', [InvoiceController::class, 'export'])->middleware('permission:sales.invoices.export')->name('export');
        Route::get('/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->middleware('permission:sales.invoices.view')->name('pdf');

        // Actions
        Route::patch('/{invoice}/mark-paid', [InvoiceController::class, 'markAsPaid'])->middleware('permission:sales.invoices.mark_paid')->name('mark-paid');
        Route::patch('/{invoice}/cancel', [InvoiceController::class, 'cancel'])->middleware('permission:sales.invoices.cancel')->name('cancel');
    });

    // Campaign Routes
    Route::prefix('campaigns')->name('campaigns.')->group(function () {
        // Basic CRUD routes (non-parameterized first)
        Route::get('/', [CampaignController::class, 'index'])->middleware('permission:sales.campaigns.view')->name('index');
        Route::get('/create', [CampaignController::class, 'create'])->middleware('permission:sales.campaigns.create')->name('create');
        Route::post('/', [CampaignController::class, 'store'])->middleware('permission:sales.campaigns.create')->name('store');

        // Parameterized routes
        Route::get('/{campaign}', [CampaignController::class, 'show'])->middleware('permission:sales.campaigns.view')->name('show');
        Route::get('/{campaign}/edit', [CampaignController::class, 'edit'])->middleware('permission:sales.campaigns.edit')->name('edit');
        Route::put('/{campaign}', [CampaignController::class, 'update'])->middleware('permission:sales.campaigns.edit')->name('update');
        Route::delete('/{campaign}', [CampaignController::class, 'destroy'])->middleware('permission:sales.campaigns.delete')->name('destroy');

        // Campaign actions
        Route::patch('/{campaign}/toggle-status', [CampaignController::class, 'toggleStatus'])->middleware('permission:sales.campaigns.edit')->name('toggle-status');
        Route::post('/{campaign}/duplicate', [CampaignController::class, 'duplicate'])->middleware('permission:sales.campaigns.create')->name('duplicate');
    });

    // Discount Routes
    Route::prefix('discounts')->name('discounts.')->group(function () {
        // Basic CRUD routes (non-parameterized first)
        Route::get('/', [DiscountController::class, 'index'])->middleware('permission:sales.discounts.view')->name('index');
        Route::get('/create', [DiscountController::class, 'create'])->middleware('permission:sales.discounts.create')->name('create');
        Route::post('/', [DiscountController::class, 'store'])->middleware('permission:sales.discounts.create')->name('store');

        // Parameterized routes
        Route::get('/{discount}', [DiscountController::class, 'show'])->middleware('permission:sales.discounts.view')->name('show');
        Route::get('/{discount}/edit', [DiscountController::class, 'edit'])->middleware('permission:sales.discounts.edit')->name('edit');
        Route::put('/{discount}', [DiscountController::class, 'update'])->middleware('permission:sales.discounts.edit')->name('update');
        Route::delete('/{discount}', [DiscountController::class, 'destroy'])->middleware('permission:sales.discounts.delete')->name('destroy');

        // Discount actions
        Route::patch('/{discount}/toggle-status', [DiscountController::class, 'toggleStatus'])->middleware('permission:sales.discounts.edit')->name('toggle-status');
        Route::post('/{discount}/duplicate', [DiscountController::class, 'duplicate'])->middleware('permission:sales.discounts.create')->name('duplicate');
    });

    // Sales Target Routes
    Route::prefix('targets')->name('targets.')->group(function () {
        // Basic CRUD routes (non-parameterized first)
        Route::get('/', [SalesTargetController::class, 'index'])->middleware('permission:sales.targets.view')->name('index');
        Route::get('/create', [SalesTargetController::class, 'create'])->middleware('permission:sales.targets.create')->name('create');
        Route::post('/', [SalesTargetController::class, 'store'])->middleware('permission:sales.targets.create')->name('store');

        // Parameterized routes
        Route::get('/{target}', [SalesTargetController::class, 'show'])->middleware('permission:sales.targets.view')->name('show');
        Route::get('/{target}/edit', [SalesTargetController::class, 'edit'])->middleware('permission:sales.targets.edit')->name('edit');
        Route::put('/{target}', [SalesTargetController::class, 'update'])->middleware('permission:sales.targets.edit')->name('update');
        Route::delete('/{target}', [SalesTargetController::class, 'destroy'])->middleware('permission:sales.targets.delete')->name('destroy');

        // Target actions
        Route::patch('/{target}/toggle-status', [SalesTargetController::class, 'toggleStatus'])->middleware('permission:sales.targets.edit')->name('toggle-status');
        Route::post('/{target}/recalculate', [SalesTargetController::class, 'recalculate'])->middleware('permission:sales.targets.edit')->name('recalculate');
    });

});
