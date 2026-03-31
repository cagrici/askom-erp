<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('sales_orders', 'logo_ficheno')) {
            Schema::table('sales_orders', function (Blueprint $table) {
                $table->string('logo_ficheno', 50)->nullable()->after('logo_firm_no')->comment('Logo FICHENO (siparis numarasi)');
            });
        }
    }

    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropColumn('logo_ficheno');
        });
    }
};
