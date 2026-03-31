<?php

use App\Http\Controllers\Quality\QualityRequestController;
use Illuminate\Support\Facades\Route;

// Quality Module Routes
Route::middleware(['auth'])->group(function () {
    Route::resource('quality-requests', QualityRequestController::class);
    Route::post('quality-requests/{qualityRequest}/assign-users', [QualityRequestController::class, 'assignUsers'])
        ->name('quality-requests.assign-users');
});
