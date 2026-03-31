<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\WarehouseStaff;
use App\Observers\WarehouseStaffObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Set default JSON encoding options to handle UTF-8 properly
        if (function_exists('json_encode')) {
            ini_set('default_charset', 'UTF-8');
        }

        // WarehouseStaff observer - Spatie rol senkronizasyonu
        WarehouseStaff::observe(WarehouseStaffObserver::class);
    }
}
