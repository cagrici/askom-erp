<?php

use App\Http\Controllers\QuoteApprovalController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('onay-fatura-teklif')->name('quote-approvals.')->group(function () {
    Route::get('/', [QuoteApprovalController::class, 'index'])->name('index');
    Route::get('/pending', [QuoteApprovalController::class, 'pendingQuotes'])->name('pending');
    Route::get('/pending/api', [QuoteApprovalController::class, 'pendingApi'])->name('pending.api');
    Route::get('/quote/{quote}', [QuoteApprovalController::class, 'show'])->name('show');
    Route::post('/quote/{quote}/approve', [QuoteApprovalController::class, 'approve'])->name('approve');
    Route::post('/quote/{quote}/reject', [QuoteApprovalController::class, 'reject'])->name('reject');
    Route::get('/history', [QuoteApprovalController::class, 'history'])->name('history');
    Route::get('/history/api', [QuoteApprovalController::class, 'historyApi'])->name('history.api');
    Route::get('/history/{quote}', [QuoteApprovalController::class, 'historyDetail'])->name('history.detail');
    
    // Customer Analysis
    Route::get('/cari-analiz', [QuoteApprovalController::class, 'customerAnalysis'])->name('customer-analysis');
    Route::get('/cari-analiz/search', [QuoteApprovalController::class, 'searchCustomers'])->name('customer-search');
    Route::get('/cari-analiz/{entity}', [QuoteApprovalController::class, 'getCustomerAnalytics'])->name('customer-analytics');
    Route::get('/cari-analiz/{entity}/monthly-data', [QuoteApprovalController::class, 'getMonthlyData']);
    
    // API routes for modal data
    Route::get('/api/invoice/{id}/detail', [QuoteApprovalController::class, 'getInvoiceDetail'])->name('invoice.detail');
    Route::get('/api/offer/{id}/detail', [QuoteApprovalController::class, 'getOfferDetail'])->name('offer.detail');
    Route::get('/api/entity/{id}/invoices', [QuoteApprovalController::class, 'getEntityInvoices'])->name('entity.invoices');
    
    // API routes for approve/reject actions
    Route::post('/api/invoice/{id}/approve', [QuoteApprovalController::class, 'approveInvoice'])->name('invoice.approve');
    Route::post('/api/invoice/{id}/reject', [QuoteApprovalController::class, 'rejectInvoice'])->name('invoice.reject');
    Route::post('/api/offer/{id}/approve', [QuoteApprovalController::class, 'approveOffer'])->name('offer.approve');
    Route::post('/api/offer/{id}/reject', [QuoteApprovalController::class, 'rejectOffer'])->name('offer.reject');
});
