<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('variant_code')->unique();
            $table->string('variant_name');
            $table->string('barcode')->nullable()->index();
            $table->decimal('price', 15, 2)->nullable();
            $table->decimal('cost_price', 15, 2)->nullable();
            $table->integer('stock_quantity')->default(0);
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('attributes');
            $table->timestamps();
            
            $table->index(['product_id', 'is_active']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('product_variants');
    }
};