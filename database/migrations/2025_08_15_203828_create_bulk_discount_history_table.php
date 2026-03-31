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
        Schema::create('bulk_discount_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained()->onDelete('cascade');
            $table->foreignId('applied_by_user_id')->constrained('users')->onDelete('cascade');
            
            // Discount details
            $table->enum('discount_type', ['category', 'brand', 'supplier'])->index();
            $table->string('discount_target'); // category_id, brand_id, or supplier_id
            $table->string('discount_target_name'); // Name for display
            $table->decimal('discount_percentage', 5, 2);
            $table->integer('items_affected');
            $table->decimal('total_discount_amount', 10, 2);
            
            // Metadata
            $table->json('applied_items'); // Array of item IDs and their discount details
            $table->json('discount_rules')->nullable(); // Original discount rules for reference
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['sales_order_id', 'created_at']);
            $table->index(['discount_type', 'discount_target']);
            $table->index(['applied_by_user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bulk_discount_history');
    }
};
