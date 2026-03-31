<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('product_price_lists', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->enum('type', ['sale', 'purchase', 'special'])->default('sale');
            $table->string('currency', 3)->default('TRY');
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->json('customer_groups')->nullable();
            $table->timestamps();
            
            $table->index(['type', 'is_active']);
            $table->index(['valid_from', 'valid_until']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('product_price_lists');
    }
};