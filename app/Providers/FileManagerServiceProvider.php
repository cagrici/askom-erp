<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Blade;

class FileManagerServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register any file manager specific bindings here
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Make sure we have the necessary storage directories
        $this->createStorageDirectories();
    }

    /**
     * Create necessary storage directories for file manager
     */
    private function createStorageDirectories(): void
    {
        // Make sure public disk is configured
        if (!Storage::disk('public')->exists('files')) {
            Storage::disk('public')->makeDirectory('files');
        }
    }
}
