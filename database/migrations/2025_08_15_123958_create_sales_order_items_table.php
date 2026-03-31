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
        Schema::create('sales_order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sales_order_id');
            $table->unsignedBigInteger('product_id');
            $table->integer('sort_order')->default(0);
            
            // Quantity and Pricing
            $table->decimal('quantity', 12, 3);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2);
            
            // Product Details (snapshot at order time)
            $table->string('product_code')->nullable();
            $table->string('product_name');
            $table->string('product_description')->nullable();
            $table->string('unit_of_measure')->nullable();
            
            // Delivery Information
            $table->date('requested_delivery_date')->nullable();
            $table->date('promised_delivery_date')->nullable();
            $table->date('actual_delivery_date')->nullable();
            $table->decimal('delivered_quantity', 12, 3)->default(0);
            $table->decimal('remaining_quantity', 12, 3)->default(0);
            
            // Status and Tracking
            $table->enum('status', [
                'pending', 'confirmed', 'in_production', 'ready', 
                'shipped', 'delivered', 'cancelled', 'returned'
            ])->default('pending');
            
            // Additional Information
            $table->text('notes')->nullable();
            $table->text('special_instructions')->nullable();
            $table->json('custom_fields')->nullable();
            
            // Manufacturing/Production Details
            $table->string('serial_numbers')->nullable();
            $table->string('lot_numbers')->nullable();
            $table->date('production_date')->nullable();
            $table->date('expiry_date')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign Key Constraints
            $table->foreign('sales_order_id')->references('id')->on('sales_orders')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
            
            // Indexes
            $table->index(['sales_order_id', 'sort_order']);
            $table->index(['product_id', 'status']);
            $table->index('status');
            $table->index('requested_delivery_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_order_items');
    }
};
