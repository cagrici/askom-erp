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
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();

            // Basic Information
            $table->string('name')->comment('Kampanya Adı');
            $table->string('code', 50)->unique()->comment('Kampanya Kodu (Unique)');
            $table->text('description')->nullable()->comment('Kampanya Açıklaması');

            // Campaign Type & Target
            $table->enum('type', [
                'discount_percentage',  // İndirim Yüzdesi
                'discount_amount',      // İndirim Tutarı
                'buy_x_get_y',         // X Al Y Öde
                'free_shipping',       // Ücretsiz Kargo
                'bundle',              // Paket Kampanya
                'gift',                // Hediye
                'cashback',            // Para İadesi
            ])->comment('Kampanya Türü');

            $table->enum('target_type', [
                'all',                 // Tüm Müşteriler
                'customer',            // Belirli Müşteri
                'customer_group',      // Müşteri Grubu
                'new_customer',        // Yeni Müşteriler
                'location',            // Belirli Lokasyon
            ])->default('all')->comment('Hedef Tip');

            // Date & Time
            $table->dateTime('start_date')->comment('Başlangıç Tarihi');
            $table->dateTime('end_date')->comment('Bitiş Tarihi');
            $table->boolean('is_active')->default(true)->comment('Aktif mi?');

            // Discount Configuration
            $table->decimal('discount_value', 15, 2)->nullable()->comment('İndirim Değeri (% veya Tutar)');
            $table->decimal('min_purchase_amount', 15, 2)->nullable()->comment('Minimum Alışveriş Tutarı');
            $table->decimal('max_discount_amount', 15, 2)->nullable()->comment('Maksimum İndirim Tutarı');

            // Buy X Get Y Configuration
            $table->integer('buy_quantity')->nullable()->comment('Alınacak Miktar (X Al Y Öde için)');
            $table->integer('get_quantity')->nullable()->comment('Ödenecek Miktar (X Al Y Öde için)');

            // Usage Limits
            $table->integer('usage_limit')->nullable()->comment('Toplam Kullanım Limiti');
            $table->integer('usage_limit_per_customer')->nullable()->comment('Müşteri Başına Kullanım Limiti');
            $table->integer('usage_count')->default(0)->comment('Şu Ana Kadar Kullanım Sayısı');

            // Product & Category Filters
            $table->json('product_ids')->nullable()->comment('Geçerli Ürün ID\'leri (JSON)');
            $table->json('category_ids')->nullable()->comment('Geçerli Kategori ID\'leri (JSON)');
            $table->json('excluded_product_ids')->nullable()->comment('Hariç Tutulan Ürün ID\'leri (JSON)');
            $table->json('excluded_category_ids')->nullable()->comment('Hariç Tutulan Kategori ID\'leri (JSON)');

            // Customer Filters
            $table->json('customer_ids')->nullable()->comment('Geçerli Müşteri ID\'leri (JSON)');
            $table->json('customer_group_ids')->nullable()->comment('Geçerli Müşteri Grup ID\'leri (JSON)');

            // Location Filter
            $table->json('location_ids')->nullable()->comment('Geçerli Lokasyon ID\'leri (JSON)');

            // Gift Configuration
            $table->foreignId('gift_product_id')->nullable()->constrained('products')->nullOnDelete()->comment('Hediye Ürün ID');
            $table->integer('gift_quantity')->nullable()->comment('Hediye Ürün Miktarı');

            // Priority & Stacking
            $table->integer('priority')->default(0)->comment('Öncelik (Yüksek önce uygulanır)');
            $table->boolean('can_stack')->default(false)->comment('Diğer Kampanyalarla Birlikte Kullanılabilir mi?');

            // Coupon Code
            $table->boolean('requires_coupon')->default(false)->comment('Kupon Kodu Gerektirir mi?');
            $table->string('coupon_code', 100)->nullable()->unique()->comment('Kupon Kodu');

            // Notification & Display
            $table->boolean('show_on_website')->default(true)->comment('Web Sitesinde Göster');
            $table->string('banner_image')->nullable()->comment('Banner Resmi');
            $table->text('terms_conditions')->nullable()->comment('Şartlar ve Koşullar');

            // Status & Notes
            $table->enum('status', [
                'draft',          // Taslak
                'scheduled',      // Planlanmış
                'active',         // Aktif
                'paused',         // Duraklatılmış
                'expired',        // Süresi Dolmuş
                'completed',      // Tamamlanmış
            ])->default('draft')->comment('Durum');

            $table->text('notes')->nullable()->comment('Notlar');

            // Tracking & Analytics
            $table->integer('view_count')->default(0)->comment('Görüntülenme Sayısı');
            $table->decimal('total_revenue', 15, 2)->default(0)->comment('Toplam Gelir');
            $table->decimal('total_discount_given', 15, 2)->default(0)->comment('Verilen Toplam İndirim');

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
            $table->index('coupon_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
