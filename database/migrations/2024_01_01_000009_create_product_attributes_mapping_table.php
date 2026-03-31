<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('product_attributes_mapping', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('attribute_id')->constrained('product_attributes')->onDelete('cascade');
            $table->foreignId('attribute_value_id')->nullable()->constrained('attribute_values')->onDelete('cascade');
            $table->string('value')->nullable();
            $table->timestamps();
            
            $table->unique(['product_id', 'attribute_id']);
            $table->index(['attribute_id', 'attribute_value_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('product_attributes_mapping');
    }
};