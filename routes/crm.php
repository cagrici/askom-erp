<?php

use App\Http\Controllers\Crm\LeadController;
use App\Http\Controllers\Crm\LeadStageController;
use App\Http\Controllers\Crm\LeadSourceController;
use App\Http\Controllers\Crm\PipelineController;
use App\Http\Controllers\Crm\PipelineStageController;
use App\Http\Controllers\Crm\CrmActivityController;
use App\Http\Controllers\Crm\CrmTaskController;
use App\Http\Controllers\Crm\CrmDashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('crm')->name('crm.')->group(function () {

    // CRM Dashboard
    Route::get('/dashboard', [CrmDashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/stats', [CrmDashboardController::class, 'stats'])->name('dashboard.stats');
    Route::get('/dashboard/funnel', [CrmDashboardController::class, 'funnel'])->name('dashboard.funnel');

    // Leads
    Route::prefix('leads')->name('leads.')->group(function () {
        Route::get('/', [LeadController::class, 'index'])->middleware('permission:crm.leads.view')->name('index');
        Route::get('/kanban', [LeadController::class, 'kanban'])->middleware('permission:crm.leads.view')->name('kanban');
        Route::get('/create', [LeadController::class, 'create'])->middleware('permission:crm.leads.create')->name('create');
        Route::post('/', [LeadController::class, 'store'])->middleware('permission:crm.leads.create')->name('store');

        // Search endpoints
        Route::get('/search', [LeadController::class, 'search'])->middleware('permission:crm.leads.view')->name('search');
        Route::get('/stages', [LeadController::class, 'getStages'])->middleware('permission:crm.leads.view')->name('stages');
        Route::get('/sources', [LeadController::class, 'getSources'])->middleware('permission:crm.leads.view')->name('sources');

        // Parameterized routes
        Route::get('/{lead}', [LeadController::class, 'show'])->middleware('permission:crm.leads.view')->name('show');
        Route::get('/{lead}/edit', [LeadController::class, 'edit'])->middleware('permission:crm.leads.edit')->name('edit');
        Route::put('/{lead}', [LeadController::class, 'update'])->middleware('permission:crm.leads.edit')->name('update');
        Route::delete('/{lead}', [LeadController::class, 'destroy'])->middleware('permission:crm.leads.delete')->name('destroy');

        // Stage management
        Route::patch('/{lead}/stage', [LeadController::class, 'updateStage'])->middleware('permission:crm.leads.edit')->name('update-stage');

        // Lead conversion
        Route::get('/{lead}/convert', [LeadController::class, 'showConvert'])->middleware('permission:crm.leads.convert')->name('convert.show');
        Route::post('/{lead}/convert', [LeadController::class, 'convert'])->middleware('permission:crm.leads.convert')->name('convert');

        // Timeline
        Route::get('/{lead}/timeline', [LeadController::class, 'timeline'])->middleware('permission:crm.leads.view')->name('timeline');

        // Activities for lead
        Route::get('/{lead}/activities', [LeadController::class, 'activities'])->middleware('permission:crm.activities.view')->name('activities');
        Route::post('/{lead}/activities', [LeadController::class, 'storeActivity'])->middleware('permission:crm.activities.create')->name('activities.store');

        // Tasks for lead
        Route::get('/{lead}/tasks', [LeadController::class, 'tasks'])->middleware('permission:crm.tasks.view')->name('tasks');
        Route::post('/{lead}/tasks', [LeadController::class, 'storeTask'])->middleware('permission:crm.tasks.create')->name('tasks.store');
    });

    // Pipeline (SalesOffer Kanban)
    Route::prefix('pipeline')->name('pipeline.')->group(function () {
        Route::get('/', [PipelineController::class, 'index'])->middleware('permission:crm.pipeline.view')->name('index');
        Route::get('/summary', [PipelineController::class, 'summary'])->middleware('permission:crm.pipeline.view')->name('summary');
        Route::patch('/{salesOffer}/stage', [PipelineController::class, 'updateStage'])->middleware('permission:crm.pipeline.manage')->name('update-stage');
    });

    // Activities
    Route::prefix('activities')->name('activities.')->group(function () {
        Route::get('/', [CrmActivityController::class, 'index'])->middleware('permission:crm.activities.view')->name('index');
        Route::get('/calendar', [CrmActivityController::class, 'calendar'])->middleware('permission:crm.activities.view')->name('calendar');
        Route::post('/', [CrmActivityController::class, 'store'])->middleware('permission:crm.activities.create')->name('store');
        Route::get('/upcoming', [CrmActivityController::class, 'upcoming'])->middleware('permission:crm.activities.view')->name('upcoming');
        Route::get('/recent', [CrmActivityController::class, 'recent'])->middleware('permission:crm.activities.view')->name('recent');

        Route::get('/{activity}', [CrmActivityController::class, 'show'])->middleware('permission:crm.activities.view')->name('show');
        Route::put('/{activity}', [CrmActivityController::class, 'update'])->middleware('permission:crm.activities.edit')->name('update');
        Route::delete('/{activity}', [CrmActivityController::class, 'destroy'])->middleware('permission:crm.activities.delete')->name('destroy');
    });

    // Tasks
    Route::prefix('tasks')->name('tasks.')->group(function () {
        Route::get('/', [CrmTaskController::class, 'index'])->middleware('permission:crm.tasks.view')->name('index');
        Route::post('/', [CrmTaskController::class, 'store'])->middleware('permission:crm.tasks.create')->name('store');
        Route::get('/my', [CrmTaskController::class, 'myTasks'])->middleware('permission:crm.tasks.view')->name('my');
        Route::get('/overdue', [CrmTaskController::class, 'overdue'])->middleware('permission:crm.tasks.view')->name('overdue');
        Route::get('/due-today', [CrmTaskController::class, 'dueToday'])->middleware('permission:crm.tasks.view')->name('due-today');

        Route::get('/{task}', [CrmTaskController::class, 'show'])->middleware('permission:crm.tasks.view')->name('show');
        Route::put('/{task}', [CrmTaskController::class, 'update'])->middleware('permission:crm.tasks.edit')->name('update');
        Route::delete('/{task}', [CrmTaskController::class, 'destroy'])->middleware('permission:crm.tasks.delete')->name('destroy');
        Route::patch('/{task}/complete', [CrmTaskController::class, 'complete'])->middleware('permission:crm.tasks.edit')->name('complete');
        Route::patch('/{task}/start', [CrmTaskController::class, 'start'])->middleware('permission:crm.tasks.edit')->name('start');
    });
});

// Admin CRM Settings
Route::middleware(['auth'])->prefix('admin/crm')->name('admin.crm.')->group(function () {

    // Lead Stages
    Route::prefix('lead-stages')->name('lead-stages.')->group(function () {
        Route::get('/', [LeadStageController::class, 'index'])->middleware('permission:crm.settings.lead_stages')->name('index');
        Route::post('/', [LeadStageController::class, 'store'])->middleware('permission:crm.settings.lead_stages')->name('store');
        Route::put('/{stage}', [LeadStageController::class, 'update'])->middleware('permission:crm.settings.lead_stages')->name('update');
        Route::delete('/{stage}', [LeadStageController::class, 'destroy'])->middleware('permission:crm.settings.lead_stages')->name('destroy');
        Route::patch('/reorder', [LeadStageController::class, 'reorder'])->middleware('permission:crm.settings.lead_stages')->name('reorder');
    });

    // Lead Sources
    Route::prefix('lead-sources')->name('lead-sources.')->group(function () {
        Route::get('/', [LeadSourceController::class, 'index'])->middleware('permission:crm.settings.lead_sources')->name('index');
        Route::post('/', [LeadSourceController::class, 'store'])->middleware('permission:crm.settings.lead_sources')->name('store');
        Route::put('/{source}', [LeadSourceController::class, 'update'])->middleware('permission:crm.settings.lead_sources')->name('update');
        Route::delete('/{source}', [LeadSourceController::class, 'destroy'])->middleware('permission:crm.settings.lead_sources')->name('destroy');
        Route::patch('/reorder', [LeadSourceController::class, 'reorder'])->middleware('permission:crm.settings.lead_sources')->name('reorder');
    });

    // Pipeline Stages
    Route::prefix('pipeline-stages')->name('pipeline-stages.')->group(function () {
        Route::get('/', [PipelineStageController::class, 'index'])->middleware('permission:crm.settings.pipeline_stages')->name('index');
        Route::post('/', [PipelineStageController::class, 'store'])->middleware('permission:crm.settings.pipeline_stages')->name('store');
        Route::put('/{stage}', [PipelineStageController::class, 'update'])->middleware('permission:crm.settings.pipeline_stages')->name('update');
        Route::delete('/{stage}', [PipelineStageController::class, 'destroy'])->middleware('permission:crm.settings.pipeline_stages')->name('destroy');
        Route::patch('/reorder', [PipelineStageController::class, 'reorder'])->middleware('permission:crm.settings.pipeline_stages')->name('reorder');
    });
});
