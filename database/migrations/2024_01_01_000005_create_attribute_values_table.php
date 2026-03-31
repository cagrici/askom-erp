<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_id')->constrained('product_attributes')->onDelete('cascade');
            $table->string('value');
            $table->string('color_hex')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['attribute_id', 'value']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('attribute_values');
    }
};