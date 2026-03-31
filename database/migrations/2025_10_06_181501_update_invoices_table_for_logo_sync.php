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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();

            // Logo Ana Fatura Tablosu Alanları (LG_XXX_XX_INVOICE)
            $table->string('logo_logicalref', 50)->nullable()->unique()->comment('Logo LOGICALREF (Benzersiz)');
            $table->string('logo_ficheno', 50)->nullable()->index()->comment('Logo FICHENO (Fiş Numarası)');
            $table->integer('logo_trcode')->nullable()->comment('Logo TRCODE (İşlem Kodu: 1-Satış, 2-Satış İade, 3-Alış, 4-Alış İade, vb)');
            $table->integer('logo_nettotal')->nullable()->comment('Logo NETTOTAL (Net Tutar * 100)');
            $table->integer('logo_grosstotal')->nullable()->comment('Logo GROSSTOTAL (Brüt Tutar * 100)');
            $table->integer('logo_totvatamnt')->nullable()->comment('Logo TOTVATAMNT (KDV Tutarı * 100)');
            $table->integer('logo_distdisc')->nullable()->comment('Logo DISTDISC (İskonto Tutarı * 100)');
            $table->integer('logo_reportrate')->nullable()->comment('Logo REPORTRATE (Döviz Kuru * 10000)');
            $table->smallInteger('logo_trcurr')->nullable()->comment('Logo TRCURR (Para Birimi: 0-TL, 1-USD, 20-EUR, vb)');
            $table->integer('logo_date')->nullable()->index()->comment('Logo DATE_ (Tarih format: YYYYMMDD)');
            $table->integer('logo_time')->nullable()->comment('Logo TIME_ (Saat format: HHMMSS)');
            $table->string('logo_specode', 25)->nullable()->comment('Logo SPECODE (Özel Kod)');
            $table->string('logo_specode2', 25)->nullable()->comment('Logo SPECODE2 (Özel Kod 2)');
            $table->string('logo_specode3', 25)->nullable()->comment('Logo SPECODE3 (Özel Kod 3)');
            $table->string('logo_specode4', 25)->nullable()->comment('Logo SPECODE4 (Özel Kod 4)');
            $table->string('logo_specode5', 25)->nullable()->comment('Logo SPECODE5 (Özel Kod 5)');
            $table->integer('logo_printcnt')->default(0)->comment('Logo PRINTCNT (Yazdırma Sayısı)');
            $table->boolean('logo_cancelled')->default(false)->comment('Logo CANCELLED (İptal Durumu: 0-Aktif, 1-İptal)');

            // Logo Cari Hesap Bilgileri
            $table->integer('logo_clientref')->nullable()->index()->comment('Logo CLIENTREF (Cari Hesap Ref)');
            $table->string('logo_clientcode', 50)->nullable()->index()->comment('Logo CLIENTCODE (Cari Hesap Kodu)');
            $table->string('logo_definition', 201)->nullable()->comment('Logo DEFINITION_ (Cari Hesap Unvanı)');
            $table->string('logo_taxoffice', 51)->nullable()->comment('Logo TAXOFFICE (Vergi Dairesi)');
            $table->string('logo_taxnr', 21)->nullable()->comment('Logo TAXNR (Vergi/TC No)');

            // Logo Adres Bilgileri
            $table->text('logo_genexp1')->nullable()->comment('Logo GENEXP1 (Açıklama 1 / Fatura Adresi)');
            $table->text('logo_genexp2')->nullable()->comment('Logo GENEXP2 (Açıklama 2 / Sevk Adresi)');
            $table->text('logo_genexp3')->nullable()->comment('Logo GENEXP3 (Açıklama 3)');
            $table->text('logo_genexp4')->nullable()->comment('Logo GENEXP4 (Açıklama 4)');
            $table->text('logo_genexp5')->nullable()->comment('Logo GENEXP5 (Açıklama 5)');
            $table->text('logo_genexp6')->nullable()->comment('Logo GENEXP6 (Açıklama 6)');

            // Logo Diğer Önemli Alanlar
            $table->integer('logo_salesmanref')->nullable()->comment('Logo SALESMANREF (Satış Temsilcisi Ref)');
            $table->string('logo_docode', 50)->nullable()->comment('Logo DOCODE (Belge Numarası / İrsaliye No)');
            $table->integer('logo_shipinforef')->nullable()->comment('Logo SHIPINFOREF (Sevkiyat Bilgisi Ref)');
            $table->integer('logo_projectref')->nullable()->comment('Logo PROJECTREF (Proje Ref)');
            $table->integer('logo_paydefref')->nullable()->comment('Logo PAYDEFREF (Ödeme Planı Ref)');
            $table->string('logo_einvoice', 10)->nullable()->comment('Logo EINVOICE (E-Fatura Durumu)');
            $table->string('logo_edespatch', 10)->nullable()->comment('Logo EDESPATCH (E-İrsaliye Durumu)');
            $table->string('logo_einvoiceguid', 100)->nullable()->comment('Logo EINVOICEGUID (E-Fatura GUID)');

            // Normalize Edilmiş Alanlar (Raporlama ve Kullanım İçin)
            $table->string('invoice_series', 20)->nullable()->index()->comment('Fatura Serisi (FICHENO\'dan çıkarılır)');
            $table->string('invoice_number', 50)->nullable()->index()->comment('Fatura Numarası');
            $table->string('invoice_type', 50)->nullable()->index()->comment('Fatura Türü: sales, sales_return, purchase, purchase_return, proforma');
            $table->date('invoice_date')->nullable()->index()->comment('Fatura Tarihi (Normalized)');
            $table->time('invoice_time')->nullable()->comment('Fatura Saati (Normalized)');
            $table->decimal('net_total', 15, 2)->default(0)->comment('Net Toplam (TL)');
            $table->decimal('discount_total', 15, 2)->default(0)->comment('İskonto Toplamı (TL)');
            $table->decimal('vat_total', 15, 2)->default(0)->comment('KDV Toplamı (TL)');
            $table->decimal('gross_total', 15, 2)->default(0)->comment('Genel Toplam (TL)');
            $table->string('currency_code', 3)->default('TRY')->index()->comment('Para Birimi');
            $table->decimal('exchange_rate', 12, 6)->default(1)->comment('Döviz Kuru');

            // Local Current Account Integration
            $table->unsignedBigInteger('current_account_id')->nullable()->index()->comment('Yerel Cari Hesap ID');
            $table->string('customer_code', 50)->nullable()->index()->comment('Müşteri Kodu');
            $table->string('customer_name')->nullable()->comment('Müşteri Adı');
            $table->string('tax_office')->nullable()->comment('Vergi Dairesi');
            $table->string('tax_number', 20)->nullable()->comment('Vergi/TC No');

            // Local Address Management
            $table->unsignedBigInteger('delivery_address_id')->nullable()->comment('Yerel Teslimat Adresi ID');
            $table->text('billing_address')->nullable()->comment('Fatura Adresi (Formatted)');
            $table->text('shipping_address')->nullable()->comment('Sevk Adresi (Formatted)');

            // Local Related Documents
            $table->string('waybill_number')->nullable()->index()->comment('İrsaliye Numarası');
            $table->unsignedBigInteger('sales_order_id')->nullable()->index()->comment('Yerel Satış Siparişi ID');
            $table->unsignedBigInteger('salesperson_id')->nullable()->comment('Yerel Satış Temsilcisi ID');

            // Local Status Management
            $table->string('status', 50)->default('synced')->index()->comment('Yerel Durum: synced, approved, sent, paid, cancelled, pending');
            $table->text('notes')->nullable()->comment('Yerel Notlar');
            $table->text('cancellation_reason')->nullable()->comment('İptal Nedeni');

            // Payment Tracking
            $table->decimal('paid_amount', 15, 2)->default(0)->comment('Ödenen Tutar');
            $table->decimal('remaining_amount', 15, 2)->default(0)->comment('Kalan Tutar');
            $table->date('due_date')->nullable()->comment('Vade Tarihi');
            $table->date('payment_date')->nullable()->comment('Ödeme Tarihi');

            // Document Management
            $table->string('printed_by')->nullable()->comment('Yazdıran Kullanıcı');
            $table->timestamp('printed_at')->nullable()->comment('Yazdırma Tarihi');
            $table->integer('print_count')->default(0)->comment('Yazdırma Sayısı');

            // Sync Tracking
            $table->timestamp('logo_synced_at')->nullable()->index()->comment('Logo\'dan Son Senkronizasyon');
            $table->string('synced_by')->nullable()->comment('Senkronize Eden Kullanıcı');
            $table->string('sync_status', 50)->default('success')->comment('Senkronizasyon Durumu: success, failed, partial');
            $table->text('sync_errors')->nullable()->comment('Senkronizasyon Hataları (JSON)');
            $table->integer('sync_attempt_count')->default(0)->comment('Senkronizasyon Deneme Sayısı');
            $table->timestamp('last_sync_attempt_at')->nullable()->comment('Son Senkronizasyon Denemesi');

            // Audit Fields
            $table->unsignedBigInteger('created_by')->nullable()->comment('Oluşturan Kullanıcı');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('Güncelleyen Kullanıcı');
            $table->timestamps();
            $table->softDeletes();

            // Indexes for Performance
            $table->index(['invoice_date', 'invoice_type'], 'idx_date_type');
            $table->index(['current_account_id', 'invoice_date'], 'idx_customer_date');
            $table->index(['status', 'invoice_date'], 'idx_status_date');
            $table->index(['logo_clientref', 'logo_date'], 'idx_logo_client_date');

            // Foreign Keys
            $table->foreign('current_account_id')
                  ->references('id')
                  ->on('current_accounts')
                  ->onDelete('set null');

            $table->foreign('sales_order_id')
                  ->references('id')
                  ->on('sales_orders')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
