<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Logo stores amounts in TRY but tracks the pricing currency separately.
     * This migration adds fields to show foreign currency equivalents like Logo does.
     */
    public function up(): void
    {
        // Add pricing_currency to sales_orders
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->string('pricing_currency', 3)->nullable()->after('exchange_rate')
                ->comment('Logo pricing currency (TRCURR): USD, EUR, etc. Null or TRY means no foreign currency');
        });

        // Add foreign currency fields to sales_order_items
        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->string('pricing_currency', 3)->nullable()->after('line_total')
                ->comment('Item pricing currency from Logo');
            $table->decimal('foreign_unit_price', 15, 4)->nullable()->after('pricing_currency')
                ->comment('Unit price in foreign currency');
            $table->decimal('foreign_line_total', 15, 2)->nullable()->after('foreign_unit_price')
                ->comment('Line total in foreign currency');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropColumn('pricing_currency');
        });

        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->dropColumn(['pricing_currency', 'foreign_unit_price', 'foreign_line_total']);
        });
    }
};
