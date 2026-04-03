<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\JobRequestController;
use App\Http\Controllers\JobGroupController;
use App\Http\Controllers\Announcement\AnnouncementController;
use App\Http\Controllers\Document\DocumentController;
use App\Http\Controllers\WorkRequest\WorkRequestController;
use App\Http\Controllers\DocumentCategoryController;
use App\Http\Controllers\VisitorController;
use App\Http\Controllers\VisitorAppointmentController;
use App\Http\Controllers\VisitorVisitController;
use App\Http\Controllers\VisitorDashboardController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\ProductUnitController;
use App\Http\Controllers\ProductVariantController;
use App\Http\Controllers\ProductBundleController;
use App\Http\Controllers\ProductAttributeController;
use App\Http\Controllers\ProductBarcodeController;
use App\Http\Controllers\ProductImageController;
use App\Http\Controllers\Stock\StockController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Accounting\CurrentAccountController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/



// Profile routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Global Search
Route::get('/api/global-search', [\App\Http\Controllers\API\GlobalSearchController::class, 'search'])->middleware('auth')->name('global.search');

// CSRF Token endpoint
Route::get('/csrf-token', function () {
    return response()->json(['csrf_token' => csrf_token()]);
})->name('csrf-token');

// Dashboard
Route::get('/', [DashboardController::class, 'index'])->middleware(['auth', 'role.redirect'])->name('dashboard');
Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'role.redirect'])->name('dashboard.index');
Route::post('/dashboard/update-layout', [DashboardController::class, 'updateLayout'])->middleware(['auth'])->name('dashboard.update-layout');

// Rol Bazli Dashboard'lar
Route::middleware(['auth'])->prefix('dashboard')->name('dashboard.')->group(function () {
    Route::get('/company', [\App\Http\Controllers\Dashboard\RoleDashboardController::class, 'companyManager'])->name('company');
    Route::post('/company/refresh', [\App\Http\Controllers\Dashboard\RoleDashboardController::class, 'refreshCompanyDashboard'])->name('company.refresh');
    Route::get('/sales-manager', [\App\Http\Controllers\Dashboard\RoleDashboardController::class, 'salesManager'])->name('sales-manager');
    Route::get('/warehouse-manager', [\App\Http\Controllers\Dashboard\RoleDashboardController::class, 'warehouseManager'])->name('warehouse-manager');
});

// Job Requests (İş Talepleri)
Route::get('/is-talepleri', [JobRequestController::class, 'index'])->middleware(['auth'])->name('job-requests.index');

// Product Categories and Brands (must be before generic product routes)
Route::middleware(['auth'])->group(function () {
    // Categories
    Route::get('/products/categories/api/tree', [ProductCategoryController::class, 'getTree'])->name('product-categories.tree');
    Route::get('/products/categories/{category}/children', [ProductCategoryController::class, 'getChildren'])->name('product-categories.children');
    Route::get('/products/categories/create', [ProductCategoryController::class, 'create'])->name('product-categories.create');
    Route::get('/products/categories/{category}/edit', [ProductCategoryController::class, 'edit'])->name('product-categories.edit');
    Route::get('/products/categories/{category}', [ProductCategoryController::class, 'show'])->name('product-categories.show');
    Route::get('/products/categories', [ProductCategoryController::class, 'index'])->name('product-categories.index');
    Route::post('/products/categories', [ProductCategoryController::class, 'store'])->name('product-categories.store');
    Route::put('/products/categories/{category}', [ProductCategoryController::class, 'update'])->name('product-categories.update');
    Route::delete('/products/categories/{category}', [ProductCategoryController::class, 'destroy'])->name('product-categories.destroy');

    // Brands
    Route::get('/products/brands/create', [BrandController::class, 'create'])->name('brands.create');
    Route::get('/products/brands/{brand}/edit', [BrandController::class, 'edit'])->name('brands.edit');
    Route::get('/products/brands/{brand}', [BrandController::class, 'show'])->name('brands.show');
    Route::get('/products/brands', [BrandController::class, 'index'])->name('brands.index');
    Route::post('/products/brands', [BrandController::class, 'store'])->name('brands.store');
    Route::put('/products/brands/{brand}', [BrandController::class, 'update'])->name('brands.update');
    Route::delete('/products/brands/{brand}', [BrandController::class, 'destroy'])->name('brands.destroy');

    // Units (General measurement units)
    Route::get('/products/units', [UnitController::class, 'index'])->name('units.index');
    Route::post('/products/units', [UnitController::class, 'store'])->name('units.store');
    Route::put('/products/units/{unit}', [UnitController::class, 'update'])->name('units.update');
    Route::delete('/products/units/{unit}', [UnitController::class, 'destroy'])->name('units.destroy');

    // Product Units (Product-specific packaging units)
    Route::get('/products/product-units/create', [ProductUnitController::class, 'create'])->name('product-units.create');
    Route::get('/products/product-units/{productUnit}/edit', [ProductUnitController::class, 'edit'])->name('product-units.edit');
    Route::get('/products/product-units/{productUnit}', [ProductUnitController::class, 'show'])->name('product-units.show');
    Route::get('/products/product-units', [ProductUnitController::class, 'index'])->name('product-units.index');
    Route::post('/products/product-units', [ProductUnitController::class, 'store'])->name('product-units.store');
    Route::put('/products/product-units/{productUnit}', [ProductUnitController::class, 'update'])->name('product-units.update');
    Route::delete('/products/product-units/{productUnit}', [ProductUnitController::class, 'destroy'])->name('product-units.destroy');

    // Product Variants
    Route::get('/products/variants/create', [ProductVariantController::class, 'create'])->name('product-variants.create');
    Route::get('/products/variants/{productVariant}/edit', [ProductVariantController::class, 'edit'])->name('product-variants.edit');
    Route::get('/products/variants/{productVariant}', [ProductVariantController::class, 'show'])->name('product-variants.show');
    Route::get('/products/variants', [ProductVariantController::class, 'index'])->name('product-variants.index');
    Route::post('/products/variants', [ProductVariantController::class, 'store'])->name('product-variants.store');
    Route::put('/products/variants/{productVariant}', [ProductVariantController::class, 'update'])->name('product-variants.update');
    Route::delete('/products/variants/{productVariant}', [ProductVariantController::class, 'destroy'])->name('product-variants.destroy');
    Route::post('/products/variants/bulk-update-stock', [ProductVariantController::class, 'bulkUpdateStock'])->name('product-variants.bulk-update-stock');

    // Product Bundles
    Route::get('/products/bundles/create', [ProductBundleController::class, 'create'])->name('product-bundles.create');
    Route::get('/products/bundles/{productBundle}/edit', [ProductBundleController::class, 'edit'])->name('product-bundles.edit');
    Route::get('/products/bundles/{productBundle}', [ProductBundleController::class, 'show'])->name('product-bundles.show');
    Route::get('/products/bundles', [ProductBundleController::class, 'index'])->name('product-bundles.index');
    Route::post('/products/bundles', [ProductBundleController::class, 'store'])->name('product-bundles.store');
    Route::put('/products/bundles/{productBundle}', [ProductBundleController::class, 'update'])->name('product-bundles.update');
    Route::delete('/products/bundles/{productBundle}', [ProductBundleController::class, 'destroy'])->name('product-bundles.destroy');
    Route::post('/products/bundles/calculate-price', [ProductBundleController::class, 'calculateBundlePrice'])->name('product-bundles.calculate-price');

    // Product Attributes
    Route::get('/products/attributes/create', [ProductAttributeController::class, 'create'])->name('product-attributes.create');
    Route::get('/products/attributes/{productAttribute}/edit', [ProductAttributeController::class, 'edit'])->name('product-attributes.edit');
    Route::get('/products/attributes/{productAttribute}', [ProductAttributeController::class, 'show'])->name('product-attributes.show');
    Route::get('/products/attributes', [ProductAttributeController::class, 'index'])->name('product-attributes.index');
    Route::post('/products/attributes', [ProductAttributeController::class, 'store'])->name('product-attributes.store');
    Route::put('/products/attributes/{productAttribute}', [ProductAttributeController::class, 'update'])->name('product-attributes.update');
    Route::delete('/products/attributes/{productAttribute}', [ProductAttributeController::class, 'destroy'])->name('product-attributes.destroy');

    // Product Barcodes
    Route::get('/products/barcodes', [ProductBarcodeController::class, 'index'])->name('product-barcodes.index');
    Route::post('/products/{product}/barcode', [ProductBarcodeController::class, 'generateBarcode'])->name('product-barcodes.generate');
    Route::post('/products/barcodes/bulk-generate', [ProductBarcodeController::class, 'bulkGenerateBarcodes'])->name('product-barcodes.bulk-generate');
    Route::post('/products/barcodes/download', [ProductBarcodeController::class, 'downloadBarcodes'])->name('product-barcodes.download');
    Route::post('/products/barcodes/print', [ProductBarcodeController::class, 'printBarcodes'])->name('product-barcodes.print');

    // Product Images
    Route::get('/products/images', [ProductImageController::class, 'index'])->name('product-images.index');
    Route::get('/products/{product}/images', [ProductImageController::class, 'show'])->name('product-images.show');
    Route::post('/products/{product}/images/upload', [ProductImageController::class, 'upload'])->name('product-images.upload');
    Route::post('/products/{product}/images/update-order', [ProductImageController::class, 'updateOrder'])->name('product-images.update-order');
    Route::post('/products/{product}/images/{image}/set-primary', [ProductImageController::class, 'setPrimary'])->name('product-images.set-primary');
    Route::delete('/products/{product}/images/{image}', [ProductImageController::class, 'destroy'])->name('product-images.destroy');
    Route::post('/products/images/bulk-upload', [ProductImageController::class, 'bulkUpload'])->name('product-images.bulk-upload');
    Route::post('/products/images/optimize', [ProductImageController::class, 'optimize'])->name('product-images.optimize');
});

