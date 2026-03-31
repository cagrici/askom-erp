<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('product_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('price_list_id')->constrained('product_price_lists')->onDelete('cascade');
            $table->decimal('price', 15, 2);
            $table->decimal('min_quantity', 10, 2)->default(1);
            $table->decimal('discount_percentage', 5, 2)->nullable();
            $table->decimal('discount_amount', 15, 2)->nullable();
            $table->timestamps();
            
            $table->unique(['product_id', 'price_list_id', 'min_quantity']);
            $table->index(['price_list_id', 'product_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('product_prices');
    }
};