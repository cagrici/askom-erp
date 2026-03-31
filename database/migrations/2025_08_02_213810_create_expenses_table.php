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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('expense_number', 50)->unique();
            
            // İlişkiler
            $table->foreignId('current_account_id')->nullable()->constrained('current_accounts')->onDelete('set null');
            $table->foreignId('expense_category_id')->constrained('expense_categories')->onDelete('restrict');
            $table->foreignId('bank_account_id')->nullable()->constrained('bank_accounts')->onDelete('set null');
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods')->onDelete('set null');
            $table->foreignId('employee_id')->nullable()->constrained('employees')->onDelete('set null');
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('set null');
            
            // Gider Detayları
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('TRY');
            $table->decimal('exchange_rate', 10, 4)->default(1);
            $table->decimal('amount_in_base_currency', 15, 2);
            
            // Vergi ve Kesintiler
            $table->decimal('vat_rate', 5, 2)->default(0);
            $table->decimal('vat_amount', 15, 2)->default(0);
            $table->decimal('withholding_tax_rate', 5, 2)->default(0);
            $table->decimal('withholding_tax_amount', 15, 2)->default(0);
            $table->decimal('net_amount', 15, 2);
            
            // Tarihler
            $table->date('expense_date');
            $table->date('invoice_date')->nullable();
            $table->date('due_date')->nullable();
            $table->date('payment_date')->nullable();
            
            // Belge Bilgileri
            $table->string('invoice_number', 100)->nullable();
            $table->string('reference_number', 100)->nullable();
            $table->string('receipt_number', 100)->nullable();
            
            // Durum Yönetimi
            $table->enum('status', ['draft', 'pending', 'approved', 'paid', 'cancelled'])->default('draft');
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->enum('payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid');
            
            // Tekrarlayan Gider
            $table->boolean('is_recurring')->default(false);
            $table->enum('recurring_frequency', ['monthly', 'quarterly', 'yearly'])->nullable();
            $table->date('next_occurrence_date')->nullable();
            
            // Onay ve Ödeme
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->unsignedBigInteger('paid_by')->nullable();
            
            // Ek Dosyalar
            $table->json('attachments')->nullable();
            
            // Audit
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // İndeksler
            $table->index(['expense_date']);
            $table->index(['status']);
            $table->index(['expense_category_id']);
            $table->index(['current_account_id']);
            $table->index(['employee_id']);
            $table->index(['amount']);
            $table->index(['due_date']);
            $table->index(['expense_number']);
            $table->index(['currency']);
            $table->index(['payment_status']);
            $table->index(['approval_status']);
            $table->index(['is_recurring']);
            $table->index(['location_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
