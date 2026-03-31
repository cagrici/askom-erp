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
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'pending', 'approved', 'sent', 'confirmed', 'partially_received', 'received', 'invoiced', 'completed', 'cancelled'])->default('draft');
            $table->enum('order_type', ['regular', 'urgent', 'blanket', 'framework'])->default('regular');
            
            // Relations
            $table->foreignId('purchase_request_id')->nullable()->constrained('purchase_requests')->onDelete('set null');
            $table->foreignId('supplier_id')->constrained('current_accounts')->onDelete('cascade');
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('set null');
            $table->foreignId('ordered_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            
            // Dates
            $table->date('order_date');
            $table->date('delivery_date');
            $table->timestamp('approved_at')->nullable();
            
            // Totals
            $table->decimal('total_amount', 15, 4)->default(0);
            $table->string('currency', 3)->default('TRY');
            $table->decimal('exchange_rate', 10, 6)->default(1);
            
            // Terms
            $table->text('terms_conditions')->nullable();
            $table->text('delivery_terms')->nullable();
            $table->text('notes')->nullable();
            
            // Additional fields
            $table->string('reference_number')->nullable();
            $table->boolean('is_urgent')->default(false);
            
            // Audit fields
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['status', 'order_date']);
            $table->index(['supplier_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
