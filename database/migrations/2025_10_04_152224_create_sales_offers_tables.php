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
        // Ana teklif tablosu
        Schema::create('sales_offers', function (Blueprint $table) {
            $table->id();
            $table->string('offer_no')->unique(); // TKL-2025-0001
            $table->date('offer_date');
            $table->date('valid_until_date');
            $table->enum('status', ['draft', 'sent', 'approved', 'rejected', 'converted_to_order', 'expired'])->default('draft');

            // Müşteri bilgileri - Cari veya Geçici
            $table->unsignedBigInteger('entity_id')->nullable()->comment('current_accounts.id');
            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();
            $table->string('customer_email')->nullable();
            $table->text('customer_address')->nullable();
            $table->string('customer_tax_no')->nullable();

            // Fiyat bilgileri
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_rate', 5, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(20); // KDV %20
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);

            // Para birimi
            $table->unsignedBigInteger('currency_id')->default(114);
            $table->decimal('exchange_rate', 15, 4)->default(1);

            // Notlar
            $table->text('notes')->nullable(); // İç notlar
            $table->text('customer_notes')->nullable(); // Müşteriye görünecek notlar
            $table->text('terms_conditions')->nullable(); // Şartlar ve koşullar

            // Onay ve dönüşüm bilgileri
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('sales_person_id')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejected_reason')->nullable();
            $table->unsignedBigInteger('converted_order_id')->nullable();
            $table->timestamp('converted_at')->nullable();
            $table->unsignedBigInteger('converted_by')->nullable();

            // Location bilgisi
            $table->unsignedBigInteger('location_id')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // İndeksler
            $table->index('offer_no');
            $table->index('status');
            $table->index('offer_date');
            $table->index('entity_id');
            $table->index('created_by');
        });

        // Teklif kalemleri tablosu
        Schema::create('sales_offer_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sales_offer_id');

            // Ürün bilgileri
            $table->unsignedBigInteger('product_id')->nullable();
            $table->string('product_name')->nullable(); // Manuel girilirse
            $table->string('product_code')->nullable();
            $table->text('description')->nullable();

            // Miktar ve birim
            $table->decimal('quantity', 15, 3)->default(1);
            $table->unsignedBigInteger('unit_id')->nullable();

            // Fiyat hesaplaması
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('discount_rate', 5, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(20);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);

            // Sıralama
            $table->integer('sort_order')->default(0);

            $table->timestamps();

            // İndeksler
            $table->index('sales_offer_id');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_offer_items');
        Schema::dropIfExists('sales_offers');
    }
};
