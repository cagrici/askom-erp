<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->decimal('discount_rate1', 5, 2)->default(0)->after('unit_price');
            $table->decimal('discount_rate2', 5, 2)->default(0)->after('discount_rate1');
            $table->decimal('discount_rate3', 5, 2)->default(0)->after('discount_rate2');
        });

        // Mevcut discount_percentage degerlerini discount_rate1'e kopyala
        DB::statement('UPDATE sales_order_items SET discount_rate1 = discount_percentage WHERE discount_percentage > 0');
    }

    public function down(): void
    {
        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->dropColumn(['discount_rate1', 'discount_rate2', 'discount_rate3']);
        });
    }
};
