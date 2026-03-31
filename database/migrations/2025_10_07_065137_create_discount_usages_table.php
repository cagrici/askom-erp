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
        Schema::create('discount_usages', function (Blueprint $table) {
            $table->id();

            // Relations
            $table->foreignId('discount_id')->constrained('discounts')->cascadeOnDelete();
            $table->foreignId('sales_order_id')->nullable()->constrained('sales_orders')->nullOnDelete();
            $table->foreignId('customer_id')->constrained('current_accounts')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete()->comment('İşlemi Yapan Kullanıcı');

            // Usage Details
            $table->decimal('order_amount', 15, 2)->comment('Sipariş Tutarı');
            $table->decimal('discount_amount', 15, 2)->comment('İskonto Tutarı');
            $table->string('discount_type', 50)->comment('İskonto Türü');
            $table->integer('quantity')->nullable()->comment('Ürün Adedi');

            // Metadata
            $table->json('applied_products')->nullable()->comment('İskontonu Uygulandığı Ürünler (JSON)');
            $table->text('notes')->nullable()->comment('Notlar');

            $table->timestamps();

            // Indexes
            $table->index('discount_id');
            $table->index('sales_order_id');
            $table->index('customer_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discount_usages');
    }
};
