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
        Schema::create('purchase_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')->constrained('purchase_requests')->onDelete('cascade');
            $table->foreignId('product_id')->nullable()->constrained('products')->onDelete('set null');
            
            // Item details
            $table->string('item_code')->nullable();
            $table->string('item_name');
            $table->text('description')->nullable();
            $table->text('specifications')->nullable();
            
            // Quantities
            $table->decimal('requested_quantity', 12, 4);
            $table->decimal('approved_quantity', 12, 4)->nullable();
            $table->foreignId('unit_id')->nullable()->constrained('units')->onDelete('set null');
            $table->string('unit_name')->nullable();
            
            // Pricing
            $table->decimal('estimated_unit_price', 12, 4)->nullable();
            $table->decimal('estimated_total_price', 15, 4)->nullable();
            $table->string('currency', 3)->default('TRY');
            
            // Preferences
            $table->foreignId('preferred_supplier_id')->nullable()->constrained('current_accounts')->onDelete('set null');
            $table->string('preferred_brand')->nullable();
            $table->string('preferred_model')->nullable();
            
            // Status and priorities
            $table->enum('status', ['pending', 'approved', 'rejected', 'converted', 'partially_converted'])->default('pending');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->date('required_date')->nullable();
            
            // Additional fields
            $table->text('notes')->nullable();
            $table->string('budget_code')->nullable();
            $table->string('gl_account')->nullable();
            $table->json('custom_fields')->nullable();
            
            // Conversion tracking
            $table->decimal('converted_quantity', 12, 4)->default(0);
            $table->decimal('remaining_quantity', 12, 4)->default(0);
            
            // Sort order
            $table->integer('sort_order')->default(0);
            
            $table->timestamps();
            
            // Indexes
            $table->index(['purchase_request_id', 'status']);
            $table->index(['product_id', 'status']);
            $table->index(['preferred_supplier_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_request_items');
    }
};
