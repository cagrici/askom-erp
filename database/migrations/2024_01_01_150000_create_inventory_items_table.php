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
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique();
            $table->string('barcode')->unique()->nullable();
            $table->string('internal_code')->nullable();
            $table->string('item_type')->default('product'); // product, raw_material, component, spare_part
            
            // Product reference
            $table->foreignId('product_id')->nullable()->constrained()->onDelete('cascade');
            
            // Basic information
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            
            // Physical attributes
            $table->decimal('weight', 10, 4)->nullable(); // kg
            $table->decimal('length', 10, 2)->nullable(); // cm
            $table->decimal('width', 10, 2)->nullable(); // cm
            $table->decimal('height', 10, 2)->nullable(); // cm
            $table->decimal('volume', 10, 4)->nullable(); // liters
            
            // Units and packaging
            $table->string('base_unit')->default('piece'); // piece, kg, meter, liter
            $table->string('purchase_unit')->default('piece');
            $table->string('sales_unit')->default('piece');
            $table->decimal('unit_conversion_factor', 10, 4)->default(1);
            
            // Inventory tracking
            $table->decimal('minimum_stock', 15, 4)->default(0);
            $table->decimal('maximum_stock', 15, 4)->default(0);
            $table->decimal('reorder_point', 15, 4)->default(0);
            $table->decimal('reorder_quantity', 15, 4)->default(0);
            $table->integer('lead_time_days')->default(0);
            
            // Lot tracking
            $table->boolean('lot_tracking_enabled')->default(false);
            $table->boolean('serial_number_tracking')->default(false);
            $table->boolean('expiry_tracking_enabled')->default(false);
            $table->integer('default_shelf_life_days')->nullable();
            
            // Storage requirements
            $table->string('temperature_requirement')->default('ambient'); // ambient, refrigerated, frozen, controlled
            $table->decimal('min_temperature', 5, 2)->nullable();
            $table->decimal('max_temperature', 5, 2)->nullable();
            $table->boolean('hazardous_material')->default(false);
            $table->json('storage_requirements')->nullable();
            
            // Valuation
            $table->string('valuation_method')->default('fifo'); // fifo, lifo, average, specific
            $table->decimal('standard_cost', 15, 4)->default(0);
            $table->decimal('average_cost', 15, 4)->default(0);
            $table->decimal('last_purchase_cost', 15, 4)->default(0);
            
            // Quality control
            $table->boolean('quality_check_required')->default(false);
            $table->json('quality_parameters')->nullable();
            $table->integer('quality_check_frequency_days')->nullable();
            
            // Status and flags
            $table->enum('status', ['active', 'inactive', 'discontinued', 'obsolete'])->default('active');
            $table->boolean('is_consumable')->default(false);
            $table->boolean('is_returnable')->default(true);
            $table->boolean('allow_negative_stock')->default(false);
            
            // ABC Analysis
            $table->string('abc_classification')->nullable(); // A, B, C
            $table->decimal('annual_consumption_value', 15, 2)->default(0);
            $table->integer('movement_frequency')->default(0);
            
            // Supplier information
            $table->json('suppliers')->nullable(); // Array of supplier IDs and details
            $table->string('preferred_supplier_sku')->nullable();
            
            // Tags and attributes
            $table->json('tags')->nullable();
            $table->json('custom_attributes')->nullable();
            
            // Images and documents
            $table->json('images')->nullable();
            $table->json('documents')->nullable();
            
            // Audit fields
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['status', 'item_type']);
            $table->index(['abc_classification']);
            $table->index(['lot_tracking_enabled']);
            $table->index(['expiry_tracking_enabled']);
            $table->index(['category']);
            $table->index(['brand']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};