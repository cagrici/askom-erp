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
        Schema::create('inventory_stocks', function (Blueprint $table) {
            $table->id();
            
            // Item and location reference
            $table->foreignId('inventory_item_id')->constrained()->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->foreignId('warehouse_location_id')->nullable()->constrained()->onDelete('set null');
            
            // Lot and batch information
            $table->string('lot_number')->nullable();
            $table->string('batch_code')->nullable();
            $table->string('serial_number')->nullable();
            
            // Quantity tracking
            $table->decimal('quantity_on_hand', 15, 4)->default(0);
            $table->decimal('quantity_allocated', 15, 4)->default(0); // Reserved for orders
            $table->decimal('quantity_available', 15, 4)->default(0); // On hand - allocated
            $table->decimal('quantity_in_transit', 15, 4)->default(0);
            $table->decimal('quantity_on_order', 15, 4)->default(0);
            
            // Cost tracking
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('total_cost', 15, 4)->default(0);
            $table->string('cost_currency', 3)->default('TRY');
            
            // Date tracking
            $table->date('received_date')->nullable();
            $table->date('manufactured_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->date('best_before_date')->nullable();
            $table->date('last_counted_date')->nullable();
            
            // Quality and condition
            $table->string('condition')->default('good'); // good, damaged, expired, quarantine, returned
            $table->text('condition_notes')->nullable();
            $table->boolean('quality_approved')->default(true);
            $table->json('quality_test_results')->nullable();
            
            // Physical attributes at stock level
            $table->decimal('actual_weight', 10, 4)->nullable();
            $table->decimal('package_weight', 10, 4)->nullable();
            $table->string('package_type')->nullable();
            $table->string('package_dimensions')->nullable();
            
            // Supplier information
            $table->string('supplier_name')->nullable();
            $table->string('supplier_invoice_number')->nullable();
            $table->string('purchase_order_number')->nullable();
            
            // Valuation
            $table->string('valuation_method')->default('fifo');
            $table->decimal('fifo_cost', 15, 4)->default(0);
            $table->decimal('average_cost', 15, 4)->default(0);
            $table->json('cost_layers')->nullable(); // For FIFO/LIFO tracking
            
            // Movement tracking
            $table->integer('movement_count')->default(0);
            $table->timestamp('last_movement_date')->nullable();
            $table->string('last_movement_type')->nullable();
            
            // Cycle counting
            $table->boolean('cycle_count_required')->default(false);
            $table->date('next_cycle_count_date')->nullable();
            $table->integer('cycle_count_variance')->default(0);
            
            // Status and flags
            $table->enum('status', ['active', 'hold', 'quarantine', 'blocked', 'obsolete'])->default('active');
            $table->boolean('is_locked')->default(false); // Prevent movements
            $table->string('lock_reason')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->foreignId('locked_by')->nullable()->constrained('users')->onDelete('set null');
            
            // Temperature monitoring
            $table->decimal('current_temperature', 5, 2)->nullable();
            $table->decimal('min_recorded_temperature', 5, 2)->nullable();
            $table->decimal('max_recorded_temperature', 5, 2)->nullable();
            $table->timestamp('temperature_last_checked')->nullable();
            
            // Reference numbers
            $table->string('reference_number')->nullable();
            $table->json('custom_fields')->nullable();
            $table->text('notes')->nullable();
            
            // Audit fields
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // Unique constraints
            $table->unique(['inventory_item_id', 'warehouse_id', 'warehouse_location_id', 'lot_number', 'serial_number'], 'unique_stock_record');
            
            // Indexes
            $table->index(['warehouse_id', 'inventory_item_id']);
            $table->index(['lot_number']);
            $table->index(['serial_number']);
            $table->index(['expiry_date']);
            $table->index(['condition']);
            $table->index(['status']);
            $table->index(['cycle_count_required']);
            $table->index(['last_movement_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_stocks');
    }
};