// Product Management Routes (generic routes after specific ones)
Route::middleware(['auth'])->prefix('products')->name('products.')->group(function () {
    Route::get('/list', [ProductController::class, 'index'])->name('index');
    Route::get('/export-excel', [ProductController::class, 'exportExcel'])->name('export-excel');
    Route::get('/create', [ProductController::class, 'create'])->name('create');
    Route::post('/', [ProductController::class, 'store'])->name('store');
    Route::get('/{product}', [ProductController::class, 'show'])->name('show');
    Route::get('/{product}/edit', [ProductController::class, 'edit'])->name('edit');
    Route::put('/{product}', [ProductController::class, 'update'])->name('update');
    Route::delete('/{product}', [ProductController::class, 'destroy'])->name('destroy');

    // Additional product actions
    Route::post('/bulk-delete', [ProductController::class, 'bulkDelete'])->name('bulk-delete');
    Route::post('/{product}/update-stock', [ProductController::class, 'updateStock'])->name('update-stock');
    Route::post('/{product}/duplicate', [ProductController::class, 'duplicate'])->name('duplicate');
    Route::get('/{product}/stock-history', [ProductController::class, 'stockHistory'])->name('stock-history');
    
    // Category API endpoints
    Route::get('/api/category-parents', [ProductController::class, 'getCategoryParents'])->name('api.category-parents');
});

// Stock Management Routes
Route::middleware(['auth'])->prefix('stock')->name('stock.')->group(function () {
    Route::get('/', [StockController::class, 'index'])->middleware('permission:stock.view')->name('index');
    Route::get('/movements', [StockController::class, 'movements'])->middleware('permission:stock.movements')->name('movements');
    Route::post('/bulk-update', [StockController::class, 'bulkUpdateStock'])->middleware('permission:stock.adjust')->name('bulk-update');
    Route::post('/{product}/update', [StockController::class, 'updateStock'])->middleware('permission:stock.adjust')->name('update');
    Route::get('/low-stock-alerts', [StockController::class, 'lowStockAlerts'])->middleware('permission:stock.view')->name('low-stock-alerts');
    Route::get('/export', [StockController::class, 'exportStock'])->middleware('permission:stock.reports')->name('export');

    // Stock Adjustments
    Route::get('/adjustments', [StockController::class, 'adjustments'])->middleware('permission:stock.view')->name('adjustments');
    Route::get('/adjustments/create', [StockController::class, 'createAdjustment'])->middleware('permission:stock.adjust')->name('adjustments.create');
    Route::post('/adjustments', [StockController::class, 'storeAdjustment'])->middleware('permission:stock.adjust')->name('adjustments.store');
    Route::get('/adjustments/{adjustment}', [StockController::class, 'showAdjustment'])->middleware('permission:stock.view')->name('adjustments.show');
    Route::post('/adjustments/{adjustment}/approve', [StockController::class, 'approveAdjustment'])->middleware('permission:stock.adjust')->name('adjustments.approve');
    Route::post('/adjustments/{adjustment}/reject', [StockController::class, 'rejectAdjustment'])->middleware('permission:stock.adjust')->name('adjustments.reject');
    Route::post('/adjustments/{adjustment}/complete', [StockController::class, 'completeAdjustment'])->middleware('permission:stock.adjust')->name('adjustments.complete');
    Route::delete('/adjustments/{adjustment}', [StockController::class, 'destroyAdjustment'])->middleware('permission:stock.adjust')->name('adjustments.destroy');

    // Stock Transfers
    Route::get('/transfers', [StockController::class, 'transfers'])->middleware('permission:stock.transfer')->name('transfers');
    Route::get('/transfers/create', [StockController::class, 'createTransfer'])->middleware('permission:stock.transfer')->name('transfers.create');
    Route::post('/transfers', [StockController::class, 'storeTransfer'])->middleware('permission:stock.transfer')->name('transfers.store');
    Route::get('/transfers/{transfer}', [StockController::class, 'showTransfer'])->middleware('permission:stock.transfer')->name('transfers.show');
    Route::post('/transfers/{transfer}/approve', [StockController::class, 'approveTransfer'])->middleware('permission:stock.transfer')->name('transfers.approve');
    Route::post('/transfers/{transfer}/ship', [StockController::class, 'shipTransfer'])->middleware('permission:stock.transfer')->name('transfers.ship');
    Route::post('/transfers/{transfer}/receive', [StockController::class, 'receiveTransfer'])->middleware('permission:stock.transfer')->name('transfers.receive');
    Route::post('/transfers/{transfer}/cancel', [StockController::class, 'cancelTransfer'])->middleware('permission:stock.transfer')->name('transfers.cancel');
    Route::delete('/transfers/{transfer}', [StockController::class, 'destroyTransfer'])->middleware('permission:stock.transfer')->name('transfers.destroy');

    // Stock Reports
    Route::get('/reports', [StockController::class, 'reports'])->middleware('permission:stock.reports')->name('reports');
    Route::get('/reports/stock-status', [StockController::class, 'stockStatusReport'])->middleware('permission:stock.reports')->name('reports.stock-status');
    Route::get('/reports/stock-movement', [StockController::class, 'stockMovementReport'])->middleware('permission:stock.reports')->name('reports.stock-movement');
    Route::get('/reports/abc-analysis', [StockController::class, 'abcAnalysisReport'])->middleware('permission:stock.reports')->name('reports.abc-analysis');
    Route::get('/reports/stock-aging', [StockController::class, 'stockAgingReport'])->middleware('permission:stock.reports')->name('reports.stock-aging');
    Route::get('/reports/stock-turnover', [StockController::class, 'stockTurnoverReport'])->middleware('permission:stock.reports')->name('reports.stock-turnover');
});

