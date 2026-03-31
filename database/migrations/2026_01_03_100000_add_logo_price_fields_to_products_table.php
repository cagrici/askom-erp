<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Logo Tiger'dan senkronize edilen fiyat alanları
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Logo'dan gelen ana fiyatlar
            if (!Schema::hasColumn('products', 'logo_sale_price')) {
                $table->decimal('logo_sale_price', 15, 4)->nullable()->after('sale_price')
                    ->comment('Logo satış fiyatı');
            }

            if (!Schema::hasColumn('products', 'logo_purchase_price')) {
                $table->decimal('logo_purchase_price', 15, 4)->nullable()->after('logo_sale_price')
                    ->comment('Logo alış fiyatı');
            }

            if (!Schema::hasColumn('products', 'logo_currency')) {
                $table->string('logo_currency', 10)->nullable()->after('logo_purchase_price')
                    ->comment('Logo fiyat para birimi');
            }

            if (!Schema::hasColumn('products', 'logo_price_synced_at')) {
                $table->timestamp('logo_price_synced_at')->nullable()->after('logo_synced_at')
                    ->comment('Logo fiyat son senkronizasyon zamanı');
            }
        });

        // product_prices tablosuna Logo alanları ekle
        Schema::table('product_prices', function (Blueprint $table) {
            if (!Schema::hasColumn('product_prices', 'logo_id')) {
                $table->bigInteger('logo_id')->nullable()->after('id')
                    ->comment('Logo LOGICALREF');
            }

            if (!Schema::hasColumn('product_prices', 'logo_firm_no')) {
                $table->integer('logo_firm_no')->nullable()->after('logo_id')
                    ->comment('Logo firma numarası');
            }

            if (!Schema::hasColumn('product_prices', 'logo_synced_at')) {
                $table->timestamp('logo_synced_at')->nullable()
                    ->comment('Logo senkronizasyon zamanı');
            }
        });

        // product_price_lists tablosuna Logo alanları ekle
        Schema::table('product_price_lists', function (Blueprint $table) {
            if (!Schema::hasColumn('product_price_lists', 'logo_id')) {
                $table->bigInteger('logo_id')->nullable()->after('id')
                    ->comment('Logo LOGICALREF');
            }

            if (!Schema::hasColumn('product_price_lists', 'logo_firm_no')) {
                $table->integer('logo_firm_no')->nullable()->after('logo_id')
                    ->comment('Logo firma numarası');
            }

            if (!Schema::hasColumn('product_price_lists', 'logo_synced_at')) {
                $table->timestamp('logo_synced_at')->nullable()
                    ->comment('Logo senkronizasyon zamanı');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $columns = ['logo_sale_price', 'logo_purchase_price', 'logo_currency', 'logo_price_synced_at'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('products', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('product_prices', function (Blueprint $table) {
            $columns = ['logo_id', 'logo_firm_no', 'logo_synced_at'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('product_prices', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('product_price_lists', function (Blueprint $table) {
            $columns = ['logo_id', 'logo_firm_no', 'logo_synced_at'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('product_price_lists', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
