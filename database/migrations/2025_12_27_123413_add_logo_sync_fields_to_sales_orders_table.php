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
        if (!Schema::hasColumn('sales_orders', 'logo_id')) {
            Schema::table('sales_orders', function (Blueprint $table) {
                $table->bigInteger('logo_id')->nullable()->after('id')->index()->comment('Logo LOGICALREF from ORFICHE');
            });
        }

        if (!Schema::hasColumn('sales_orders', 'logo_firm_no')) {
            Schema::table('sales_orders', function (Blueprint $table) {
                $table->integer('logo_firm_no')->nullable()->after('logo_id')->comment('Logo firm number');
            });
        }

        if (!Schema::hasColumn('sales_orders', 'logo_synced_at')) {
            Schema::table('sales_orders', function (Blueprint $table) {
                $table->timestamp('logo_synced_at')->nullable()->comment('Last synced from Logo');
            });
        }

        // Add composite index for faster Logo lookups
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->index(['logo_id', 'logo_firm_no'], 'idx_sales_orders_logo_sync');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropIndex('idx_sales_orders_logo_sync');
            $table->dropColumn([
                'logo_id',
                'logo_firm_no',
                'logo_synced_at',
            ]);
        });
    }
};
