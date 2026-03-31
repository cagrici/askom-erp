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
        Schema::create('current_accounts', function (Blueprint $table) {
            $table->id();

            // Temel Bilgiler
            $table->string('account_code', 20)->unique(); // 120.001.001 gibi
            $table->string('title', 200); // Unvan/Ad Soyad
            $table->enum('account_type', [
                'customer', // Müşteri
                'supplier', // Tedarikçi
                'both', // Müşteri+Tedarikçi
                'personnel', // Personel
                'shareholder', // Ortak
                'other' // Diğer
            ]);
            $table->enum('person_type', ['individual', 'corporate']); // Gerçek/Tüzel Kişi

            // Vergi Bilgileri
            $table->string('tax_number', 11)->nullable(); // Vergi Kimlik/TC No
            $table->string('tax_office', 100)->nullable(); // Vergi Dairesi
            $table->string('mersys_no', 20)->nullable(); // MERSİS No
            $table->string('trade_registry_no', 50)->nullable(); // Ticaret Sicil No

            // İletişim Bilgileri
            $table->text('address')->nullable();
            $table->string('district', 100)->nullable(); // İlçe
            $table->string('city', 100)->nullable(); // İl
            $table->string('postal_code', 10)->nullable();
            $table->string('country', 100)->default('Türkiye');

            // Telefon ve İletişim
            $table->string('phone_1', 20)->nullable();
            $table->string('phone_2', 20)->nullable();
            $table->string('mobile', 20)->nullable();
            $table->string('fax', 20)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('website', 200)->nullable();

            // Yetkili Kişi Bilgileri
            $table->string('contact_person', 100)->nullable();
            $table->string('contact_title', 100)->nullable(); // Pozisyon
            $table->string('contact_phone', 20)->nullable();
            $table->string('contact_email', 150)->nullable();

            // Mali Bilgiler
            $table->decimal('credit_limit', 15, 2)->default(0); // Kredi Limiti
            $table->integer('payment_term_days')->default(0); // Vade Günü
            $table->decimal('discount_rate', 5, 2)->default(0); // İskonto Oranı
            $table->enum('currency', ['TRY', 'USD', 'EUR', 'GBP'])->default('TRY');
            $table->decimal('risk_limit', 15, 2)->default(0); // Risk Limiti

            // E-Fatura/E-Arşiv Bilgileri
            $table->boolean('e_invoice_enabled')->default(false);
            $table->string('e_invoice_address', 200)->nullable(); // E-Fatura Adresi
            $table->boolean('e_archive_enabled')->default(false);
            $table->string('gib_alias', 100)->nullable(); // GİB Posta Kutusu

            // Muhasebe Kodu Eşleştirmeleri
            $table->string('customer_account_code', 20)->nullable(); // 120 Alıcılar
            $table->string('supplier_account_code', 20)->nullable(); // 320 Satıcılar
            $table->string('personnel_account_code', 20)->nullable(); // 335 Personel

            // Banka Bilgileri (JSON olarak saklayacağız)
            $table->json('bank_accounts')->nullable(); // Banka hesap bilgileri

            // Kategori ve Segmentasyon
            $table->string('category', 100)->nullable(); // A, B, C müşteri vs
            $table->string('sector', 100)->nullable(); // Sektör
            $table->string('region', 100)->nullable(); // Bölge
            $table->integer('sales_representative_id')->nullable(); // Satış Temsilcisi

            // Durum ve Kontrol
            $table->boolean('is_active')->default(true);
            $table->boolean('is_blocked')->default(false); // Bloke durumu
            $table->text('block_reason')->nullable(); // Bloke nedeni
            $table->boolean('requires_approval')->default(false); // Onay gerektiriyor mu

            // Özel Alanlar
            $table->text('notes')->nullable(); // Notlar
            $table->json('custom_fields')->nullable(); // Özel alanlar
            $table->json('tags')->nullable(); // Etiketler

            // Entegrasyon Bilgileri
            $table->string('external_code', 50)->nullable(); // Dış sistem kodu
            $table->string('external_system', 50)->nullable(); // Dış sistem adı
            $table->timestamp('last_transaction_date')->nullable(); // Son işlem tarihi

            // Otomatik Hesaplanan Alanlar
            $table->decimal('current_balance', 15, 2)->default(0); // Güncel bakiye
            $table->decimal('total_receivables', 15, 2)->default(0); // Toplam alacak
            $table->decimal('total_payables', 15, 2)->default(0); // Toplam borç
            $table->decimal('overdue_amount', 15, 2)->default(0); // Vadesi geçen tutar
            $table->integer('overdue_days')->default(0); // Vadesi geçen gün sayısı

            // Audit Fields
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            // İndeksler
            $table->index(['account_type', 'is_active']);
            $table->index(['person_type', 'account_type']);
            $table->index(['tax_number']);
            $table->index(['city', 'district']);
            $table->index(['is_active', 'is_blocked']);
            $table->index(['created_at']);
            $table->index(['last_transaction_date']);
            $table->index(['current_balance']);

            // Full-text search için
            $table->index(['title', 'account_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('current_accounts');
    }
};
