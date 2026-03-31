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
        Schema::create('supplier_offer_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_offer_id')->constrained('supplier_offers')->onDelete('cascade');
            $table->foreignId('purchase_request_item_id')->nullable()->constrained('purchase_request_items')->onDelete('set null');
            $table->foreignId('inventory_item_id')->nullable()->constrained('inventory_items')->onDelete('set null');
            $table->string('item_code')->nullable();
            $table->string('item_name');
            $table->text('description')->nullable();
            $table->decimal('quantity', 15, 4);
            $table->string('unit')->default('adet');
            $table->decimal('unit_price', 15, 4);
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_percentage', 5, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2);
            $table->string('manufacturer')->nullable();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->integer('delivery_days')->nullable();
            $table->text('technical_specs')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('supplier_offer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_offer_items');
    }
};
