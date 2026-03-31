<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('warehouse_operations', function (Blueprint $table) {
            $table->id();
            $table->string('operation_number')->unique();
            $table->unsignedBigInteger('warehouse_id');
            
            // Operation details
            $table->enum('operation_type', [
                'receiving', 'putaway', 'picking', 'packing', 
                'shipping', 'cycle_count', 'replenishment', 
                'returns', 'transfer', 'adjustment'
            ]);
            
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->enum('status', [
                'created', 'assigned', 'in_progress', 'completed', 
                'cancelled', 'on_hold', 'failed'
            ])->default('created');
            
            // References
            $table->string('reference_type')->nullable(); // order, transfer, adjustment, etc.
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_number')->nullable();
            
            // Assignment information
            $table->unsignedBigInteger('assigned_to')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            // Operation details
            $table->text('description')->nullable();
            $table->json('instructions')->nullable(); // specific instructions
            $table->json('requirements')->nullable(); // equipment, certifications needed
            
            // Time tracking
            $table->timestamp('due_date')->nullable();
            $table->integer('estimated_duration')->nullable(); // minutes
            $table->integer('actual_duration')->nullable(); // minutes
            
            // Performance metrics
            $table->integer('items_processed')->default(0);
            $table->integer('items_total')->default(0);
            $table->decimal('accuracy_rate', 5, 2)->nullable(); // %
            $table->integer('error_count')->default(0);
            
            // Location information
            $table->unsignedBigInteger('from_location_id')->nullable();
            $table->unsignedBigInteger('to_location_id')->nullable();
            $table->json('location_sequence')->nullable(); // ordered list of locations
            
            // Equipment and resources
            $table->json('equipment_used')->nullable(); // ['forklift_01', 'scanner_05']
            $table->json('consumables_used')->nullable(); // packaging materials, labels
            
            // Quality control
            $table->boolean('quality_check_required')->default(false);
            $table->unsignedBigInteger('quality_checked_by')->nullable();
            $table->timestamp('quality_checked_at')->nullable();
            $table->json('quality_issues')->nullable();
            
            // Notes and comments
            $table->text('notes')->nullable();
            $table->text('completion_notes')->nullable();
            $table->text('issues_encountered')->nullable();
            
            // Audit fields
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('warehouse_id')->references('id')->on('warehouses')->onDelete('cascade');
            $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
            $table->foreign('from_location_id')->references('id')->on('warehouse_locations')->onDelete('set null');
            $table->foreign('to_location_id')->references('id')->on('warehouse_locations')->onDelete('set null');
            $table->foreign('quality_checked_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index(['warehouse_id', 'operation_type']);
            $table->index(['status', 'priority']);
            $table->index(['assigned_to', 'status']);
            $table->index(['reference_type', 'reference_id']);
            $table->index('due_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warehouse_operations');
    }
};