// Suppliers
Route::middleware(['auth'])->group(function () {
    Route::get('/purchasing/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
    Route::get('/purchasing/suppliers/create', [SupplierController::class, 'create'])->name('suppliers.create');
    Route::post('/purchasing/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
    Route::get('/purchasing/suppliers/{supplier}', [SupplierController::class, 'show'])->name('suppliers.show');
    Route::get('/purchasing/suppliers/{supplier}/edit', [SupplierController::class, 'edit'])->name('suppliers.edit');
    Route::put('/purchasing/suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
    Route::delete('/purchasing/suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');
});

// Warehouse Management
Route::middleware(['auth'])->prefix('warehouses')->name('warehouses.')->group(function () {
    Route::get('/', [\App\Http\Controllers\WarehouseController::class, 'index'])->middleware('permission:warehouse.view')->name('index');
    Route::get('/dashboard', [\App\Http\Controllers\WarehouseController::class, 'dashboard'])->middleware('permission:warehouse.dashboard')->name('dashboard');
    Route::get('/reports', [\App\Http\Controllers\WarehouseController::class, 'reports'])->middleware('permission:warehouse.reports')->name('reports');
    Route::get('/create', [\App\Http\Controllers\WarehouseController::class, 'create'])->middleware('permission:warehouse.create')->name('create');
    Route::post('/', [\App\Http\Controllers\WarehouseController::class, 'store'])->middleware('permission:warehouse.create')->name('store');

    // Warehouse Zones (MOVED BEFORE generic warehouse routes)
    Route::prefix('zones')->name('zones.')->group(function () {
        Route::get('/', [\App\Http\Controllers\WarehouseZoneController::class, 'index'])->middleware('permission:warehouse.zones.view')->name('index');
        Route::get('/create', [\App\Http\Controllers\WarehouseZoneController::class, 'create'])->middleware('permission:warehouse.zones.create')->name('create');
        Route::post('/', [\App\Http\Controllers\WarehouseZoneController::class, 'store'])->middleware('permission:warehouse.zones.create')->name('store');
        Route::get('/{warehouseZone}', [\App\Http\Controllers\WarehouseZoneController::class, 'show'])->middleware('permission:warehouse.zones.view')->name('show');
        Route::get('/{warehouseZone}/edit', [\App\Http\Controllers\WarehouseZoneController::class, 'edit'])->middleware('permission:warehouse.zones.edit')->name('edit');
        Route::put('/{warehouseZone}', [\App\Http\Controllers\WarehouseZoneController::class, 'update'])->middleware('permission:warehouse.zones.edit')->name('update');
        Route::delete('/{warehouseZone}', [\App\Http\Controllers\WarehouseZoneController::class, 'destroy'])->middleware('permission:warehouse.zones.delete')->name('destroy');
    });

    // Warehouse Locations
    Route::prefix('locations')->name('locations.')->group(function () {
        Route::get('/', [\App\Http\Controllers\WarehouseLocationController::class, 'index'])->middleware('permission:warehouse.locations.view')->name('index');
        Route::get('/create', [\App\Http\Controllers\WarehouseLocationController::class, 'create'])->middleware('permission:warehouse.locations.create')->name('create');
        Route::post('/', [\App\Http\Controllers\WarehouseLocationController::class, 'store'])->middleware('permission:warehouse.locations.create')->name('store');
        Route::get('/{warehouseLocation}', [\App\Http\Controllers\WarehouseLocationController::class, 'show'])->middleware('permission:warehouse.locations.view')->name('show');
        Route::get('/{warehouseLocation}/edit', [\App\Http\Controllers\WarehouseLocationController::class, 'edit'])->middleware('permission:warehouse.locations.edit')->name('edit');
        Route::put('/{warehouseLocation}', [\App\Http\Controllers\WarehouseLocationController::class, 'update'])->middleware('permission:warehouse.locations.edit')->name('update');
        Route::delete('/{warehouseLocation}', [\App\Http\Controllers\WarehouseLocationController::class, 'destroy'])->middleware('permission:warehouse.locations.delete')->name('destroy');
    });

    // Warehouse Operations
    Route::prefix('operations')->name('operations.')->group(function () {
        Route::get('/', [\App\Http\Controllers\WarehouseOperationController::class, 'index'])->middleware('permission:warehouse.operations.view')->name('index');
        Route::get('/create', [\App\Http\Controllers\WarehouseOperationController::class, 'create'])->middleware('permission:warehouse.operations.create')->name('create');
        Route::post('/', [\App\Http\Controllers\WarehouseOperationController::class, 'store'])->middleware('permission:warehouse.operations.create')->name('store');
        Route::get('/{warehouseOperation}', [\App\Http\Controllers\WarehouseOperationController::class, 'show'])->middleware('permission:warehouse.operations.view')->name('show');
        Route::get('/{warehouseOperation}/edit', [\App\Http\Controllers\WarehouseOperationController::class, 'edit'])->middleware('permission:warehouse.operations.edit')->name('edit');
        Route::put('/{warehouseOperation}', [\App\Http\Controllers\WarehouseOperationController::class, 'update'])->middleware('permission:warehouse.operations.edit')->name('update');
        Route::delete('/{warehouseOperation}', [\App\Http\Controllers\WarehouseOperationController::class, 'destroy'])->middleware('permission:warehouse.operations.edit')->name('destroy');
        Route::patch('/{warehouseOperation}/start', [\App\Http\Controllers\WarehouseOperationController::class, 'start'])->middleware('permission:warehouse.operations.assign')->name('start');
        Route::patch('/{warehouseOperation}/complete', [\App\Http\Controllers\WarehouseOperationController::class, 'complete'])->middleware('permission:warehouse.operations.assign')->name('complete');
        Route::patch('/{warehouseOperation}/cancel', [\App\Http\Controllers\WarehouseOperationController::class, 'cancel'])->middleware('permission:warehouse.operations.assign')->name('cancel');
    });

    // Warehouse Staff
    Route::prefix('staff')->name('staff.')->group(function () {
        Route::get('/', [\App\Http\Controllers\WarehouseStaffController::class, 'index'])->middleware('permission:warehouse.staff.view')->name('index');
        Route::get('/create', [\App\Http\Controllers\WarehouseStaffController::class, 'create'])->middleware('permission:warehouse.staff.create')->name('create');
        Route::post('/', [\App\Http\Controllers\WarehouseStaffController::class, 'store'])->middleware('permission:warehouse.staff.create')->name('store');
        Route::get('/{warehouseStaff}', [\App\Http\Controllers\WarehouseStaffController::class, 'show'])->middleware('permission:warehouse.staff.view')->name('show');
        Route::get('/{warehouseStaff}/edit', [\App\Http\Controllers\WarehouseStaffController::class, 'edit'])->middleware('permission:warehouse.staff.edit')->name('edit');
        Route::put('/{warehouseStaff}', [\App\Http\Controllers\WarehouseStaffController::class, 'update'])->middleware('permission:warehouse.staff.edit')->name('update');
        Route::delete('/{warehouseStaff}', [\App\Http\Controllers\WarehouseStaffController::class, 'destroy'])->middleware('permission:warehouse.staff.delete')->name('destroy');
    });

    // Warehouse Receiving (Purchase Order Receiving)
    Route::prefix('receiving')->name('receiving.')->group(function () {
        Route::get('/', [\App\Http\Controllers\WarehouseReceivingController::class, 'index'])->middleware('permission:warehouse.receiving.view')->name('index');
        Route::get('/{id}', [\App\Http\Controllers\WarehouseReceivingController::class, 'show'])->middleware('permission:warehouse.receiving.view')->name('show');
        Route::get('/{id}/process', [\App\Http\Controllers\WarehouseReceivingController::class, 'process'])->middleware('permission:warehouse.receiving.process')->name('process');
        Route::post('/{id}/receive', [\App\Http\Controllers\WarehouseReceivingController::class, 'store'])->middleware('permission:warehouse.receiving.complete')->name('store');
    });

    // Quality Control
    Route::prefix('quality-control')->name('quality-control.')->group(function () {
        Route::get('/', [\App\Http\Controllers\QualityControlController::class, 'index'])->middleware('permission:warehouse.qc.view')->name('index');
        Route::get('/{id}', [\App\Http\Controllers\QualityControlController::class, 'show'])->middleware('permission:warehouse.qc.view')->name('show');
        Route::post('/{id}/approve', [\App\Http\Controllers\QualityControlController::class, 'approve'])->middleware('permission:warehouse.qc.approve')->name('approve');
        Route::post('/{id}/reject', [\App\Http\Controllers\QualityControlController::class, 'reject'])->middleware('permission:warehouse.qc.reject')->name('reject');
        Route::patch('/{id}/priority', [\App\Http\Controllers\QualityControlController::class, 'updatePriority'])->middleware('permission:warehouse.qc.view')->name('update-priority');
    });

    // Put-away (Warehouse Placement)
    Route::prefix('putaway')->name('putaway.')->group(function () {
        Route::get('/', [\App\Http\Controllers\PutawayController::class, 'index'])->middleware('permission:warehouse.putaway.view')->name('index');
        Route::get('/{id}', [\App\Http\Controllers\PutawayController::class, 'show'])->middleware('permission:warehouse.putaway.view')->name('show');
        Route::post('/{itemId}/{locationId}/assign', [\App\Http\Controllers\PutawayController::class, 'assign'])->middleware('permission:warehouse.putaway.assign')->name('assign');
        Route::post('/bulk-assign', [\App\Http\Controllers\PutawayController::class, 'bulkAssign'])->middleware('permission:warehouse.putaway.assign')->name('bulk-assign');
        Route::post('/optimize', [\App\Http\Controllers\PutawayController::class, 'optimize'])->middleware('permission:warehouse.putaway.assign')->name('optimize');
        Route::get('/{id}/manual', [\App\Http\Controllers\PutawayController::class, 'manual'])->middleware('permission:warehouse.putaway.view')->name('manual');
        Route::get('/analytics', [\App\Http\Controllers\PutawayController::class, 'analytics'])->middleware('permission:warehouse.putaway.view')->name('analytics');
    });

    // Generic warehouse routes (MOVED TO END to avoid conflicts with specific routes)
    Route::get('/{warehouse}', [\App\Http\Controllers\WarehouseController::class, 'show'])->middleware('permission:warehouse.view')->name('show');
    Route::get('/{warehouse}/edit', [\App\Http\Controllers\WarehouseController::class, 'edit'])->middleware('permission:warehouse.edit')->name('edit');
    Route::put('/{warehouse}', [\App\Http\Controllers\WarehouseController::class, 'update'])->middleware('permission:warehouse.edit')->name('update');
    Route::delete('/{warehouse}', [\App\Http\Controllers\WarehouseController::class, 'destroy'])->middleware('permission:warehouse.delete')->name('destroy');
});


// Company Locations
Route::middleware(['auth'])->group(function () {
    Route::get('/company-locations', [\App\Http\Controllers\CompanyLocationController::class, 'index'])->name('company-locations.index');
    Route::get('/company-locations/create', [\App\Http\Controllers\CompanyLocationController::class, 'create'])->name('company-locations.create');
    Route::post('/company-locations', [\App\Http\Controllers\CompanyLocationController::class, 'store'])->name('company-locations.store');
    Route::get('/company-locations/{companyLocation}', [\App\Http\Controllers\CompanyLocationController::class, 'show'])->name('company-locations.show');
    Route::get('/company-locations/{companyLocation}/edit', [\App\Http\Controllers\CompanyLocationController::class, 'edit'])->name('company-locations.edit');
    Route::put('/company-locations/{companyLocation}', [\App\Http\Controllers\CompanyLocationController::class, 'update'])->name('company-locations.update');
    Route::delete('/company-locations/{companyLocation}', [\App\Http\Controllers\CompanyLocationController::class, 'destroy'])->name('company-locations.destroy');
});

// Companies (Customers & Suppliers)
Route::middleware(['auth'])->group(function () {
    // Companies
    Route::get('/companies', [\App\Http\Controllers\CompanyController::class, 'index'])->name('companies.index');
    Route::get('/companies/create', [\App\Http\Controllers\CompanyController::class, 'create'])->name('companies.create');
    Route::post('/companies', [\App\Http\Controllers\CompanyController::class, 'store'])->name('companies.store');
    Route::get('/companies/{company}', [\App\Http\Controllers\CompanyController::class, 'show'])->name('companies.show');
    Route::get('/companies/{company}/edit', [\App\Http\Controllers\CompanyController::class, 'edit'])->name('companies.edit');
    Route::put('/companies/{company}', [\App\Http\Controllers\CompanyController::class, 'update'])->name('companies.update');
    Route::delete('/companies/{company}', [\App\Http\Controllers\CompanyController::class, 'destroy'])->name('companies.destroy');

    // Company Contacts
    Route::get('/companies/{company}/contacts', [\App\Http\Controllers\CompanyContactController::class, 'index'])->name('companies.contacts.index');
    Route::get('/companies/{company}/contacts/create', [\App\Http\Controllers\CompanyContactController::class, 'create'])->name('companies.contacts.create');
    Route::post('/companies/{company}/contacts', [\App\Http\Controllers\CompanyContactController::class, 'store'])->name('companies.contacts.store');
    Route::get('/companies/{company}/contacts/{contact}', [\App\Http\Controllers\CompanyContactController::class, 'show'])->name('companies.contacts.show');
    Route::get('/companies/{company}/contacts/{contact}/edit', [\App\Http\Controllers\CompanyContactController::class, 'edit'])->name('companies.contacts.edit');
    Route::put('/companies/{company}/contacts/{contact}', [\App\Http\Controllers\CompanyContactController::class, 'update'])->name('companies.contacts.update');
    Route::delete('/companies/{company}/contacts/{contact}', [\App\Http\Controllers\CompanyContactController::class, 'destroy'])->name('companies.contacts.destroy');
    Route::put('/companies/{company}/contacts/{contact}/set-primary', [\App\Http\Controllers\CompanyContactController::class, 'setPrimary'])->name('companies.contacts.set-primary');

    // Company Types
    Route::resource('company-types', \App\Http\Controllers\CompanyTypeController::class);

    // Customer & Supplier specific views
    Route::get('/customers', [\App\Http\Controllers\CompanyController::class, 'customers'])->name('customers.index');
    Route::get('/suppliers', [\App\Http\Controllers\CompanyController::class, 'suppliers'])->name('company.suppliers.index');
});



// Information Pages
Route::prefix('bilgi')->name('info.')->group(function () {
    Route::get('/doviz-kurlari', [App\Http\Controllers\ExchangeRateInfoController::class, 'index'])->name('exchange-rates');
});

// API routes for exchange rate page
Route::prefix('api/exchange-rates')->name('api.exchange-rates.')->group(function () {
    Route::get('/history/{currency}', [App\Http\Controllers\ExchangeRateInfoController::class, 'getCurrencyHistory'])->name('history');
    Route::post('/convert', [App\Http\Controllers\ExchangeRateInfoController::class, 'convertCurrency'])->name('convert');
    Route::get('/currencies', [App\Http\Controllers\ExchangeRateInfoController::class, 'getAvailableCurrencies'])->name('currencies');
});

// Legacy routes
Route::get('/testa', [App\Http\Controllers\TestaController::class, 'index'])->name('testa');

// Reports
Route::middleware(['auth'])->prefix('reports')->name('reports.')->group(function () {
    // Existing comparative reports
    Route::get('/comparative-sales', [\App\Http\Controllers\Reports\ComparativeSalesReportController::class, 'index'])
        ->name('comparative-sales');
    Route::get('/company-comparative-sales', [\App\Http\Controllers\Reports\CompanyComparativeSalesReportController::class, 'index'])
        ->name('company-comparative-sales');

    // Sales Reports
    Route::prefix('sales')->name('sales.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Reports\SalesReportController::class, 'index'])->name('index');
        Route::get('/by-product', [\App\Http\Controllers\Reports\SalesReportController::class, 'byProduct'])->name('by-product');
        Route::get('/by-customer', [\App\Http\Controllers\Reports\SalesReportController::class, 'byCustomer'])->name('by-customer');
        Route::get('/by-salesperson', [\App\Http\Controllers\Reports\SalesReportController::class, 'bySalesperson'])->name('by-salesperson');
        Route::get('/by-region', [\App\Http\Controllers\Reports\SalesReportController::class, 'byRegion'])->name('by-region');
    });

    // Financial Reports
    Route::prefix('financial')->name('financial.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Reports\FinancialReportController::class, 'index'])->name('index');
        Route::get('/cash-flow', [\App\Http\Controllers\Reports\FinancialReportController::class, 'cashFlow'])->name('cash-flow');
        Route::get('/accounts-receivable', [\App\Http\Controllers\Reports\FinancialReportController::class, 'accountsReceivable'])->name('accounts-receivable');
        Route::get('/accounts-payable', [\App\Http\Controllers\Reports\FinancialReportController::class, 'accountsPayable'])->name('accounts-payable');
        Route::get('/profit-margin', [\App\Http\Controllers\Reports\FinancialReportController::class, 'profitMargin'])->name('profit-margin');
    });

    // Customer Reports
    Route::prefix('customers')->name('customers.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Reports\CustomerReportController::class, 'index'])->name('index');
        Route::get('/segmentation', [\App\Http\Controllers\Reports\CustomerReportController::class, 'segmentation'])->name('segmentation');
        Route::get('/lifetime-value', [\App\Http\Controllers\Reports\CustomerReportController::class, 'lifetimeValue'])->name('lifetime-value');
        Route::get('/retention', [\App\Http\Controllers\Reports\CustomerReportController::class, 'retention'])->name('retention');
        Route::get('/growth', [\App\Http\Controllers\Reports\CustomerReportController::class, 'growth'])->name('growth');
    });

    // Product Reports
    Route::prefix('products')->name('products.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Reports\ProductReportController::class, 'index'])->name('index');
        Route::get('/performance', [\App\Http\Controllers\Reports\ProductReportController::class, 'performance'])->name('performance');
        Route::get('/profitability', [\App\Http\Controllers\Reports\ProductReportController::class, 'profitability'])->name('profitability');
        Route::get('/trends', [\App\Http\Controllers\Reports\ProductReportController::class, 'trends'])->name('trends');
        Route::get('/slow-moving', [\App\Http\Controllers\Reports\ProductReportController::class, 'slowMoving'])->name('slow-moving');
    });

    // Performance Reports
    Route::prefix('performance')->name('performance.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Reports\PerformanceReportController::class, 'index'])->name('index');
        Route::get('/sales-team', [\App\Http\Controllers\Reports\PerformanceReportController::class, 'salesTeam'])->name('sales-team');
        Route::get('/target-achievement', [\App\Http\Controllers\Reports\PerformanceReportController::class, 'targetAchievement'])->name('target-achievement');
        Route::get('/operational-kpis', [\App\Http\Controllers\Reports\PerformanceReportController::class, 'operationalKpis'])->name('operational-kpis');
        Route::get('/trend-analysis', [\App\Http\Controllers\Reports\PerformanceReportController::class, 'trendAnalysis'])->name('trend-analysis');
    });

    // Custom Reports (Report Center)
    Route::get('/custom', function () {
        return \Inertia\Inertia::render('Reports/Custom/Index');
    })->name('custom');
});

