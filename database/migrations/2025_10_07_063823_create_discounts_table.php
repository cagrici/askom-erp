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
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();

            // Basic Information
            $table->string('name')->comment('İskonto Adı');
            $table->string('code', 50)->unique()->comment('İskonto Kodu (Unique)');
            $table->text('description')->nullable()->comment('İskonto Açıklaması');

            // Discount Type
            $table->enum('type', [
                'customer',    // Müşteriye Özel İskonto
                'product',     // Ürüne Özel İskonto
                'quantity',    // Miktara Dayalı İskonto
                'cash',        // Nakit İskonto
                'general',     // Genel İskonto
                'category',    // Kategoriye Özel İskonto
            ])->comment('İskonto Türü');

            // Calculation Type
            $table->enum('calculation_type', [
                'percentage',   // Yüzde
                'fixed_amount', // Sabit Tutar
            ])->comment('Hesaplama Türü');

            // Discount Value
            $table->decimal('discount_value', 15, 2)->comment('İskonto Değeri (% veya Tutar)');
            $table->decimal('min_purchase_amount', 15, 2)->nullable()->comment('Minimum Alışveriş Tutarı');
            $table->decimal('max_discount_amount', 15, 2)->nullable()->comment('Maksimum İskonto Tutarı');

            // Validity Period
            $table->dateTime('start_date')->nullable()->comment('Başlangıç Tarihi');
            $table->dateTime('end_date')->nullable()->comment('Bitiş Tarihi');
            $table->boolean('is_active')->default(true)->comment('Aktif mi?');

            // Quantity-Based Discount Configuration
            $table->json('quantity_tiers')->nullable()->comment('Miktar Basamakları (JSON): [{min_qty: 10, max_qty: 50, discount: 5}, ...]');

            // Target Filters
            $table->json('customer_ids')->nullable()->comment('Geçerli Müşteri ID\'leri (JSON)');
            $table->json('customer_group_ids')->nullable()->comment('Geçerli Müşteri Grup ID\'leri (JSON)');
            $table->json('product_ids')->nullable()->comment('Geçerli Ürün ID\'leri (JSON)');
            $table->json('category_ids')->nullable()->comment('Geçerli Kategori ID\'leri (JSON)');
            $table->json('excluded_product_ids')->nullable()->comment('Hariç Tutulan Ürün ID\'leri (JSON)');
            $table->json('excluded_category_ids')->nullable()->comment('Hariç Tutulan Kategori ID\'leri (JSON)');

            // Priority & Combining Rules
            $table->integer('priority')->default(0)->comment('Öncelik (Yüksek önce uygulanır)');
            $table->boolean('can_combine')->default(false)->comment('Diğer İskontolarla Birleştirilebilir mi?');
            $table->boolean('applies_to_discounted_products')->default(true)->comment('İndirimli Ürünlere Uygulanır mı?');

            // Payment Method
            $table->json('payment_method_ids')->nullable()->comment('Geçerli Ödeme Yöntemleri (JSON)');
            $table->boolean('requires_cash_payment')->default(false)->comment('Nakit Ödeme Gerektirir mi?');

            // Usage Conditions
            $table->integer('min_quantity')->nullable()->comment('Minimum Ürün Adedi');
            $table->integer('usage_limit')->nullable()->comment('Toplam Kullanım Limiti');
            $table->integer('usage_limit_per_customer')->nullable()->comment('Müşteri Başına Kullanım Limiti');
            $table->integer('usage_count')->default(0)->comment('Şu Ana Kadar Kullanım Sayısı');

            // Display & Notification
            $table->boolean('show_on_invoice')->default(true)->comment('Faturada Göster');
            $table->boolean('show_on_website')->default(true)->comment('Web Sitesinde Göster');
            $table->boolean('auto_apply')->default(false)->comment('Otomatik Uygula');

            // Status & Notes
            $table->enum('status', [
                'draft',      // Taslak
                'active',     // Aktif
                'inactive',   // Pasif
                'expired',    // Süresi Dolmuş
            ])->default('draft')->comment('Durum');

            $table->text('notes')->nullable()->comment('Notlar');

            // Statistics
            $table->integer('application_count')->default(0)->comment('Uygulanma Sayısı');
            $table->decimal('total_discount_given', 15, 2)->default(0)->comment('Verilen Toplam İskonto');
            $table->decimal('total_revenue', 15, 2)->default(0)->comment('İskonto ile Yapılan Toplam Satış');

            // Audit Fields
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('code');
            $table->index('type');
            $table->index('status');
            $table->index('start_date');
            $table->index('end_date');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discounts');
    }
};
