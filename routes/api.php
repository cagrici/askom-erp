 <?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\SupportTicketController;
use App\Http\Controllers\API\MessageController;
use App\Http\Controllers\EvdsController;
use App\Http\Controllers\API\GeographicDataController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Product related API endpoints for AJAX requests
Route::middleware(['auth:sanctum'])->group(function () {
    // Categories
    Route::post('/categories', [App\Http\Controllers\ProductCategoryController::class, 'apiStore'])->name('api.categories.store');

    // Brands
    Route::post('/brands', [App\Http\Controllers\BrandController::class, 'apiStore'])->name('api.brands.store');

    // Suppliers
    Route::post('/suppliers', [App\Http\Controllers\SupplierController::class, 'apiStore'])->name('api.suppliers.store');
});

// Support Tickets API
Route::middleware('auth')->group(function () {
    Route::get('/tickets/{ticket}/assigned-users', [SupportTicketController::class, 'getAssignedUsers']);


    // Messages API
    Route::prefix('messages')->group(function () {
        Route::get('/groups', [MessageController::class, 'index']);
        Route::get('/groups/{group}/messages', [MessageController::class, 'getGroupMessages']);
        Route::get('/groups/{group}/members', [MessageController::class, 'getGroupMembers']);
        Route::get('/search', [MessageController::class, 'search']);
        Route::get('/deleted', [MessageController::class, 'deletedMessages']);
        Route::get('/statistics', [MessageController::class, 'getWorkStatistics']);
        Route::get('/categories', [MessageController::class, 'getCategories']);
        Route::post('/', [MessageController::class, 'store']);
        Route::put('/{message}', [MessageController::class, 'update']);
        Route::delete('/{message}', [MessageController::class, 'destroy']);
        Route::post('/groups', [MessageController::class, 'createGroup']);
        Route::put('/groups/{group}/status', [MessageController::class, 'updateGroupStatus']);
        Route::put('/groups/{group}/assign', [MessageController::class, 'assignGroup']);
        Route::put('/groups/{group}/priority', [MessageController::class, 'updateGroupPriority']);
        Route::put('/groups/{group}/due-date', [MessageController::class, 'updateGroupDueDate']);
    });

    // Departments and Users API for message groups
    Route::get('/departments', function() {
        return \App\Models\Department::select('id', 'name')->get();
    });
    Route::get('/users', function() {
        return \App\Models\User::select('id', 'name', 'first_name', 'last_name', 'email')->get();
    });
    Route::get('/work-categories', function() {
        return \App\Models\WorkCategory::active()->ordered()->get();
    });

});

 // EVDS (Exchange Rate) API
 Route::prefix('evds')->group(function () {
     Route::get('/exchange-rates', [EvdsController::class, 'getExchangeRates'])->name('api.evds.exchange-rates');
     Route::get('/current-rates', [EvdsController::class, 'getCurrentRates'])->name('api.evds.current-rates');
     Route::get('/historical/{currency}', [EvdsController::class, 'getHistoricalRates'])->name('api.evds.historical');
     Route::get('/average-rates', [EvdsController::class, 'getAverageRates'])->name('api.evds.average-rates');
     Route::get('/supported-currencies', [EvdsController::class, 'getSupportedCurrencies'])->name('api.evds.currencies');
     Route::post('/convert', [EvdsController::class, 'convertCurrency'])->name('api.evds.convert');

     // Database archived rates endpoints
     Route::get('/archived-rates', [EvdsController::class, 'getArchivedRates'])->name('api.evds.archived-rates');
     Route::get('/latest-archived', [EvdsController::class, 'getLatestArchivedRates'])->name('api.evds.latest-archived');
     Route::post('/convert-archived', [EvdsController::class, 'convertCurrencyFromArchive'])->name('api.evds.convert-archived');
 });

// Geographic Data API
Route::middleware('auth')->prefix('geographic')->group(function () {
    Route::get('/countries', [GeographicDataController::class, 'countries'])->name('api.geographic.countries');
    Route::get('/cities/{country_id?}', [GeographicDataController::class, 'cities'])->name('api.geographic.cities');
    Route::get('/districts/{city_id?}', [GeographicDataController::class, 'districts'])->name('api.geographic.districts');
    Route::get('/tax-offices/{city_id?}', [GeographicDataController::class, 'taxOffices'])->name('api.geographic.tax-offices');
    Route::get('/payment-terms', [GeographicDataController::class, 'paymentTerms'])->name('api.geographic.payment-terms');
    Route::get('/payment-methods', [GeographicDataController::class, 'paymentMethods'])->name('api.geographic.payment-methods');
    Route::get('/sales-representatives', [GeographicDataController::class, 'salesRepresentatives'])->name('api.geographic.sales-representatives');
    Route::get('/country-data/{country_id}', [GeographicDataController::class, 'countryData'])->name('api.geographic.country-data');
    Route::get('/search-locations', [GeographicDataController::class, 'searchLocations'])->name('api.geographic.search-locations');
});

// Public Settings API
Route::get('/settings/public', [App\Http\Controllers\Admin\SettingController::class, 'public'])->name('api.settings.public');