// Accounting Routes
Route::middleware(['auth'])->prefix('accounting')->name('accounting.')->group(function () {
    // Current Accounts (Cari Kartlar)
    Route::prefix('current-accounts')->name('current-accounts.')->group(function () {
        Route::get('/', [CurrentAccountController::class, 'index'])->name('index');
        Route::get('/create', [CurrentAccountController::class, 'create'])->name('create');
        Route::get('/suggestions', [CurrentAccountController::class, 'suggestions'])->name('suggestions');
        Route::get('/export', [CurrentAccountController::class, 'export'])->name('export');
        Route::post('/', [CurrentAccountController::class, 'store'])->name('store');
        Route::get('/{currentAccount}', [CurrentAccountController::class, 'show'])->name('show');
        Route::get('/{currentAccount}/edit', [CurrentAccountController::class, 'edit'])->name('edit');
        Route::put('/{currentAccount}', [CurrentAccountController::class, 'update'])->name('update');
        Route::patch('/{currentAccount}', [CurrentAccountController::class, 'update'])->name('update.patch');
        Route::delete('/{currentAccount}', [CurrentAccountController::class, 'destroy'])->name('destroy');
        Route::patch('/{currentAccount}/toggle-status', [CurrentAccountController::class, 'toggleStatus'])->name('toggle-status');
        Route::patch('/{currentAccount}/toggle-block', [CurrentAccountController::class, 'toggleBlock'])->name('toggle-block');
        
        // Ekstre PDF Download
        Route::get('/{currentAccount}/ekstre-pdf', [CurrentAccountController::class, 'downloadEkstre'])->name('ekstre-pdf');

        // Delivery Addresses for Current Account
        Route::prefix('{currentAccount}/delivery-addresses')->name('delivery-addresses.')->group(function () {
            Route::get('/', [CurrentAccountController::class, 'getDeliveryAddresses'])->name('index');
            Route::post('/', [CurrentAccountController::class, 'storeDeliveryAddress'])->name('store');
            Route::put('/{deliveryAddress}', [CurrentAccountController::class, 'updateDeliveryAddress'])->name('update');
            Route::delete('/{deliveryAddress}', [CurrentAccountController::class, 'destroyDeliveryAddress'])->name('destroy');
        });
    });

    // Accounting Movements (Muhasebe Hareketleri)
    Route::prefix('movements')->name('movements.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Accounting\AccountingMovementController::class, 'index'])->name('index');
        Route::get('/analytics', [\App\Http\Controllers\Accounting\AccountingMovementController::class, 'analytics'])->name('analytics');
        Route::get('/export', [\App\Http\Controllers\Accounting\AccountingMovementController::class, 'export'])->name('export');
        Route::get('/{id}', [\App\Http\Controllers\Accounting\AccountingMovementController::class, 'show'])->name('show');
    });

    // Collections (Tahsilatlar)
    Route::prefix('collections')->name('collections.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Accounting\CollectionController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\Accounting\CollectionController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\Accounting\CollectionController::class, 'store'])->name('store');
        Route::get('/maturity-calendar', [\App\Http\Controllers\Accounting\CollectionController::class, 'maturityCalendar'])->name('maturity-calendar');
        Route::get('/export', [\App\Http\Controllers\Accounting\CollectionController::class, 'export'])->name('export');
        Route::get('/{collection}/edit', [\App\Http\Controllers\Accounting\CollectionController::class, 'edit'])->name('edit');
        Route::get('/{collection}', [\App\Http\Controllers\Accounting\CollectionController::class, 'show'])->name('show');
        Route::put('/{collection}', [\App\Http\Controllers\Accounting\CollectionController::class, 'update'])->name('update');
        Route::delete('/{collection}', [\App\Http\Controllers\Accounting\CollectionController::class, 'destroy'])->name('destroy');
        Route::patch('/{collection}/mark-collected', [\App\Http\Controllers\Accounting\CollectionController::class, 'markAsCollected'])->name('mark-collected');
        Route::patch('/{collection}/mark-bounced', [\App\Http\Controllers\Accounting\CollectionController::class, 'markAsBounced'])->name('mark-bounced');
        Route::patch('/{collection}/reconcile', [\App\Http\Controllers\Accounting\CollectionController::class, 'reconcile'])->name('reconcile');
        Route::patch('/{collection}/approve', [\App\Http\Controllers\Accounting\CollectionController::class, 'approve'])->name('approve');
        Route::patch('/{collection}/reject', [\App\Http\Controllers\Accounting\CollectionController::class, 'reject'])->name('reject');
    });

    // Bank Accounts (Banka Hesapları)
    Route::prefix('bank-accounts')->name('bank-accounts.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Accounting\BankAccountController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\Accounting\BankAccountController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\Accounting\BankAccountController::class, 'store'])->name('store');
        Route::get('/export', [\App\Http\Controllers\Accounting\BankAccountController::class, 'export'])->name('export');
        Route::post('/validate-iban', [\App\Http\Controllers\Accounting\BankAccountController::class, 'validateIban'])->name('validate-iban');
        Route::get('/{bankAccount}/edit', [\App\Http\Controllers\Accounting\BankAccountController::class, 'edit'])->name('edit');
        Route::get('/{bankAccount}', [\App\Http\Controllers\Accounting\BankAccountController::class, 'show'])->name('show');
        Route::patch('/{bankAccount}', [\App\Http\Controllers\Accounting\BankAccountController::class, 'update'])->name('update');
        Route::delete('/{bankAccount}', [\App\Http\Controllers\Accounting\BankAccountController::class, 'destroy'])->name('destroy');
        Route::patch('/{bankAccount}/toggle-status', [\App\Http\Controllers\Accounting\BankAccountController::class, 'toggleStatus'])->name('toggle-status');
        Route::patch('/{bankAccount}/set-default', [\App\Http\Controllers\Accounting\BankAccountController::class, 'setDefault'])->name('set-default');
    });

    // Payments (Ödemeler)
    Route::prefix('payments')->name('payments.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Accounting\PaymentController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\Accounting\PaymentController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\Accounting\PaymentController::class, 'store'])->name('store');
        Route::get('/analytics', [\App\Http\Controllers\Accounting\PaymentController::class, 'analytics'])->name('analytics');
        Route::get('/export', [\App\Http\Controllers\Accounting\PaymentController::class, 'export'])->name('export');
        Route::get('/exchange-rates', [\App\Http\Controllers\Accounting\PaymentController::class, 'getExchangeRates'])->name('exchange-rates');
        Route::get('/{payment}/edit', [\App\Http\Controllers\Accounting\PaymentController::class, 'edit'])->name('edit');
        Route::get('/{payment}', [\App\Http\Controllers\Accounting\PaymentController::class, 'show'])->name('show');
        Route::patch('/{payment}', [\App\Http\Controllers\Accounting\PaymentController::class, 'update'])->name('update');
        Route::delete('/{payment}', [\App\Http\Controllers\Accounting\PaymentController::class, 'destroy'])->name('destroy');
        Route::patch('/{payment}/mark-paid', [\App\Http\Controllers\Accounting\PaymentController::class, 'markAsPaid'])->name('mark-paid');
        Route::patch('/{payment}/mark-bounced', [\App\Http\Controllers\Accounting\PaymentController::class, 'markAsBounced'])->name('mark-bounced');
        Route::patch('/{payment}/approve', [\App\Http\Controllers\Accounting\PaymentController::class, 'approve'])->name('approve');
        Route::patch('/{payment}/reject', [\App\Http\Controllers\Accounting\PaymentController::class, 'reject'])->name('reject');
        Route::patch('/{payment}/reconcile', [\App\Http\Controllers\Accounting\PaymentController::class, 'reconcile'])->name('reconcile');
    });

    // Expenses (Giderler)
    Route::prefix('expenses')->name('expenses.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Accounting\ExpenseController::class, 'index'])->name('index');
        Route::get('/analytics', [\App\Http\Controllers\Accounting\ExpenseController::class, 'analytics'])->name('analytics');
        Route::get('/create', [\App\Http\Controllers\Accounting\ExpenseController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\Accounting\ExpenseController::class, 'store'])->name('store');
        Route::get('/export', [\App\Http\Controllers\Accounting\ExpenseController::class, 'export'])->name('export');
        Route::get('/{expense}/edit', [\App\Http\Controllers\Accounting\ExpenseController::class, 'edit'])->name('edit');
        Route::get('/{expense}', [\App\Http\Controllers\Accounting\ExpenseController::class, 'show'])->name('show');
        Route::match(['put', 'patch'], '/{expense}', [\App\Http\Controllers\Accounting\ExpenseController::class, 'update'])->name('update');
        Route::delete('/{expense}', [\App\Http\Controllers\Accounting\ExpenseController::class, 'destroy'])->name('destroy');
        Route::patch('/{expense}/approve', [\App\Http\Controllers\Accounting\ExpenseController::class, 'approve'])->name('approve');
        Route::patch('/{expense}/reject', [\App\Http\Controllers\Accounting\ExpenseController::class, 'reject'])->name('reject');
        Route::patch('/{expense}/mark-paid', [\App\Http\Controllers\Accounting\ExpenseController::class, 'markAsPaid'])->name('mark-paid');
        Route::post('/{expense}/duplicate', [\App\Http\Controllers\Accounting\ExpenseController::class, 'duplicate'])->name('duplicate');
        
        // API endpoints
        Route::get('/api/categories', [\App\Http\Controllers\Accounting\ExpenseController::class, 'getCategories'])->name('api.categories');
        Route::get('/api/budget/{category}', [\App\Http\Controllers\Accounting\ExpenseController::class, 'getCategoryBudget'])->name('api.budget');
        Route::get('/api/recurring', [\App\Http\Controllers\Accounting\ExpenseController::class, 'getRecurringExpenses'])->name('api.recurring');
    });

    // Cash Management (Kasa İşlemleri)
    Route::prefix('cash')->name('cash.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Accounting\CashAccountController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\Accounting\CashAccountController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\Accounting\CashAccountController::class, 'store'])->name('store');
        Route::get('/{cashAccount}', [\App\Http\Controllers\Accounting\CashAccountController::class, 'show'])->name('show');
        Route::get('/{cashAccount}/edit', [\App\Http\Controllers\Accounting\CashAccountController::class, 'edit'])->name('edit');
        Route::put('/{cashAccount}', [\App\Http\Controllers\Accounting\CashAccountController::class, 'update'])->name('update');
        Route::delete('/{cashAccount}', [\App\Http\Controllers\Accounting\CashAccountController::class, 'destroy'])->name('destroy');
    });

    // Aging Report (Yaşlandırma Raporu)
    Route::prefix('aging')->name('aging.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Accounting\AgingReportController::class, 'index'])->name('index');
        Route::get('/export', [\App\Http\Controllers\Accounting\AgingReportController::class, 'export'])->name('export');
    });

    // Cash Flow (Nakit Akışı)
    Route::get('/cash-flow', [\App\Http\Controllers\Accounting\CashFlowController::class, 'index'])
        ->middleware('permission:reports.view_cash_flow')
        ->name('cash-flow.index');
});

