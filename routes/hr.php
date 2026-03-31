<?php

use App\Http\Controllers\EmployeeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| HR Routes
|--------------------------------------------------------------------------
|
| Routes for the Human Resources module
|
*/

Route::middleware(['auth'])->group(function () {
    // Employees
    Route::resource('employees', EmployeeController::class);
    
    // Future HR routes will go here
    // Leave Management, Payroll, Attendance, Performance Reviews, etc.
});
