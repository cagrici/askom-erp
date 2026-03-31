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
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();

            // Invoice Relationship
            $table->unsignedBigInteger('invoice_id')->index()->comment('Fatura ID');

            // Logo Fatura Satırı Alanları (LG_XXX_XX_STLINE / ORFLINE)
            $table->string('logo_logicalref', 50)->nullable()->unique()->comment('Logo LOGICALREF (Benzersiz)');
            $table->integer('logo_invoiceref')->nullable()->index()->comment('Logo INVOICEREF (Ana Fatura Ref)');
            $table->integer('logo_stockref')->nullable()->index()->comment('Logo STOCKREF (Stok Kartı Ref)');
            $table->string('logo_itemcode', 51)->nullable()->index()->comment('Logo ITEMCODE (Stok/Ürün Kodu)');
            $table->string('logo_itemname', 251)->nullable()->comment('Logo ITEMNAME (Stok/Ürün Adı)');
            $table->integer('logo_linetype')->nullable()->comment('Logo LINETYPE (Satır Tipi: 0-Stok, 1-Hizmet, 2-Depozito, 3-Promosyon, 4-Açıklama)');
            $table->smallInteger('logo_lineno')->nullable()->comment('Logo LINENO_ (Satır Numarası)');
            $table->smallInteger('logo_trcode')->nullable()->comment('Logo TRCODE (İşlem Kodu)');

            // Logo Miktar ve Birim Bilgileri
            $table->decimal('logo_amount', 18, 6)->nullable()->comment('Logo AMOUNT (Miktar * 1000000)');
            $table->smallInteger('logo_unitconvfact')->nullable()->comment('Logo UNITCONVFACT (Birim Çevrim Faktörü)');
            $table->string('logo_unitcode', 11)->nullable()->comment('Logo UNITCODE (Birim Kodu)');
            $table->decimal('logo_price', 18, 6)->nullable()->comment('Logo PRICE (Birim Fiyat * 1000000)');
            $table->decimal('logo_total', 18, 6)->nullable()->comment('Logo TOTAL (Satır Tutarı * 1000000)');

            // Logo İskonto Bilgileri
            $table->decimal('logo_distdisc', 18, 6)->nullable()->comment('Logo DISTDISC (İskonto Tutarı * 1000000)');
            $table->decimal('logo_distdiscrate', 5, 2)->nullable()->comment('Logo DISTDISCRATE (İskonto Oranı %)');
            $table->decimal('logo_discper', 5, 2)->nullable()->comment('Logo DISCPER (Satır İskonto % 1)');
            $table->decimal('logo_disc2per', 5, 2)->nullable()->comment('Logo DISC2PER (Satır İskonto % 2)');
            $table->decimal('logo_disc3per', 5, 2)->nullable()->comment('Logo DISC3PER (Satır İskonto % 3)');
            $table->decimal('logo_disc4per', 5, 2)->nullable()->comment('Logo DISC4PER (Satır İskonto % 4)');
            $table->decimal('logo_disc5per', 5, 2)->nullable()->comment('Logo DISC5PER (Satır İskonto % 5)');

            // Logo KDV Bilgileri
            $table->smallInteger('logo_vatinc')->default(0)->comment('Logo VATINC (KDV Dahil: 0-Hariç, 1-Dahil)');
            $table->decimal('logo_vatrate', 5, 2)->nullable()->comment('Logo VATRATE (KDV Oranı %)');
            $table->decimal('logo_vatamnt', 18, 6)->nullable()->comment('Logo VATAMNT (KDV Tutarı * 1000000)');
            $table->decimal('logo_linenet', 18, 6)->nullable()->comment('Logo LINENET (Satır Net Tutarı * 1000000)');

            // Logo Döviz Bilgileri
            $table->smallInteger('logo_priceincludestax')->default(0)->comment('Logo PRICEINCLUDESTAX (Fiyat Vergi Dahil mi?)');
            $table->smallInteger('logo_prcurrency')->nullable()->comment('Logo PRCURRENCY (Fiyat Para Birimi)');
            $table->decimal('logo_prrate', 10, 6)->nullable()->comment('Logo PRRATE (Fiyat Döviz Kuru * 1000000)');
            $table->decimal('logo_reportrate', 10, 6)->nullable()->comment('Logo REPORTRATE (Raporlama Kuru * 1000000)');

            // Logo Depo ve Sevkiyat Bilgileri
            $table->smallInteger('logo_sourceindex')->nullable()->comment('Logo SOURCEINDEX (Kaynak Depo Index)');
            $table->integer('logo_sourcecostgrp')->nullable()->comment('Logo SOURCECOSTGRP (Kaynak Maliyet Grubu)');
            $table->text('logo_lineexp')->nullable()->comment('Logo LINEEXP (Satır Açıklaması)');
            $table->text('logo_lineexp2')->nullable()->comment('Logo LINEEXP2 (Satır Açıklaması 2)');

            // Logo Diğer Alanlar
            $table->string('logo_specode', 25)->nullable()->comment('Logo SPECODE (Özel Kod)');
            $table->string('logo_dref', 25)->nullable()->comment('Logo DREF (Belge Referans)');
            $table->integer('logo_projectref')->nullable()->comment('Logo PROJECTREF (Proje Ref)');
            $table->integer('logo_paydefref')->nullable()->comment('Logo PAYDEFREF (Ödeme Planı Ref)');
            $table->integer('logo_campaignref')->nullable()->comment('Logo CAMPAIGNREF (Kampanya Ref)');
            $table->integer('logo_variantref')->nullable()->comment('Logo VARIANTREF (Varyant Ref)');
            $table->string('logo_variantcode', 51)->nullable()->comment('Logo VARIANTCODE (Varyant Kodu)');
            $table->boolean('logo_cancelled')->default(false)->comment('Logo CANCELLED (İptal Durumu)');

            // Normalize Edilmiş Alanlar (Kullanım İçin)
            $table->unsignedBigInteger('product_id')->nullable()->index()->comment('Yerel Ürün ID');
            $table->string('product_code', 100)->nullable()->index()->comment('Ürün Kodu');
            $table->string('product_name')->nullable()->comment('Ürün Adı');
            $table->text('description')->nullable()->comment('Açıklama');
            $table->string('line_type', 50)->default('product')->comment('Satır Tipi: product, service, discount, description');
            $table->smallInteger('line_number')->default(0)->comment('Satır Sırası');

            // Miktar ve Birim
            $table->decimal('quantity', 15, 3)->default(0)->comment('Miktar');
            $table->string('unit', 20)->default('AD')->comment('Birim');
            $table->decimal('unit_conversion_factor', 10, 4)->default(1)->comment('Birim Çevrim Faktörü');

            // Fiyat ve Tutarlar
            $table->decimal('unit_price', 15, 4)->default(0)->comment('Birim Fiyat');
            $table->decimal('unit_price_with_vat', 15, 4)->default(0)->comment('KDV Dahil Birim Fiyat');
            $table->boolean('price_includes_vat')->default(false)->comment('Fiyat KDV Dahil mi?');

            // İskonto
            $table->decimal('discount_rate_1', 5, 2)->default(0)->comment('İskonto Oranı 1 (%)');
            $table->decimal('discount_rate_2', 5, 2)->default(0)->comment('İskonto Oranı 2 (%)');
            $table->decimal('discount_rate_3', 5, 2)->default(0)->comment('İskonto Oranı 3 (%)');
            $table->decimal('discount_rate_4', 5, 2)->default(0)->comment('İskonto Oranı 4 (%)');
            $table->decimal('discount_rate_5', 5, 2)->default(0)->comment('İskonto Oranı 5 (%)');
            $table->decimal('total_discount_rate', 5, 2)->default(0)->comment('Toplam İskonto Oranı (%)');
            $table->decimal('discount_amount', 15, 2)->default(0)->comment('İskonto Tutarı');

            // KDV
            $table->decimal('vat_rate', 5, 2)->default(0)->comment('KDV Oranı (%)');
            $table->decimal('vat_amount', 15, 2)->default(0)->comment('KDV Tutarı');

            // Tutarlar
            $table->decimal('line_subtotal', 15, 2)->default(0)->comment('Satır Ara Toplamı (KDV Hariç)');
            $table->decimal('line_total', 15, 2)->default(0)->comment('Satır Net Tutarı (İskonto Sonrası, KDV Hariç)');
            $table->decimal('line_total_with_vat', 15, 2)->default(0)->comment('Satır Toplam (KDV Dahil)');

            // Para Birimi
            $table->string('currency_code', 3)->default('TRY')->comment('Para Birimi');
            $table->decimal('exchange_rate', 12, 6)->default(1)->comment('Döviz Kuru');

            // Depo ve Sevkiyat
            $table->unsignedBigInteger('warehouse_id')->nullable()->comment('Depo ID');
            $table->string('warehouse_code', 50)->nullable()->comment('Depo Kodu');
            $table->date('delivery_date')->nullable()->comment('Teslim Tarihi');

            // İlişkili Belgeler
            $table->unsignedBigInteger('sales_order_item_id')->nullable()->comment('Satış Sipariş Kalemi ID');
            $table->string('waybill_number')->nullable()->comment('İrsaliye No');

            // Maliyet ve Kar
            $table->decimal('cost_price', 15, 4)->default(0)->comment('Maliyet Fiyatı');
            $table->decimal('profit_amount', 15, 2)->default(0)->comment('Kar Tutarı');
            $table->decimal('profit_rate', 5, 2)->default(0)->comment('Kar Oranı (%)');

            // Sync Tracking
            $table->timestamp('logo_synced_at')->nullable()->comment('Logo Senkronizasyon Zamanı');

            // Audit
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['invoice_id', 'line_number'], 'idx_invoice_line');
            $table->index(['product_id', 'invoice_id'], 'idx_product_invoice');
            $table->index(['logo_invoiceref', 'logo_lineno'], 'idx_logo_invoice_line');

            // Foreign Keys
            $table->foreign('invoice_id')
                  ->references('id')
                  ->on('invoices')
                  ->onDelete('cascade');

            $table->foreign('product_id')
                  ->references('id')
                  ->on('products')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