// Meeting Management Routes
Route::middleware(['auth'])->group(function () {
    // Meetings
    Route::get('/meetings', [App\Http\Controllers\MeetingController::class, 'index'])->name('meetings.index');
    Route::get('/meetings/calendar', [App\Http\Controllers\MeetingController::class, 'calendar'])->name('meetings.calendar');
    Route::get('/meetings/calendar/events', [App\Http\Controllers\MeetingController::class, 'calendarEvents'])->name('meetings.calendar.events');
    Route::get('/meetings/create', [App\Http\Controllers\MeetingController::class, 'create'])->name('meetings.create');
    Route::post('/meetings', [App\Http\Controllers\MeetingController::class, 'store'])->name('meetings.store');
    Route::get('/meetings/{meeting}', [App\Http\Controllers\MeetingController::class, 'show'])->name('meetings.show');
    Route::get('/meetings/{meeting}/edit', [App\Http\Controllers\MeetingController::class, 'edit'])->name('meetings.edit');
    Route::put('/meetings/{meeting}', [App\Http\Controllers\MeetingController::class, 'update'])->name('meetings.update');
    Route::delete('/meetings/{meeting}', [App\Http\Controllers\MeetingController::class, 'destroy'])->name('meetings.destroy');

    // Meeting Participants
    Route::patch('/meetings/{meeting}/participants/response', [App\Http\Controllers\MeetingController::class, 'updateParticipantResponse'])
        ->name('meetings.participants.response');

    // Meeting Documents
    Route::post('/meetings/{meeting}/documents', [App\Http\Controllers\MeetingController::class, 'uploadDocument'])
        ->name('meetings.documents.upload');
    Route::get('/meetings/{meeting}/documents/{document}/download', [App\Http\Controllers\MeetingController::class, 'downloadDocument'])
        ->name('meetings.documents.download');
    Route::delete('/meetings/{meeting}/documents/{document}', [App\Http\Controllers\MeetingController::class, 'deleteDocument'])
        ->name('meetings.documents.delete');

    // Meeting Rooms
    Route::get('/meeting-rooms', [App\Http\Controllers\MeetingRoomController::class, 'index'])->name('meeting-rooms.index');
    Route::get('/meeting-rooms/create', [App\Http\Controllers\MeetingRoomController::class, 'create'])->name('meeting-rooms.create');
    Route::post('/meeting-rooms', [App\Http\Controllers\MeetingRoomController::class, 'store'])->name('meeting-rooms.store');
    Route::get('/meeting-rooms/{meetingRoom}', [App\Http\Controllers\MeetingRoomController::class, 'show'])->name('meeting-rooms.show');
    Route::get('/meeting-rooms/{meetingRoom}/edit', [App\Http\Controllers\MeetingRoomController::class, 'edit'])->name('meeting-rooms.edit');
    Route::put('/meeting-rooms/{meetingRoom}', [App\Http\Controllers\MeetingRoomController::class, 'update'])->name('meeting-rooms.update');
    Route::delete('/meeting-rooms/{meetingRoom}', [App\Http\Controllers\MeetingRoomController::class, 'destroy'])->name('meeting-rooms.destroy');

    // Meeting Room Availability & Schedule
    Route::post('/meeting-rooms/{meetingRoom}/availability', [App\Http\Controllers\MeetingRoomController::class, 'availability'])
        ->name('meeting-rooms.availability');
    Route::get('/meeting-rooms/{meetingRoom}/schedule', [App\Http\Controllers\MeetingRoomController::class, 'schedule'])
        ->name('meeting-rooms.schedule');

    // User Search for Meetings
    Route::get('/meetings/users/search', [App\Http\Controllers\MeetingController::class, 'searchUsers'])
        ->name('meetings.users.search');
});

