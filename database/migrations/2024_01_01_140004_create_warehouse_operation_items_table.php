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
        Schema::create('warehouse_operation_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('operation_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('location_id')->nullable();
            
            // Quantities
            $table->decimal('quantity_expected', 15, 2);
            $table->decimal('quantity_processed', 15, 2)->default(0);
            $table->decimal('quantity_remaining', 15, 2)->default(0);
            
            // Item identification
            $table->string('lot_number')->nullable();
            $table->string('serial_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('batch_code')->nullable();
            
            // Status and tracking
            $table->enum('status', ['pending', 'in_progress', 'completed', 'partially_completed', 'failed'])->default('pending');
            $table->integer('sequence_number')->nullable(); // processing order
            
            // Quality information
            $table->enum('condition', ['good', 'damaged', 'expired', 'quarantine'])->default('good');
            $table->text('condition_notes')->nullable();
            
            // Processing details
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedBigInteger('processed_by')->nullable();
            
            // Location movement
            $table->unsignedBigInteger('from_location_id')->nullable();
            $table->unsignedBigInteger('to_location_id')->nullable();
            
            // Packaging information
            $table->string('package_type')->nullable(); // box, pallet, case
            $table->string('package_id')->nullable(); // tracking number
            $table->decimal('package_weight', 10, 2)->nullable(); // kg
            $table->json('package_dimensions')->nullable(); // {length, width, height}
            
            // Cost tracking
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->decimal('total_cost', 12, 2)->nullable();
            
            // Error tracking
            $table->boolean('has_discrepancy')->default(false);
            $table->text('discrepancy_reason')->nullable();
            $table->decimal('discrepancy_quantity', 15, 2)->nullable();
            
            $table->text('notes')->nullable();
            
            $table->timestamps();

            // Foreign keys
            $table->foreign('operation_id')->references('id')->on('warehouse_operations')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('location_id')->references('id')->on('warehouse_locations')->onDelete('set null');
            $table->foreign('from_location_id')->references('id')->on('warehouse_locations')->onDelete('set null');
            $table->foreign('to_location_id')->references('id')->on('warehouse_locations')->onDelete('set null');
            $table->foreign('processed_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index(['operation_id', 'status']);
            $table->index(['product_id', 'lot_number']);
            $table->index('serial_number');
            $table->index('expiry_date');
            $table->index('sequence_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warehouse_operation_items');
    }
};