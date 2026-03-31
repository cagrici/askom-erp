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
        Schema::table('current_accounts', function (Blueprint $table) {
            // Foreign key references to new tables
            $table->foreignId('country_id')->nullable()->after('country')->constrained()->nullOnDelete();
            $table->foreignId('city_id')->nullable()->after('city')->constrained()->nullOnDelete();
            $table->foreignId('district_id')->nullable()->after('district')->constrained()->nullOnDelete();
            $table->foreignId('tax_office_id')->nullable()->after('tax_office')->constrained()->nullOnDelete();
            $table->foreignId('payment_term_id')->nullable()->after('payment_term_days')->constrained()->nullOnDelete();
            $table->foreignId('payment_method_id')->nullable()->after('payment_term_id')->constrained()->nullOnDelete();

            // CRM Integration fields
            $table->string('lead_source', 100)->nullable()->after('sales_representative_id'); // Müşteri kaynağı
            $table->enum('customer_segment', ['a', 'b', 'c', 'vip', 'new'])->nullable()->after('lead_source'); // Müşteri segmenti
            $table->date('first_contact_date')->nullable()->after('customer_segment'); // İlk temas tarihi
            $table->date('last_contact_date')->nullable()->after('first_contact_date'); // Son temas tarihi
            $table->text('crm_notes')->nullable()->after('last_contact_date'); // CRM notları
            $table->json('social_media')->nullable()->after('crm_notes'); // Sosyal medya hesapları

            // Additional contact persons (JSON array)
            $table->json('additional_contacts')->nullable()->after('contact_email'); // Ek yetkili kişiler

            // Customer preferences
            $table->json('communication_preferences')->nullable()->after('additional_contacts'); // İletişim tercihleri
            $table->string('preferred_language', 10)->default('tr')->after('communication_preferences'); // Tercih edilen dil

            // Business details
            $table->integer('employee_count')->nullable()->after('trade_registry_no'); // Çalışan sayısı
            $table->decimal('annual_revenue', 15, 2)->nullable()->after('employee_count'); // Yıllık ciro
            $table->year('establishment_year')->nullable()->after('annual_revenue'); // Kuruluş yılı
        });

        // Delivery addresses table (Teslimat adresleri)
        Schema::create('current_account_delivery_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('current_account_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100); // Adres adı (Ana Ofis, Depo, vs.)
            $table->string('contact_person', 100)->nullable(); // Teslim alacak kişi
            $table->string('contact_phone', 20)->nullable(); // İletişim telefonu
            $table->text('address'); // Adres
            $table->foreignId('country_id')->constrained()->cascadeOnDelete();
            $table->foreignId('city_id')->constrained()->cascadeOnDelete();
            $table->foreignId('district_id')->nullable()->constrained()->nullOnDelete();
            $table->string('postal_code', 10)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->enum('type', ['billing', 'shipping', 'both'])->default('shipping'); // Fatura/Teslimat/İkisi
            $table->boolean('is_default')->default(false); // Varsayılan adres
            $table->boolean('is_active')->default(true);
            $table->text('delivery_notes')->nullable(); // Teslimat notları
            $table->json('delivery_hours')->nullable(); // Teslimat saatleri
            $table->timestamps();

            $table->index(['current_account_id', 'is_active'], 'ca_delivery_addr_account_active_idx');
            $table->index(['type', 'is_default'], 'ca_delivery_addr_type_default_idx');
        });

        // Contact persons table (Yetkili kişiler)
        Schema::create('current_account_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('current_account_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100); // Ad soyad
            $table->string('title', 100)->nullable(); // Pozisyon/Ünvan
            $table->string('department', 100)->nullable(); // Departman
            $table->string('phone', 20)->nullable(); // Telefon
            $table->string('mobile', 20)->nullable(); // Mobil
            $table->string('email', 150)->nullable(); // E-posta
            $table->string('fax', 20)->nullable(); // Fax
            $table->text('notes')->nullable(); // Notlar
            $table->json('responsibilities')->nullable(); // Sorumluluklar (satış, finans, teknik, vs.)
            $table->boolean('is_primary')->default(false); // Ana yetkili
            $table->boolean('is_active')->default(true);
            $table->date('birthday')->nullable(); // Doğum günü
            $table->json('social_media')->nullable(); // Sosyal medya
            $table->timestamps();

            $table->index(['current_account_id', 'is_active'], 'ca_contacts_account_active_idx');
            $table->index(['is_primary'], 'ca_contacts_primary_idx');
        });

        // Credit limits and financial terms (Mali limit ve şartlar)
        Schema::create('current_account_credit_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('current_account_id')->constrained()->cascadeOnDelete();
            $table->decimal('credit_limit', 15, 2)->default(0); // Kredi limiti
            $table->decimal('insurance_limit', 15, 2)->default(0); // Sigorta limiti
            $table->decimal('used_limit', 15, 2)->default(0); // Kullanılan limit
            $table->string('credit_rating', 10)->nullable(); // Kredi notu (AAA, AA, A, B, C)
            $table->date('credit_check_date')->nullable(); // Kredi kontrolü tarihi
            $table->date('credit_expiry_date')->nullable(); // Limit geçerlilik tarihi
            $table->foreignId('payment_term_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('payment_method_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('early_payment_discount', 5, 2)->default(0); // Erken ödeme iskontosu
            $table->integer('grace_period_days')->default(0); // Ödemesizlik süresi
            $table->boolean('requires_guarantee')->default(false); // Teminat gerekiyor mu
            $table->text('guarantee_details')->nullable(); // Teminat detayları
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['current_account_id'], 'ca_credit_terms_account_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('current_account_credit_terms');
        Schema::dropIfExists('current_account_contacts');
        Schema::dropIfExists('current_account_delivery_addresses');

        Schema::table('current_accounts', function (Blueprint $table) {
            $table->dropForeign(['country_id']);
            $table->dropForeign(['city_id']);
            $table->dropForeign(['district_id']);
            $table->dropForeign(['tax_office_id']);
            $table->dropForeign(['payment_term_id']);
            $table->dropForeign(['payment_method_id']);

            $table->dropColumn([
                'country_id', 'city_id', 'district_id', 'tax_office_id',
                'payment_term_id', 'payment_method_id',
                'lead_source', 'customer_segment', 'first_contact_date', 'last_contact_date',
                'crm_notes', 'social_media', 'additional_contacts', 'communication_preferences',
                'preferred_language', 'employee_count', 'annual_revenue', 'establishment_year'
            ]);
        });
    }
};