require __DIR__ . '/auth.php';

require __DIR__ . '/file-manager.php';

require __DIR__ . '/support-tickets.php';
require __DIR__ . '/hr.php'; // Include HR routes
require __DIR__ . '/inventory.php'; // Include inventory routes

require __DIR__ . '/admin.php';

require __DIR__ . '/purchasing.php'; // Include purchasing routes
require __DIR__ . '/sales.php'; // Include sales routes
require __DIR__ . '/portal.php'; // Include B2B customer portal routes

// Settings Routes - Only admin and super admin can access
Route::middleware(['auth', 'settings.access'])->prefix('settings')->name('settings.')->group(function () {
    // General Settings
    Route::get('/general', [\App\Http\Controllers\SettingsController::class, 'general'])->name('general');
    Route::post('/general', [\App\Http\Controllers\SettingsController::class, 'updateGeneral'])->name('general.update');

    // System Settings
    Route::get('/system', [\App\Http\Controllers\SettingsController::class, 'system'])->name('system');
    Route::post('/system', [\App\Http\Controllers\SettingsController::class, 'updateSystem'])->name('system.update');

    // Email Settings
    Route::get('/email', [\App\Http\Controllers\SettingsController::class, 'email'])->name('email');
    Route::post('/email', [\App\Http\Controllers\SettingsController::class, 'updateEmail'])->name('email.update');

    // Company Settings
    Route::get('/company', [\App\Http\Controllers\SettingsController::class, 'company'])->name('company');
    Route::post('/company', [\App\Http\Controllers\SettingsController::class, 'updateCompany'])->name('company.update');

    // Tax Settings
    Route::prefix('tax')->name('tax.')->group(function () {
        Route::get('/', [\App\Http\Controllers\SettingsTaxController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\SettingsTaxController::class, 'store'])->name('store');
        Route::put('/{tax}', [\App\Http\Controllers\SettingsTaxController::class, 'update'])->name('update');
        Route::delete('/{tax}', [\App\Http\Controllers\SettingsTaxController::class, 'destroy'])->name('destroy');
        Route::patch('/{tax}/set-default', [\App\Http\Controllers\SettingsTaxController::class, 'setDefault'])->name('set-default');
        Route::patch('/{tax}/toggle-status', [\App\Http\Controllers\SettingsTaxController::class, 'toggleStatus'])->name('toggle-status');
    });

    // Location Settings
    Route::prefix('locations')->name('locations.')->group(function () {
        Route::get('/', [\App\Http\Controllers\SettingsLocationController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\SettingsLocationController::class, 'store'])->name('store');
        Route::put('/{location}', [\App\Http\Controllers\SettingsLocationController::class, 'update'])->name('update');
        Route::delete('/{location}', [\App\Http\Controllers\SettingsLocationController::class, 'destroy'])->name('destroy');
        Route::put('/{location}/toggle-status', [\App\Http\Controllers\SettingsLocationController::class, 'toggleStatus'])->name('toggle-status');
        Route::get('/types', [\App\Http\Controllers\SettingsLocationController::class, 'getLocationTypes'])->name('types');
        Route::post('/bulk-import', [\App\Http\Controllers\SettingsLocationController::class, 'bulkImport'])->name('bulk-import');
        Route::get('/export', [\App\Http\Controllers\SettingsLocationController::class, 'export'])->name('export');
    });

    // Backup Settings
    Route::prefix('backup')->name('backup.')->group(function () {
        Route::get('/', [\App\Http\Controllers\BackupController::class, 'index'])->name('index');
        Route::post('/create', [\App\Http\Controllers\BackupController::class, 'create'])->name('create');
        Route::get('/download', [\App\Http\Controllers\BackupController::class, 'download'])->name('download');
        Route::delete('/delete', [\App\Http\Controllers\BackupController::class, 'delete'])->name('delete');
    });

    // Currency Settings
    Route::prefix('currencies')->name('currencies.')->group(function () {
        Route::get('/', [\App\Http\Controllers\CurrencyController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\CurrencyController::class, 'store'])->name('store');
        Route::put('/{currency}', [\App\Http\Controllers\CurrencyController::class, 'update'])->name('update');
        Route::delete('/{currency}', [\App\Http\Controllers\CurrencyController::class, 'destroy'])->name('destroy');
        Route::patch('/{currency}/set-default', [\App\Http\Controllers\CurrencyController::class, 'setDefault'])->name('set-default');
        Route::patch('/{currency}/toggle-status', [\App\Http\Controllers\CurrencyController::class, 'toggleStatus'])->name('toggle-status');
        Route::post('/update-rates', [\App\Http\Controllers\CurrencyController::class, 'updateExchangeRates'])->name('update-rates');
    });

    // Integration Settings
    Route::prefix('integrations')->name('integrations.')->group(function () {
        Route::get('/', [\App\Http\Controllers\IntegrationController::class, 'index'])->name('index');
        Route::get('/{integration}', [\App\Http\Controllers\IntegrationController::class, 'show'])->name('show');
        Route::put('/{integration}', [\App\Http\Controllers\IntegrationController::class, 'update'])->name('update');
        Route::patch('/{integration}/toggle-status', [\App\Http\Controllers\IntegrationController::class, 'toggleStatus'])->name('toggle-status');
        Route::post('/{integration}/test', [\App\Http\Controllers\IntegrationController::class, 'testConnection'])->name('test');
        Route::post('/{integration}/sync', [\App\Http\Controllers\IntegrationController::class, 'sync'])->name('sync');
        Route::get('/{integration}/logs', [\App\Http\Controllers\IntegrationController::class, 'logs'])->name('logs');
    });
});

