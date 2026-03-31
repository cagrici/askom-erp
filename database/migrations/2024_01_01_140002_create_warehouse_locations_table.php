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
        Schema::create('warehouse_locations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('warehouse_id');
            $table->unsignedBigInteger('zone_id');
            
            // Location identification
            $table->string('code'); // e.g., A01-01-01 (Aisle-Rack-Shelf)
            $table->string('barcode')->nullable();
            $table->string('name')->nullable();
            $table->text('description')->nullable();
            
            // Hierarchical structure
            $table->string('aisle')->nullable(); // A01, B02, etc.
            $table->string('rack')->nullable(); // 01, 02, etc.
            $table->string('shelf')->nullable(); // 01, 02, etc.
            $table->string('bin')->nullable(); // A, B, C, etc.
            $table->integer('level')->nullable(); // floor level within rack
            
            // Location type and purpose
            $table->enum('location_type', [
                'bin', 'shelf', 'rack', 'floor', 'bulk', 
                'pick_face', 'reserve', 'staging', 'dock'
            ])->default('bin');
            
            // Physical specifications
            $table->decimal('length', 8, 2)->nullable(); // cm
            $table->decimal('width', 8, 2)->nullable(); // cm
            $table->decimal('height', 8, 2)->nullable(); // cm
            $table->decimal('volume', 10, 3)->nullable(); // m³
            $table->decimal('max_weight', 10, 2)->nullable(); // kg
            
            // Capacity and usage
            $table->integer('max_items')->default(1);
            $table->integer('current_items')->default(0);
            $table->decimal('utilization_percentage', 5, 2)->default(0); // %
            
            // Location properties
            $table->boolean('multi_sku')->default(false); // can hold multiple SKUs
            $table->boolean('pick_location')->default(true); // used for picking
            $table->boolean('replenishment_location')->default(false); // reserve storage
            $table->boolean('is_checkdigit_enabled')->default(false);
            
            // Restrictions and rules
            $table->json('product_restrictions')->nullable(); // allowed categories, hazmat, etc.
            $table->json('size_restrictions')->nullable(); // min/max dimensions
            $table->json('weight_restrictions')->nullable(); // min/max weight
            
            // Picking optimization
            $table->integer('pick_sequence')->nullable(); // picking route optimization
            $table->decimal('travel_time', 5, 2)->nullable(); // seconds from dock
            $table->boolean('cycle_count_required')->default(false);
            $table->date('last_cycle_count')->nullable();
            
            // Status and flags
            $table->enum('status', ['active', 'inactive', 'blocked', 'maintenance', 'damaged'])->default('active');
            $table->boolean('is_occupied')->default(false);
            $table->boolean('is_reserved')->default(false);
            $table->timestamp('reserved_until')->nullable();
            $table->unsignedBigInteger('reserved_by')->nullable();
            
            // Environmental conditions
            $table->decimal('temperature', 5, 2)->nullable(); // °C
            $table->decimal('humidity', 5, 2)->nullable(); // %
            
            // Audit fields
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('warehouse_id')->references('id')->on('warehouses')->onDelete('cascade');
            $table->foreign('zone_id')->references('id')->on('warehouse_zones')->onDelete('cascade');
            $table->foreign('reserved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->unique(['warehouse_id', 'code']);
            $table->index(['warehouse_id', 'zone_id']);
            $table->index(['status', 'is_occupied']);
            $table->index(['location_type', 'pick_location']);
            $table->index('barcode');
            $table->index('pick_sequence');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warehouse_locations');
    }
};