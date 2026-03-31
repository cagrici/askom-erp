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
        Schema::table('inventory_movements', function (Blueprint $table) {
            // Make key fields nullable for manual adjustments
            $table->unsignedBigInteger('inventory_item_id')->nullable()->change();
            $table->unsignedBigInteger('inventory_stock_id')->nullable()->change();
            $table->string('direction')->nullable()->change();
            $table->datetime('movement_date')->nullable()->change();
            $table->datetime('effective_date')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_movements', function (Blueprint $table) {
            // Revert nullable changes (if needed)
            $table->unsignedBigInteger('inventory_item_id')->nullable(false)->change();
            $table->unsignedBigInteger('inventory_stock_id')->nullable(false)->change();
            $table->string('direction')->nullable(false)->change();
            $table->datetime('movement_date')->nullable(false)->change();
            $table->datetime('effective_date')->nullable(false)->change();
        });
    }
};
