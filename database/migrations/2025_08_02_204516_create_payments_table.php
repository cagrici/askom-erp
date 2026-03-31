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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number', 50)->unique(); // Ödeme numarası
            
            // Relations
            $table->foreignId('current_account_id')->constrained('current_accounts')->onDelete('cascade'); // Ödeme yapılan cari
            $table->foreignId('bank_account_id')->constrained('bank_accounts')->onDelete('restrict'); // Ödemenin yapıldığı banka hesabı
            $table->foreignId('payment_method_id')->constrained('payment_methods')->onDelete('restrict'); // Ödeme yöntemi
            $table->foreignId('payment_term_id')->nullable()->constrained('payment_terms')->onDelete('set null'); // Ödeme vadesi
            
            // Payment Details
            $table->decimal('amount', 15, 2); // Ödeme tutarı
            $table->string('currency', 3)->default('TRY'); // Para birimi
            $table->decimal('exchange_rate', 10, 4)->default(1); // Döviz kuru
            $table->decimal('amount_in_base_currency', 15, 2); // Ana para biriminde tutar
            
            // Commission and Fees
            $table->decimal('commission_rate', 5, 2)->default(0); // Komisyon oranı (%)
            $table->decimal('commission_amount', 15, 2)->default(0); // Komisyon tutarı
            $table->decimal('bank_fees', 15, 2)->default(0); // Banka masrafları
            $table->decimal('net_amount', 15, 2); // Net ödeme tutarı
            
            // Dates
            $table->date('payment_date'); // Ödeme tarihi
            $table->date('due_date')->nullable(); // Vade tarihi
            $table->date('value_date')->nullable(); // Valör tarihi
            
            // Payment Details
            $table->string('reference_number', 100)->nullable(); // Referans numarası
            $table->string('document_number', 100)->nullable(); // Belge numarası
            $table->text('description')->nullable(); // Açıklama
            $table->text('notes')->nullable(); // Notlar
            
            // Status Management
            $table->enum('status', ['draft', 'pending', 'approved', 'paid', 'cancelled', 'bounced'])
                  ->default('draft'); // Ödeme durumu
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])
                  ->default('pending'); // Onay durumu
            
            // Workflow
            $table->boolean('is_reconciled')->default(false); // Mutabakat yapıldı mı?
            $table->timestamp('reconciled_at')->nullable(); // Mutabakat tarihi
            $table->unsignedBigInteger('reconciled_by')->nullable(); // Mutabakatı yapan
            
            $table->timestamp('approved_at')->nullable(); // Onay tarihi
            $table->unsignedBigInteger('approved_by')->nullable(); // Onaylayan
            
            $table->timestamp('paid_at')->nullable(); // Ödenme tarihi
            $table->unsignedBigInteger('paid_by')->nullable(); // Ödemeyi yapan
            
            // File attachments
            $table->json('attachments')->nullable(); // Ek dosyalar
            
            // Audit fields
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for performance
            $table->index(['status']);
            $table->index(['approval_status']);
            $table->index(['payment_date']);
            $table->index(['due_date']);
            $table->index(['current_account_id', 'payment_date']);
            $table->index(['bank_account_id', 'payment_date']);
            $table->index(['payment_number']);
            $table->index(['reference_number']);
            $table->index(['currency']);
            $table->index(['is_reconciled']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
