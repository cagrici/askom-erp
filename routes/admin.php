<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\SupportTicketController;
use App\Http\Controllers\Api\AnnouncementApiController;

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
Route::middleware(['auth', 'admin.access'])->prefix('admin')->name('admin.')->group(function () {
    // Dashboard
    Route::get('/', [App\Http\Controllers\Admin\AdminController::class, 'index'])->name('dashboard');

    // Settings
    Route::get('/settings', [App\Http\Controllers\Admin\SettingController::class, 'index'])->name('settings.index');
    Route::post('/settings', [App\Http\Controllers\Admin\SettingController::class, 'store'])->name('settings.store');
    Route::put('/settings', [App\Http\Controllers\Admin\SettingController::class, 'update'])->name('settings.update');
    Route::delete('/settings/{setting}', [App\Http\Controllers\Admin\SettingController::class, 'destroy'])->name('settings.destroy');

    // Users
    Route::get('/users', [App\Http\Controllers\Admin\UserController::class, 'index'])->name('users.index');
    Route::get('/users/create', [App\Http\Controllers\Admin\UserController::class, 'create'])->name('users.create');
    Route::post('/users', [App\Http\Controllers\Admin\UserController::class, 'store'])->name('users.store');
    Route::get('/users/{user}/edit', [App\Http\Controllers\Admin\UserController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [App\Http\Controllers\Admin\UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [App\Http\Controllers\Admin\UserController::class, 'destroy'])->name('users.destroy');
    Route::post('/users/{user}/company-locations', [App\Http\Controllers\Admin\UserController::class, 'manageCompanyLocations'])->name('users.company-locations');
    Route::post('/users/{user}/accounts', [App\Http\Controllers\Admin\UserController::class, 'manageAccounts'])->name('users.accounts');
    Route::get('/users/available-accounts', [App\Http\Controllers\Admin\UserController::class, 'getAvailableAccounts'])->name('users.available-accounts');

    // Roles
    Route::get('/roles', [App\Http\Controllers\Admin\RoleController::class, 'index'])->name('roles.index');
    Route::get('/roles/create', [App\Http\Controllers\Admin\RoleController::class, 'create'])->name('roles.create');
    Route::post('/roles', [App\Http\Controllers\Admin\RoleController::class, 'store'])->name('roles.store');
    Route::get('/roles/{role}/edit', [App\Http\Controllers\Admin\RoleController::class, 'edit'])->name('roles.edit');
    Route::put('/roles/{role}', [App\Http\Controllers\Admin\RoleController::class, 'update'])->name('roles.update');
    Route::delete('/roles/{role}', [App\Http\Controllers\Admin\RoleController::class, 'destroy'])->name('roles.destroy');

    // Permissions
    Route::get('/permissions', [App\Http\Controllers\Admin\PermissionController::class, 'index'])->name('permissions.index');
    Route::get('/permissions/create', [App\Http\Controllers\Admin\PermissionController::class, 'create'])->name('permissions.create');
    Route::post('/permissions', [App\Http\Controllers\Admin\PermissionController::class, 'store'])->name('permissions.store');
    Route::get('/permissions/{permission}/edit', [App\Http\Controllers\Admin\PermissionController::class, 'edit'])->name('permissions.edit');
    Route::put('/permissions/{permission}', [App\Http\Controllers\Admin\PermissionController::class, 'update'])->name('permissions.update');

    // Login Redirects
    Route::get('/login-redirects', [App\Http\Controllers\Admin\LoginRedirectController::class, 'index'])->name('login-redirects.index');
    Route::get('/login-redirects/create', [App\Http\Controllers\Admin\LoginRedirectController::class, 'create'])->name('login-redirects.create');
    Route::post('/login-redirects', [App\Http\Controllers\Admin\LoginRedirectController::class, 'store'])->name('login-redirects.store');
    Route::get('/login-redirects/{loginRedirect}/edit', [App\Http\Controllers\Admin\LoginRedirectController::class, 'edit'])->name('login-redirects.edit');
    Route::put('/login-redirects/{loginRedirect}', [App\Http\Controllers\Admin\LoginRedirectController::class, 'update'])->name('login-redirects.update');
    Route::delete('/login-redirects/{loginRedirect}', [App\Http\Controllers\Admin\LoginRedirectController::class, 'destroy'])->name('login-redirects.destroy');
    Route::post('/login-redirects/{loginRedirect}/toggle-active', [App\Http\Controllers\Admin\LoginRedirectController::class, 'toggleActive'])->name('login-redirects.toggle-active');
    Route::delete('/permissions/{permission}', [App\Http\Controllers\Admin\PermissionController::class, 'destroy'])->name('permissions.destroy');
    Route::post('/permissions/{permission}/assign-roles', [App\Http\Controllers\Admin\PermissionController::class, 'assignRoles'])->name('permissions.assign-roles');

    // Organization Chart - Admin Management
    Route::get('/organizasyon-semasi', [App\Http\Controllers\OrganizationChartController::class, 'index'])->name('organization-chart.index');
    Route::post('/organizasyon-semasi/update-hierarchy', [App\Http\Controllers\OrganizationChartController::class, 'updateHierarchy'])->name('organization-chart.update-hierarchy');
    Route::post('/organizasyon-semasi/save-hierarchy', [App\Http\Controllers\OrganizationChartController::class, 'saveHierarchy'])->name('organization-chart.save-hierarchy');
    Route::post('/organizasyon-semasi/assign-position', [App\Http\Controllers\OrganizationChartController::class, 'assignPosition'])->name('organization-chart.assign-position');
    Route::delete('/organizasyon-semasi/remove-position/{user}', [App\Http\Controllers\OrganizationChartController::class, 'removePosition'])->name('organization-chart.remove-position');

    // Categories
    Route::get('/categories', [App\Http\Controllers\Admin\CategoryController::class, 'index'])->name('categories.index');
    Route::get('/categories/create', [App\Http\Controllers\Admin\CategoryController::class, 'create'])->name('categories.create');
    Route::post('/categories', [App\Http\Controllers\Admin\CategoryController::class, 'store'])->name('categories.store');
    Route::get('/categories/{category}', [App\Http\Controllers\Admin\CategoryController::class, 'show'])->name('categories.show');
    Route::get('/categories/{category}/edit', [App\Http\Controllers\Admin\CategoryController::class, 'edit'])->name('categories.edit');
    Route::put('/categories/{category}', [App\Http\Controllers\Admin\CategoryController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{category}', [App\Http\Controllers\Admin\CategoryController::class, 'destroy'])->name('categories.destroy');

    // Approval Workflows
    Route::get('/approval-workflows', [App\Http\Controllers\Admin\ApprovalWorkflowController::class, 'index'])->name('approval-workflows.index');
    Route::get('/approval-workflows/create', [App\Http\Controllers\Admin\ApprovalWorkflowController::class, 'create'])->name('approval-workflows.create');
    Route::post('/approval-workflows', [App\Http\Controllers\Admin\ApprovalWorkflowController::class, 'store'])->name('approval-workflows.store');
    Route::get('/approval-workflows/{approvalWorkflow}', [App\Http\Controllers\Admin\ApprovalWorkflowController::class, 'show'])->name('approval-workflows.show');
    Route::get('/approval-workflows/{approvalWorkflow}/edit', [App\Http\Controllers\Admin\ApprovalWorkflowController::class, 'edit'])->name('approval-workflows.edit');
    Route::put('/approval-workflows/{approvalWorkflow}', [App\Http\Controllers\Admin\ApprovalWorkflowController::class, 'update'])->name('approval-workflows.update');
    Route::delete('/approval-workflows/{approvalWorkflow}', [App\Http\Controllers\Admin\ApprovalWorkflowController::class, 'destroy'])->name('approval-workflows.destroy');
    Route::post('/approval-workflows/{approvalWorkflow}/toggle-status', [App\Http\Controllers\Admin\ApprovalWorkflowController::class, 'toggleStatus'])->name('approval-workflows.toggle-status');
    Route::post('/approval-workflows/{approvalWorkflow}/duplicate', [App\Http\Controllers\Admin\ApprovalWorkflowController::class, 'duplicate'])->name('approval-workflows.duplicate');

    // Companies
    Route::get('/companies', [App\Http\Controllers\Admin\CompanyController::class, 'index'])->name('companies.index');
    Route::post('/companies', [App\Http\Controllers\Admin\CompanyController::class, 'store'])->name('companies.store');
    Route::put('/companies/{company}', [App\Http\Controllers\Admin\CompanyController::class, 'update'])->name('companies.update');
    Route::delete('/companies/{company}', [App\Http\Controllers\Admin\CompanyController::class, 'destroy'])->name('companies.destroy');

    // Locations
    Route::get('/locations', [App\Http\Controllers\Admin\LocationController::class, 'index'])->name('locations.index');
    Route::post('/locations', [App\Http\Controllers\Admin\LocationController::class, 'store'])->name('locations.store');
    Route::put('/locations/{location}', [App\Http\Controllers\Admin\LocationController::class, 'update'])->name('locations.update');
    Route::delete('/locations/{location}', [App\Http\Controllers\Admin\LocationController::class, 'destroy'])->name('locations.destroy');

    // Organization Positions
    Route::get('/positions', [App\Http\Controllers\Admin\OrganizationPositionController::class, 'index'])->name('positions.index');
    Route::post('/positions', [App\Http\Controllers\Admin\OrganizationPositionController::class, 'store'])->name('positions.store');
    Route::put('/positions/{position}', [App\Http\Controllers\Admin\OrganizationPositionController::class, 'update'])->name('positions.update');
    Route::delete('/positions/{position}', [App\Http\Controllers\Admin\OrganizationPositionController::class, 'destroy'])->name('positions.destroy');
    Route::get('/positions/by-department/{department}', [App\Http\Controllers\Admin\OrganizationPositionController::class, 'getByDepartment'])->name('positions.by-department');
    Route::get('/positions/active', [App\Http\Controllers\Admin\OrganizationPositionController::class, 'getActive'])->name('positions.active');
    
    // Position Employee Management
    Route::get('/positions/{position}/employees', [App\Http\Controllers\Admin\OrganizationPositionController::class, 'getEmployees'])->name('positions.employees');
    Route::get('/positions/{position}/users', [App\Http\Controllers\Admin\OrganizationPositionController::class, 'getUsers'])->name('positions.users');
    Route::get('/positions/{position}/available-employees', [App\Http\Controllers\Admin\OrganizationPositionController::class, 'getAvailableEmployees'])->name('positions.available-employees');
    Route::get('/positions/{position}/available-users', [App\Http\Controllers\Admin\OrganizationPositionController::class, 'getAvailableUsers'])->name('positions.available-users');
    Route::post('/positions/{position}/assign-employees', [App\Http\Controllers\Admin\OrganizationPositionController::class, 'assignEmployees'])->name('positions.assign-employees');
    Route::post('/positions/{position}/assign-users', [App\Http\Controllers\Admin\OrganizationPositionController::class, 'assignUsers'])->name('positions.assign-users');
    Route::delete('/positions/{position}/employees/{employee}', [App\Http\Controllers\Admin\OrganizationPositionController::class, 'removeEmployee'])->name('positions.remove-employee');
    Route::delete('/positions/{position}/users/{user}', [App\Http\Controllers\Admin\OrganizationPositionController::class, 'removeUser'])->name('positions.remove-user');

    // Departments
    Route::get('/departments', [App\Http\Controllers\Admin\DepartmentController::class, 'index'])->name('departments.index');
    Route::post('/departments', [App\Http\Controllers\Admin\DepartmentController::class, 'store'])->name('departments.store');
    Route::put('/departments/{department}', [App\Http\Controllers\Admin\DepartmentController::class, 'update'])->name('departments.update');
    Route::delete('/departments/{department}', [App\Http\Controllers\Admin\DepartmentController::class, 'destroy'])->name('departments.destroy');
    Route::get('/departments/by-company/{company}', [App\Http\Controllers\Admin\DepartmentController::class, 'getByCompany'])->name('departments.by-company');
    Route::get('/departments/by-location/{location}', [App\Http\Controllers\Admin\DepartmentController::class, 'getByLocation'])->name('departments.by-location');
    Route::get('/departments/active', [App\Http\Controllers\Admin\DepartmentController::class, 'getActive'])->name('departments.active');
    Route::get('/departments/hierarchy', [App\Http\Controllers\Admin\DepartmentController::class, 'getHierarchy'])->name('departments.hierarchy');

    // Price Lists Management
    Route::prefix('pricing')->name('pricing.')->group(function () {
        // Price Lists
        Route::get('/price-lists', [App\Http\Controllers\Admin\ProductPriceListController::class, 'index'])->name('price-lists.index');
        Route::get('/price-lists/create', [App\Http\Controllers\Admin\ProductPriceListController::class, 'create'])->name('price-lists.create');
        Route::post('/price-lists', [App\Http\Controllers\Admin\ProductPriceListController::class, 'store'])->name('price-lists.store');
        Route::get('/price-lists/{priceList}', [App\Http\Controllers\Admin\ProductPriceListController::class, 'show'])->name('price-lists.show');
        Route::get('/price-lists/{priceList}/edit', [App\Http\Controllers\Admin\ProductPriceListController::class, 'edit'])->name('price-lists.edit');
        Route::put('/price-lists/{priceList}', [App\Http\Controllers\Admin\ProductPriceListController::class, 'update'])->name('price-lists.update');
        Route::delete('/price-lists/{priceList}', [App\Http\Controllers\Admin\ProductPriceListController::class, 'destroy'])->name('price-lists.destroy');
        
        // Price List Actions
        Route::patch('/price-lists/{priceList}/toggle-status', [App\Http\Controllers\Admin\ProductPriceListController::class, 'toggleStatus'])->name('price-lists.toggle-status');
        Route::patch('/price-lists/{priceList}/set-default', [App\Http\Controllers\Admin\ProductPriceListController::class, 'setDefault'])->name('price-lists.set-default');
        Route::post('/price-lists/{priceList}/duplicate', [App\Http\Controllers\Admin\ProductPriceListController::class, 'duplicate'])->name('price-lists.duplicate');
    });
});
