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
        if (!Schema::hasColumn('sales_order_items', 'logo_id')) {
            Schema::table('sales_order_items', function (Blueprint $table) {
                $table->bigInteger('logo_id')->nullable()->after('id')->index()->comment('Logo LOGICALREF from ORFLINE');
            });
        }

        if (!Schema::hasColumn('sales_order_items', 'logo_firm_no')) {
            Schema::table('sales_order_items', function (Blueprint $table) {
                $table->integer('logo_firm_no')->nullable()->after('logo_id')->comment('Logo firm number');
            });
        }

        if (!Schema::hasColumn('sales_order_items', 'logo_order_ref')) {
            Schema::table('sales_order_items', function (Blueprint $table) {
                $table->bigInteger('logo_order_ref')->nullable()->comment('Logo ORDFICHEREF - reference to order header');
            });
        }

        if (!Schema::hasColumn('sales_order_items', 'logo_synced_at')) {
            Schema::table('sales_order_items', function (Blueprint $table) {
                $table->timestamp('logo_synced_at')->nullable()->comment('Last synced from Logo');
            });
        }

        // Add composite index for faster Logo lookups
        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->index(['logo_id', 'logo_firm_no'], 'idx_sales_order_items_logo_sync');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->dropIndex('idx_sales_order_items_logo_sync');
            $table->dropColumn([
                'logo_id',
                'logo_firm_no',
                'logo_order_ref',
                'logo_synced_at',
            ]);
        });
    }
};
