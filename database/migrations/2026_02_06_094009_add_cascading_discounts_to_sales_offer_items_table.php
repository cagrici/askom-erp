<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales_offer_items', function (Blueprint $table) {
            // Rename existing discount_rate to discount_rate1
            $table->renameColumn('discount_rate', 'discount_rate1');
        });

        Schema::table('sales_offer_items', function (Blueprint $table) {
            // Add discount_rate2 and discount_rate3
            $table->decimal('discount_rate2', 5, 2)->default(0)->after('discount_rate1');
            $table->decimal('discount_rate3', 5, 2)->default(0)->after('discount_rate2');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_offer_items', function (Blueprint $table) {
            $table->dropColumn(['discount_rate2', 'discount_rate3']);
        });

        Schema::table('sales_offer_items', function (Blueprint $table) {
            $table->renameColumn('discount_rate1', 'discount_rate');
        });
    }
};
