<?php

use App\Http\Controllers\SupportTicket\SupportTicketController;
use Illuminate\Support\Facades\Route;

// Support Tickets Routes
Route::middleware(['auth'])->group(function () {
    Route::resource('support-tickets', SupportTicketController::class);
    Route::post('support-tickets/{ticket}/assign-users', [SupportTicketController::class, 'assignUsers'])->name('support-tickets.assign-users');
});
