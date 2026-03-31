<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class TodoServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot()
    {
        // Register the todo routes
        $this->registerRoutes();
        
        // Make the storage link for todo-attachments if it doesn't exist
        $this->createStorageLink();
    }
    
    /**
     * Register the todo routes.
     *
     * @return void
     */
    protected function registerRoutes()
    {
        Route::middleware('web')
            ->group(base_path('routes/todo.php'));
    }
    
    /**
     * Create storage link for todo-attachments if it doesn't exist.
     *
     * @return void
     */
    protected function createStorageLink()
    {
        $todoAttachmentsPath = storage_path('app/public/todo-attachments');
        
        if (!file_exists($todoAttachmentsPath)) {
            mkdir($todoAttachmentsPath, 0755, true);
        }
    }
}
