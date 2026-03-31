<?php

use App\Http\Controllers\FileManager\FileManagerController;
use App\Http\Controllers\FileManager\FileManagerApiController;
use Illuminate\Support\Facades\Route;

// Web Routes
Route::middleware(['auth'])->group(function () {
    // Main file manager page - already handled by VelzonRoutesController
    // Route::get('/apps-file-manager', [FileManagerController::class, 'index'])->name('file-manager.index');
    
    // File operations
    Route::get('/file-manager/files', [FileManagerController::class, 'getFiles'])->name('file-manager.get-files');
    Route::get('/file-manager/file/{file}', [FileManagerController::class, 'getFileDetails'])->name('file-manager.file-details');
    Route::post('/file-manager/file/upload', [FileManagerController::class, 'uploadFile'])->name('file-manager.upload-file');
    Route::put('/file-manager/file/{file}', [FileManagerController::class, 'updateFile'])->name('file-manager.update-file');
    Route::delete('/file-manager/file/{file}', [FileManagerController::class, 'deleteFile'])->name('file-manager.delete-file');
    Route::get('/file-manager/file/{file}/download', [FileManagerController::class, 'downloadFile'])->name('file-manager.download-file');
    Route::post('/file-manager/file/{file}/favorite', [FileManagerController::class, 'toggleFavorite'])->name('file-manager.toggle-favorite');
    Route::post('/file-manager/file/{file}/public', [FileManagerController::class, 'togglePublic'])->name('file-manager.toggle-public');
    Route::post('/file-manager/file/{file}/move', [FileManagerController::class, 'moveFile'])->name('file-manager.move-file');
    
    // Folder operations
    Route::get('/file-manager/folders', [FileManagerController::class, 'getFolders'])->name('file-manager.get-folders');
    Route::post('/file-manager/folder', [FileManagerController::class, 'createFolder'])->name('file-manager.create-folder');
    Route::put('/file-manager/folder/{folder}', [FileManagerController::class, 'updateFolder'])->name('file-manager.update-folder');
    Route::delete('/file-manager/folder/{folder}', [FileManagerController::class, 'deleteFolder'])->name('file-manager.delete-folder');
    Route::post('/file-manager/folder/{folder}/move', [FileManagerController::class, 'moveFolder'])->name('file-manager.move-folder');
    
    // Other operations
    Route::get('/file-manager/search', [FileManagerController::class, 'search'])->name('file-manager.search');
    Route::get('/file-manager/storage-stats', [FileManagerController::class, 'getStorageStats'])->name('file-manager.storage-stats');
});

// Test route
Route::middleware(['auth'])->get('/file-manager-test', [\App\Http\Controllers\FileManager\FileManagerTestController::class, 'testApi'])->name('file-manager.test');

// API Routes for the Redux integration
Route::middleware(['auth'])->prefix('api/file-manager')->group(function () {
    Route::get('/folders', [FileManagerApiController::class, 'getFolders']);
    Route::get('/files', [FileManagerApiController::class, 'getFiles']);
    Route::post('/folder', [FileManagerApiController::class, 'addNewFolder']);
    Route::put('/folder', [FileManagerApiController::class, 'updateFolder']);
    Route::delete('/folder/{id}', [FileManagerApiController::class, 'deleteFolder']);
    Route::post('/file', [FileManagerApiController::class, 'addNewFile']);
    Route::put('/file', [FileManagerApiController::class, 'updateFile']);
    Route::delete('/file/{id}', [FileManagerApiController::class, 'deleteFile']);
    Route::post('/file/upload', [FileManagerApiController::class, 'uploadFile']);
    Route::get('/storage-stats', [FileManagerApiController::class, 'getStorageStats']);
});
