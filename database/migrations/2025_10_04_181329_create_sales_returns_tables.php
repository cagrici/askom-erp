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
        // Main returns table
        Schema::create('sales_returns', function (Blueprint $table) {
            $table->id();
            $table->string('return_no')->unique();
            $table->foreignId('sales_order_id')->constrained('sales_orders')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('current_accounts')->onDelete('cascade');
            $table->date('return_date');
            $table->enum('status', [
                'pending_approval',
                'approved',
                'rejected',
                'processing',
                'completed',
                'cancelled'
            ])->default('pending_approval');
            $table->enum('return_reason', [
                'damaged',
                'wrong_product',
                'quality_issue',
                'expired',
                'other'
            ]);
            $table->text('return_description')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->enum('refund_method', [
                'credit_note',
                'bank_transfer',
                'cash',
                'replacement'
            ])->nullable();

            // Approval tracking
            $table->foreignId('approved_by_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('rejected_by_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();

            // Pickup/delivery tracking
            $table->foreignId('driver_id')->nullable()->constrained('users')->onDelete('set null');
            $table->date('pickup_date')->nullable();
            $table->text('pickup_notes')->nullable();
            $table->timestamp('picked_up_at')->nullable();

            // Warehouse
            $table->text('warehouse_notes')->nullable();
            $table->foreignId('processed_by_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('processed_at')->nullable();

            // General
            $table->foreignId('created_by_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('set null');

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('return_no');
            $table->index('status');
            $table->index('return_date');
            $table->index('customer_id');
            $table->index('sales_order_id');
        });

        // Return items table
        Schema::create('sales_return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_return_id')->constrained('sales_returns')->onDelete('cascade');
            $table->foreignId('sales_order_item_id')->constrained('sales_order_items')->onDelete('cascade');
            $table->foreignId('product_id')->nullable()->constrained('products')->onDelete('set null');
            $table->string('product_name');
            $table->string('product_code')->nullable();
            $table->decimal('quantity_returned', 15, 3);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('line_total', 15, 2);
            $table->enum('condition', [
                'undamaged',
                'minor_damage',
                'major_damage',
                'unusable'
            ])->default('undamaged');
            $table->text('notes')->nullable();
            $table->integer('sort_order')->default(0);

            $table->timestamps();

            // Indexes
            $table->index('sales_return_id');
            $table->index('product_id');
        });

        // Return images table
        Schema::create('sales_return_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_return_id')->constrained('sales_returns')->onDelete('cascade');
            $table->foreignId('sales_return_item_id')->nullable()->constrained('sales_return_items')->onDelete('cascade');
            $table->string('image_path');
            $table->enum('image_type', [
                'return_request',
                'pickup_confirmation',
                'warehouse_inspection'
            ])->default('return_request');
            $table->foreignId('uploaded_by_id')->constrained('users')->onDelete('cascade');
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);

            $table->timestamps();

            // Indexes
            $table->index('sales_return_id');
            $table->index('sales_return_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_return_images');
        Schema::dropIfExists('sales_return_items');
        Schema::dropIfExists('sales_returns');
    }
};
