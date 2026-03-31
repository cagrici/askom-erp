<?php

use App\Http\Controllers\Todo\TodoController;
use App\Http\Controllers\Todo\TodoProjectController;
use Illuminate\Support\Facades\Route;

// Todo Management Routes
Route::middleware(['auth'])->group(function () {
    // Main todo page
    Route::get('/apps-todo', [TodoController::class, 'index'])->name('todo.index');
    
    // Todo API Routes
    Route::prefix('api')->group(function () {
        // Todo Items
        Route::get('/todos', [TodoController::class, 'getTodos']);
        Route::post('/todos', [TodoController::class, 'store']);
        Route::get('/todos/{id}', [TodoController::class, 'show']);
        Route::put('/todos/{id}', [TodoController::class, 'update']);
        Route::delete('/todos/{id}', [TodoController::class, 'destroy']);
        
        // Todo Attachments
        Route::post('/todos/{id}/attachments', [TodoController::class, 'uploadAttachment']);
        Route::get('/attachments/{id}/download', [TodoController::class, 'downloadAttachment'])->name('todo.download-attachment');
        Route::delete('/attachments/{id}', [TodoController::class, 'deleteAttachment']);
        
        // Todo Projects
        Route::get('/todo-projects', [TodoProjectController::class, 'getProjects']);
        Route::post('/todo-projects', [TodoProjectController::class, 'store']);
        Route::get('/todo-projects/{id}', [TodoProjectController::class, 'show']);
        Route::put('/todo-projects/{id}', [TodoProjectController::class, 'update']);
        Route::delete('/todo-projects/{id}', [TodoProjectController::class, 'destroy']);
        Route::post('/todo-projects/{id}/versions', [TodoProjectController::class, 'addVersion']);
    });
});
