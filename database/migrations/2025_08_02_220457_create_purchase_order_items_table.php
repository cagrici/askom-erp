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
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->onDelete('cascade');
            $table->foreignId('purchase_request_item_id')->nullable()->constrained('purchase_request_items')->onDelete('set null');
            $table->foreignId('product_id')->nullable()->constrained('products')->onDelete('set null');
            
            // Item details
            $table->string('item_code')->nullable();
            $table->string('item_name');
            $table->text('description')->nullable();
            $table->text('specifications')->nullable();
            
            // Quantities
            $table->decimal('ordered_quantity', 12, 4);
            $table->decimal('received_quantity', 12, 4)->default(0);
            $table->decimal('remaining_quantity', 12, 4)->default(0);
            $table->foreignId('unit_id')->nullable()->constrained('units')->onDelete('set null');
            $table->string('unit_name')->nullable();
            
            // Pricing
            $table->decimal('unit_price', 12, 4);
            $table->decimal('total_price', 15, 4);
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->decimal('discount_amount', 12, 4)->default(0);
            $table->decimal('net_price', 15, 4);
            $table->string('currency', 3)->default('TRY');
            
            // Status and dates
            $table->enum('status', ['pending', 'confirmed', 'partially_received', 'received', 'cancelled'])->default('pending');
            $table->date('delivery_date')->nullable();
            
            // Additional fields
            $table->text('notes')->nullable();
            $table->string('supplier_item_code')->nullable();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->integer('sort_order')->default(0);
            
            $table->timestamps();
            
            // Indexes
            $table->index(['purchase_order_id', 'status']);
            $table->index(['product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_order_items');
    }
};
