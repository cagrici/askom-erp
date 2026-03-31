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
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('currency', 10); // USD, EUR, GBP, etc.
            $table->integer('cur_id')->nullable(); // 115,116,117 etc.
            $table->string('currency_name')->nullable(); // ABD Doları, Euro, etc.
            $table->decimal('value', 10, 4); // Exchange rate value
            $table->string('type', 1)->default('A'); // A: Alış (Buy), S: Satış (Sell)
            $table->boolean('is_average')->default(false);
            $table->timestamp('rate_timestamp')->nullable(); // Original timestamp from API
            $table->json('raw_data')->nullable(); // Store original API response
            $table->timestamps();

            // Indexes
            $table->index(['date', 'currency']);
            $table->index(['currency', 'date']);
            $table->unique(['date', 'currency', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_rates');
    }
};
