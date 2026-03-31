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
        if (!Schema::hasColumn('products', 'logo_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->bigInteger('logo_id')->nullable()->after('id')->index()->comment('Logo LOGICALREF');
            });
        }

        if (!Schema::hasColumn('products', 'logo_firm_no')) {
            Schema::table('products', function (Blueprint $table) {
                $table->integer('logo_firm_no')->nullable()->after('logo_id')->comment('Logo firm number');
            });
        }

        if (!Schema::hasColumn('products', 'logo_producer_code')) {
            Schema::table('products', function (Blueprint $table) {
                $table->string('logo_producer_code', 101)->nullable()->comment('Logo PRODUCERCODE');
            });
        }

        if (!Schema::hasColumn('products', 'logo_specode')) {
            Schema::table('products', function (Blueprint $table) {
                $table->string('logo_specode', 11)->nullable()->comment('Logo SPECODE (supplier/brand code)');
            });
        }

        if (!Schema::hasColumn('products', 'logo_synced_at')) {
            Schema::table('products', function (Blueprint $table) {
                $table->timestamp('logo_synced_at')->nullable()->comment('Last synced from Logo');
            });
        }

        // Add composite index for faster Logo lookups
        Schema::table('products', function (Blueprint $table) {
            $table->index(['logo_id', 'logo_firm_no'], 'idx_products_logo_sync');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('idx_products_logo_sync');
            $table->dropColumn([
                'logo_id',
                'logo_firm_no',
                'logo_producer_code',
                'logo_specode',
                'logo_synced_at',
            ]);
        });
    }
};
