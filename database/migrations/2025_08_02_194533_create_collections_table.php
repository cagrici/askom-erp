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
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            
            // Basic Information
            $table->string('collection_number', 50)->unique();
            $table->unsignedBigInteger('current_account_id');
            $table->timestamp('collection_date');
            $table->unsignedBigInteger('payment_term_id')->nullable();
            $table->unsignedBigInteger('payment_method_id');
            $table->unsignedBigInteger('bank_account_id')->nullable();
            
            // Document Information
            $table->string('reference_number', 100)->nullable();
            $table->string('document_number', 100)->nullable();
            $table->date('document_date')->nullable();
            
            // Amount Information
            $table->decimal('amount', 15, 4);
            $table->string('currency', 3)->default('TRY');
            $table->decimal('exchange_rate', 10, 6)->default(1);
            $table->decimal('amount_in_base_currency', 15, 4);
            $table->decimal('commission_amount', 15, 4)->default(0);
            $table->decimal('commission_rate', 5, 2)->default(0);
            $table->decimal('net_amount', 15, 4);
            
            // Collection Type and Status
            $table->enum('collection_type', [
                'invoice_payment', 'advance_payment', 'partial_payment', 
                'overpayment', 'refund', 'adjustment', 'other'
            ])->default('invoice_payment');
            $table->enum('status', [
                'draft', 'pending', 'partial', 'collected', 
                'bounced', 'cancelled', 'expired'
            ])->default('pending');
            
            // Dates
            $table->date('due_date')->nullable();
            $table->date('maturity_date')->nullable();
            
            // Check Information
            $table->string('check_number', 50)->nullable();
            $table->string('check_bank', 100)->nullable();
            $table->string('check_branch', 100)->nullable();
            $table->string('check_account', 50)->nullable();
            
            // Promissory Note Information
            $table->string('promissory_note_number', 50)->nullable();
            $table->string('promissory_note_guarantor', 200)->nullable();
            
            // Description and Notes
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            
            // Invoice Allocation
            $table->json('invoice_numbers')->nullable();
            $table->json('allocated_invoices')->nullable();
            
            // Discounts and Fees
            $table->decimal('discount_amount', 15, 4)->default(0);
            $table->string('discount_reason', 200)->nullable();
            $table->decimal('late_fee_amount', 15, 4)->default(0);
            $table->decimal('early_payment_discount', 15, 4)->default(0);
            
            // Advance Payment
            $table->boolean('is_advance_payment')->default(false);
            $table->json('advance_for_orders')->nullable();
            
            // POS/Card Information
            $table->string('pos_terminal_id', 50)->nullable();
            $table->string('pos_batch_number', 50)->nullable();
            $table->string('pos_approval_code', 50)->nullable();
            $table->string('card_number_masked', 20)->nullable();
            $table->string('card_type', 50)->nullable();
            $table->integer('installment_count')->default(1);
            $table->decimal('installment_amount', 15, 4)->nullable();
            
            // Collection Process
            $table->unsignedBigInteger('collected_by')->nullable();
            
            // Approval Workflow
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_notes')->nullable();
            
            // Bank Reconciliation
            $table->boolean('is_reconciled')->default(false);
            $table->timestamp('reconciled_at')->nullable();
            $table->unsignedBigInteger('reconciled_by')->nullable();
            $table->string('bank_statement_reference', 100)->nullable();
            
            // Accounting Integration
            $table->unsignedBigInteger('accounting_entry_id')->nullable();
            
            // Additional Fields
            $table->json('custom_fields')->nullable();
            $table->json('tags')->nullable();
            $table->integer('attachment_count')->default(0);
            
            // Audit Fields
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['current_account_id', 'collection_date']);
            $table->index(['status', 'collection_date']);
            $table->index(['payment_method_id']);
            $table->index(['currency', 'collection_date']);
            $table->index(['maturity_date']);
            $table->index(['due_date']);
            $table->index(['is_reconciled']);
            $table->index(['approval_status']);
            $table->index(['collection_type']);
            $table->index(['is_advance_payment']);
            $table->index(['reference_number']);
            $table->index(['document_number']);
            
            // Foreign Keys (we'll add these after ensuring tables exist)
            // $table->foreign('current_account_id')->references('id')->on('current_accounts');
            // $table->foreign('payment_term_id')->references('id')->on('payment_terms');
            // $table->foreign('payment_method_id')->references('id')->on('payment_methods');
            // $table->foreign('bank_account_id')->references('id')->on('bank_accounts');
            // $table->foreign('collected_by')->references('id')->on('users');
            // $table->foreign('approved_by')->references('id')->on('users');
            // $table->foreign('reconciled_by')->references('id')->on('users');
            // $table->foreign('created_by')->references('id')->on('users');
            // $table->foreign('updated_by')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collections');
    }
};
