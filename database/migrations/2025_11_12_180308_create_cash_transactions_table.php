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
        Schema::create('cash_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_number')->unique();
            $table->foreignId('cash_account_id')->constrained('cash_accounts')->onDelete('cascade');
            $table->enum('transaction_type', ['income', 'expense', 'transfer_in', 'transfer_out', 'opening', 'count_adjustment']);
            $table->enum('payment_method', ['cash', 'check', 'credit_card', 'bank_transfer', 'other'])->default('cash');
            $table->date('transaction_date');
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('TRY');
            $table->decimal('exchange_rate', 10, 6)->default(1);
            $table->decimal('amount_in_base_currency', 15, 2); // TRY cinsinden tutar

            // İlişkili belgeler
            $table->string('document_type')->nullable(); // invoice, receipt, voucher, etc.
            $table->unsignedBigInteger('document_id')->nullable();
            $table->string('receipt_number')->nullable(); // Fiş/makbuz numarası

            // Transfer bilgileri (transfer işlemlerinde)
            $table->foreignId('related_cash_account_id')->nullable()->constrained('cash_accounts')->onDelete('set null');
            $table->foreignId('related_transaction_id')->nullable()->constrained('cash_transactions')->onDelete('set null');

            // Cari hesap (tahsilat/ödeme işlemlerinde)
            $table->foreignId('current_account_id')->nullable()->constrained('current_accounts')->onDelete('set null');

            // Açıklama ve notlar
            $table->string('category')->nullable(); // Kategori (masraf kategorisi, gelir türü vs.)
            $table->text('description')->nullable();
            $table->text('notes')->nullable();

            // Çek bilgileri
            $table->string('check_number')->nullable();
            $table->string('check_bank')->nullable();
            $table->date('check_due_date')->nullable();

            // Kart bilgileri
            $table->string('card_type')->nullable(); // visa, mastercard, etc.
            $table->string('card_last_four')->nullable();
            $table->string('card_holder_name')->nullable();

            // Sayım bilgileri
            $table->decimal('counted_amount', 15, 2)->nullable(); // Sayılan tutar
            $table->decimal('system_amount', 15, 2)->nullable(); // Sistemdeki tutar
            $table->decimal('difference_amount', 15, 2)->nullable(); // Fark
            $table->text('count_notes')->nullable();

            // Onay ve işlem bilgileri
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('approved');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['cash_account_id', 'transaction_date']);
            $table->index(['transaction_type', 'status']);
            $table->index(['document_type', 'document_id']);
            $table->index(['current_account_id', 'transaction_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_transactions');
    }
};