// Email tracking pixel (no auth required)
Route::get('/email/track/{hash}.gif', [\App\Http\Controllers\Public\EmailTrackingController::class, 'pixel'])->name('email.tracking.pixel');

// Public Offer Approval (no auth required)
Route::prefix('offers/approve')->name('offers.public.')->group(function () {
    Route::get('/{token}', [\App\Http\Controllers\Public\OfferApprovalController::class, 'show'])->name('approve');
    Route::post('/{token}', [\App\Http\Controllers\Public\OfferApprovalController::class, 'approve'])->name('approve.submit');
    Route::get('/{token}/success', [\App\Http\Controllers\Public\OfferApprovalController::class, 'approved'])->name('approved');
    Route::get('/{token}/pdf', [\App\Http\Controllers\Public\OfferApprovalController::class, 'downloadPdf'])->name('pdf');
});

// Sales Offers
Route::middleware(['auth'])->prefix('sales/offers')->name('sales.offers.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Sales\SalesOfferController::class, 'index'])->name('index');
    Route::get('/tracking', [\App\Http\Controllers\Sales\SalesOfferController::class, 'trackingDashboard'])->name('tracking');
    Route::get('/create', [\App\Http\Controllers\Sales\SalesOfferController::class, 'create'])->name('create');
    Route::post('/', [\App\Http\Controllers\Sales\SalesOfferController::class, 'store'])->name('store');
    Route::get('/{id}', [\App\Http\Controllers\Sales\SalesOfferController::class, 'show'])->name('show');
    Route::get('/{id}/edit', [\App\Http\Controllers\Sales\SalesOfferController::class, 'edit'])->name('edit');
    Route::put('/{id}', [\App\Http\Controllers\Sales\SalesOfferController::class, 'update'])->name('update');
    Route::delete('/{id}', [\App\Http\Controllers\Sales\SalesOfferController::class, 'destroy'])->name('destroy');

    // Additional actions
    Route::post('/{id}/send', [\App\Http\Controllers\Sales\SalesOfferController::class, 'send'])->name('send');
    Route::post('/{id}/send-email', [\App\Http\Controllers\Sales\SalesOfferController::class, 'sendEmail'])->name('send-email');
    Route::post('/{id}/send-reminder', [\App\Http\Controllers\Sales\SalesOfferController::class, 'sendReminder'])->name('send-reminder');
    Route::get('/{id}/email-info', [\App\Http\Controllers\Sales\SalesOfferController::class, 'getEmailInfo'])->name('email-info');
    Route::get('/{id}/email-history', [\App\Http\Controllers\Sales\SalesOfferController::class, 'emailHistory'])->name('email-history');
    Route::post('/{id}/approve', [\App\Http\Controllers\Sales\SalesOfferController::class, 'approve'])->name('approve');
    Route::post('/{id}/reject', [\App\Http\Controllers\Sales\SalesOfferController::class, 'reject'])->name('reject');
    Route::get('/{id}/convert-to-order', [\App\Http\Controllers\Sales\SalesOfferController::class, 'convertToOrder'])->name('convert-to-order');
    Route::post('/{id}/convert-to-order', [\App\Http\Controllers\Sales\SalesOfferController::class, 'storeConvertToOrder'])->name('convert-to-order.store');
    Route::get('/{id}/pdf', [\App\Http\Controllers\Sales\SalesOfferController::class, 'downloadPdf'])->name('pdf');
    Route::get('/{id}/excel', [\App\Http\Controllers\Sales\SalesOfferController::class, 'downloadExcel'])->name('excel');

    // API routes
    Route::get('/api/search-products', [\App\Http\Controllers\Sales\SalesOfferController::class, 'searchProducts'])->name('search-products');
    Route::get('/api/search-customers', [\App\Http\Controllers\Sales\SalesOfferController::class, 'searchCustomers'])->name('search-customers');
    Route::post('/api/convert-price', [\App\Http\Controllers\Sales\SalesOfferController::class, 'convertPrice'])->name('convert-price');
    Route::get('/api/exchange-rates', [\App\Http\Controllers\Sales\SalesOfferController::class, 'getExchangeRates'])->name('exchange-rates');
});

