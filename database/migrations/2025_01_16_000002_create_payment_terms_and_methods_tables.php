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
        // Payment terms table (Ödeme vadesi)
        Schema::create('payment_terms', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100); // "30 Gün Vade", "Peşin", "60 Gün Vade"
            $table->string('code', 20)->unique(); // NET30, CASH, NET60
            $table->integer('days')->default(0); // Vade günü
            $table->enum('type', ['net', 'advance', 'cod', 'custom'])->default('net'); // net: vadeli, advance: avans, cod: kapıda ödeme
            $table->decimal('discount_percentage', 5, 2)->default(0); // Erken ödeme iskontosu
            $table->integer('discount_days')->default(0); // İskonto için ödeme günü
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['is_active', 'sort_order']);
            $table->index(['code']);
        });

        // Payment methods table (Ödeme şekli)
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100); // "Nakit", "Kredi Kartı", "Havale/EFT"
            $table->string('code', 20)->unique(); // CASH, CREDIT_CARD, BANK_TRANSFER
            $table->enum('type', ['cash', 'card', 'bank_transfer', 'check', 'promissory_note', 'other'])->default('cash');
            $table->text('description')->nullable();
            $table->json('settings')->nullable(); // Ek ayarlar (komisyon oranı vs.)
            $table->boolean('requires_bank_account')->default(false); // Banka hesabı gerekiyor mu
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['is_active', 'sort_order']);
            $table->index(['code']);
            $table->index(['type']);
        });

        // Bank accounts table for payment methods
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('account_name', 200); // Hesap adı
            $table->string('bank_name', 100); // Banka adı
            $table->string('branch_name', 100)->nullable(); // Şube adı
            $table->string('branch_code', 20)->nullable(); // Şube kodu
            $table->string('account_number', 50); // Hesap numarası
            $table->string('iban', 34)->nullable(); // IBAN
            $table->string('swift_code', 11)->nullable(); // SWIFT kodu
            $table->string('currency', 3)->default('TRY'); // Para birimi
            $table->enum('account_type', ['checking', 'savings', 'business', 'other'])->default('checking');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            
            $table->index(['is_active']);
            $table->index(['currency']);
            $table->index(['iban']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_accounts');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('payment_terms');
    }
};