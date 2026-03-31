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
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->string('movement_number')->unique();
            
            // Item and stock reference
            $table->foreignId('inventory_item_id')->constrained()->onDelete('cascade');
            $table->foreignId('inventory_stock_id')->nullable()->constrained()->onDelete('set null');
            
            // Movement type and direction
            $table->enum('movement_type', [
                'receipt', 'issue', 'transfer', 'adjustment', 'return',
                'production_consume', 'production_output', 'cycle_count',
                'damage', 'loss', 'found', 'scrap', 'sample'
            ]);
            $table->enum('direction', ['in', 'out', 'transfer']); // in: increases stock, out: decreases stock
            
            // Warehouse and location information
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->foreignId('warehouse_location_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('from_warehouse_id')->nullable()->constrained('warehouses')->onDelete('set null');
            $table->foreignId('from_location_id')->nullable()->constrained('warehouse_locations')->onDelete('set null');
            $table->foreignId('to_warehouse_id')->nullable()->constrained('warehouses')->onDelete('set null');
            $table->foreignId('to_location_id')->nullable()->constrained('warehouse_locations')->onDelete('set null');
            
            // Quantity and unit information
            $table->decimal('quantity', 15, 4);
            $table->string('unit');
            $table->decimal('base_quantity', 15, 4); // Converted to base unit
            
            // Lot and batch tracking
            $table->string('lot_number')->nullable();
            $table->string('batch_code')->nullable();
            $table->string('serial_number')->nullable();
            
            // Cost information
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('total_cost', 15, 4)->default(0);
            $table->string('cost_currency', 3)->default('TRY');
            
            // Date and time tracking
            $table->timestamp('movement_date');
            $table->timestamp('effective_date')->nullable(); // When movement takes effect
            $table->date('expiry_date')->nullable();
            
            // Reference information
            $table->string('reference_type')->nullable(); // order, production, transfer, etc.
            $table->string('reference_number')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('external_reference')->nullable();
            
            // Document information
            $table->string('document_type')->nullable(); // invoice, receipt, delivery_note, etc.
            $table->string('document_number')->nullable();
            $table->date('document_date')->nullable();
            
            // Supplier/Customer information
            $table->string('partner_type')->nullable(); // supplier, customer, internal
            $table->string('partner_name')->nullable();
            $table->unsignedBigInteger('partner_id')->nullable();
            
            // Quality and condition
            $table->string('condition_before')->nullable();
            $table->string('condition_after')->nullable();
            $table->boolean('quality_check_done')->default(false);
            $table->json('quality_results')->nullable();
            
            // Package and container information
            $table->string('package_type')->nullable();
            $table->string('package_id')->nullable();
            $table->decimal('package_weight', 10, 4)->nullable();
            $table->string('container_number')->nullable();
            
            // Reason and approval
            $table->string('reason_code')->nullable();
            $table->text('reason_description')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('requires_approval')->default(false);
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_notes')->nullable();
            
            // Stock levels after movement
            $table->decimal('stock_before', 15, 4)->default(0);
            $table->decimal('stock_after', 15, 4)->default(0);
            
            // System information
            $table->boolean('is_system_generated')->default(false);
            $table->string('source_system')->nullable();
            $table->boolean('is_reversed')->default(false);
            $table->foreignId('reversed_by_movement_id')->nullable()->constrained('inventory_movements')->onDelete('set null');
            
            // Barcode scan information
            $table->string('scanned_barcode')->nullable();
            $table->timestamp('scan_timestamp')->nullable();
            $table->string('scanner_device')->nullable();
            
            // Temperature tracking
            $table->decimal('temperature_at_movement', 5, 2)->nullable();
            $table->boolean('temperature_compliant')->nullable();
            
            // Custom fields
            $table->json('custom_attributes')->nullable();
            
            // Status
            $table->enum('status', ['draft', 'pending', 'completed', 'cancelled', 'error'])->default('completed');
            $table->text('error_message')->nullable();
            
            // Audit fields
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['inventory_item_id', 'movement_date']);
            $table->index(['warehouse_id', 'movement_date']);
            $table->index(['movement_type', 'direction']);
            $table->index(['reference_type', 'reference_number']);
            $table->index(['lot_number']);
            $table->index(['serial_number']);
            $table->index(['movement_date']);
            $table->index(['created_by']);
            $table->index(['approval_status']);
            $table->index(['is_reversed']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};