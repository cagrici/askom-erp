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
        Schema::create('current_account_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('current_account_id')->constrained('current_accounts')->onDelete('cascade');
            $table->enum('transaction_type', ['debit', 'credit']); // debit = alacak, credit = borç
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('TRY');
            $table->date('transaction_date');
            $table->date('due_date')->nullable();
            $table->string('document_type')->nullable(); // invoice, payment, adjustment, etc.
            $table->unsignedBigInteger('document_id')->nullable(); // Reference to related document
            $table->string('description')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['current_account_id', 'transaction_date'], 'ca_trans_account_date_idx');
            $table->index(['current_account_id', 'transaction_type'], 'ca_trans_account_type_idx');
            $table->index(['document_type', 'document_id'], 'ca_trans_document_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('current_account_transactions');
    }
};