// Test routes
Route::get('/test-product-search', function() {
    return view('test-product-search');
})->middleware('auth');

// Logo Integration Routes
require __DIR__.'/logo.php';

// Warehouse Shipping Routes
require __DIR__.'/warehouse.php';

// CRM Routes
require __DIR__.'/crm.php';

// Documentation Routes
Route::middleware(['auth'])->prefix('documentation')->name('documentation.')->group(function () {
    Route::get('/', [\App\Http\Controllers\DocumentationController::class, 'index'])->name('index');
    Route::get('/getting-started', [\App\Http\Controllers\DocumentationController::class, 'gettingStarted'])->name('getting-started');
    Route::get('/sales-management', [\App\Http\Controllers\DocumentationController::class, 'salesManagement'])->name('sales-management');
    Route::get('/crm', [\App\Http\Controllers\DocumentationController::class, 'crm'])->name('crm');
    Route::get('/stock-management', [\App\Http\Controllers\DocumentationController::class, 'stockManagement'])->name('stock-management');
    Route::get('/warehouse-management', [\App\Http\Controllers\DocumentationController::class, 'warehouseManagement'])->name('warehouse-management');
    Route::get('/shipping', [\App\Http\Controllers\DocumentationController::class, 'shipping'])->name('shipping');
    Route::get('/product-management', [\App\Http\Controllers\DocumentationController::class, 'productManagement'])->name('product-management');
    Route::get('/current-accounts', [\App\Http\Controllers\DocumentationController::class, 'currentAccounts'])->name('current-accounts');
    Route::get('/purchasing', [\App\Http\Controllers\DocumentationController::class, 'purchasing'])->name('purchasing');
    Route::get('/accounting', [\App\Http\Controllers\DocumentationController::class, 'accounting'])->name('accounting');
    Route::get('/reports', [\App\Http\Controllers\DocumentationController::class, 'reports'])->name('reports');
    Route::get('/user-management', [\App\Http\Controllers\DocumentationController::class, 'userManagement'])->name('user-management');
    Route::get('/settings', [\App\Http\Controllers\DocumentationController::class, 'settings'])->name('settings');
    Route::get('/faq', [\App\Http\Controllers\DocumentationController::class, 'faq'])->name('faq');
});
