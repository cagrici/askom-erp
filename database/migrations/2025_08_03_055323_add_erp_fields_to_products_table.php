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
        Schema::table('products', function (Blueprint $table) {
            // Sadece eksik olan alanları ekle
            if (!Schema::hasColumn('products', 'is_stockable')) {
                $table->boolean('is_stockable')->default(true)->after('product_type')->comment('Stoklanabilir mi? (hizmetler için false)');
            }
            if (!Schema::hasColumn('products', 'is_serialized')) {
                $table->boolean('is_serialized')->default(false)->after('is_stockable')->comment('Seri numaralı takip edilir mi?');
            }
            if (!Schema::hasColumn('products', 'lead_time_days')) {
                $table->decimal('lead_time_days', 8, 2)->nullable()->after('is_serialized')->comment('Tedarik süresi (gün)');
            }
            if (!Schema::hasColumn('products', 'purchase_uom')) {
                $table->string('purchase_uom', 20)->nullable()->after('lead_time_days')->comment('Satın alma birimi');
            }
            if (!Schema::hasColumn('products', 'sales_uom')) {
                $table->string('sales_uom', 20)->nullable()->after('purchase_uom')->comment('Satış birimi');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Sadece yeni eklenen alanları kaldır
            $table->dropColumn([
                'is_stockable',
                'is_serialized',
                'lead_time_days',
                'purchase_uom',
                'sales_uom'
            ]);
        });
    }
};
