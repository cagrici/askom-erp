<?php

use App\Http\Controllers\News\NewsCategoryController;
use App\Http\Controllers\News\NewsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('news')->name('news.')->group(function () {
    // Blog ana sayfası
    Route::get('/', [NewsController::class, 'index'])->name('index');
    
    // Blog grid view
    Route::get('/grid', [NewsController::class, 'grid'])->name('grid');
    
    // Blog list view
    Route::get('/list', [NewsController::class, 'list'])->name('list');
    
    // Blog yazısı oluşturma ve düzenleme
    Route::get('/create', [NewsController::class, 'create'])->name('create');
    Route::post('/', [NewsController::class, 'store'])->name('store');
    Route::get('/{post}/edit', [NewsController::class, 'edit'])->name('edit');
    Route::put('/{post}', [NewsController::class, 'update'])->name('update');
    Route::delete('/{post}', [NewsController::class, 'destroy'])->name('destroy');
    
    // Yorum ekleme
    Route::post('/{post}/comments', [NewsController::class, 'addComment'])->name('comments.add');
    
    // Blog detay görünümü - En sona taşıdık
    Route::get('/{post}', [NewsController::class, 'show'])->name('show');
    
    // Kategoriler
    Route::prefix('categories')->name('categories.')->group(function () {
        Route::get('/', [NewsCategoryController::class, 'index'])->name('index');
        Route::get('/create', [NewsCategoryController::class, 'create'])->name('create');
        Route::post('/', [NewsCategoryController::class, 'store'])->name('store');
        Route::get('/{category}', [NewsCategoryController::class, 'show'])->name('show')->where('category', '[0-9]+');
        Route::get('/{category}/edit', [NewsCategoryController::class, 'edit'])->name('edit')->where('category', '[0-9]+');
        Route::put('/{category}', [NewsCategoryController::class, 'update'])->name('update')->where('category', '[0-9]+');
        Route::delete('/{category}', [NewsCategoryController::class, 'destroy'])->name('destroy')->where('category', '[0-9]+');
    });
});
