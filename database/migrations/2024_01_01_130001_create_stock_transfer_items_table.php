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
        Schema::create('stock_transfer_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('stock_transfer_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('product_unit_id')->nullable();
            
            // Quantity fields
            $table->decimal('quantity', 15, 2)->default(0); // Requested quantity
            $table->decimal('transferred_quantity', 15, 2)->default(0); // Actually transferred
            $table->decimal('received_quantity', 15, 2)->default(0); // Actually received
            
            // Cost fields
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            
            // Additional tracking
            $table->text('notes')->nullable();
            $table->json('serial_numbers')->nullable(); // For serialized items
            $table->json('batch_numbers')->nullable(); // For batch tracked items
            $table->date('expiry_date')->nullable(); // For items with expiry
            
            $table->timestamps();

            // Foreign keys
            $table->foreign('stock_transfer_id')->references('id')->on('stock_transfers')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('product_unit_id')->references('id')->on('product_units')->onDelete('set null');

            // Indexes
            $table->index(['stock_transfer_id', 'product_id']);
            $table->index('product_id');
            $table->index('expiry_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transfer_items');
    }
};