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
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->date('order_date');
            $table->date('delivery_date')->nullable();
            $table->date('requested_delivery_date')->nullable();
            
            // Customer and Sales Representative
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('salesperson_id')->nullable();
            $table->unsignedBigInteger('created_by_id');
            
            // Order Details
            $table->enum('status', [
                'draft', 'confirmed', 'in_production', 'ready_to_ship', 
                'shipped', 'delivered', 'cancelled', 'returned'
            ])->default('draft');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->integer('payment_term_days')->default(30);
            $table->enum('payment_method', ['cash', 'bank_transfer', 'credit_card', 'check', 'other'])->default('bank_transfer');
            
            // Financial Information
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('shipping_cost', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('currency', 3)->default('TRY');
            $table->decimal('exchange_rate', 10, 4)->default(1);
            
            // Addresses
            $table->json('billing_address')->nullable();
            $table->json('shipping_address')->nullable();
            
            // Additional Information
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();
            $table->text('terms_and_conditions')->nullable();
            $table->json('custom_fields')->nullable();
            $table->string('reference_number')->nullable();
            $table->string('external_order_number')->nullable();
            
            // Tracking
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->unsignedBigInteger('cancelled_by_id')->nullable();
            $table->text('cancellation_reason')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign Key Constraints
            $table->foreign('customer_id')->references('id')->on('current_accounts')->onDelete('restrict');
            $table->foreign('salesperson_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('created_by_id')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('cancelled_by_id')->references('id')->on('users')->onDelete('set null');
            
            // Indexes
            $table->index(['status', 'order_date']);
            $table->index(['customer_id', 'order_date']);
            $table->index(['salesperson_id', 'order_date']);
            $table->index('order_date');
            $table->index('delivery_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_orders');
    }
};
