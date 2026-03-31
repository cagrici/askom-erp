<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Dövizli ürün fiyatlarının TL karşılıklarını tutmak için alanlar ekler.
     * Bu alanlar günlük döviz kurlarına göre otomatik güncellenir.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Satış fiyatının TL karşılığı (günlük güncellenir)
            if (!Schema::hasColumn('products', 'sale_price_try')) {
                $table->decimal('sale_price_try', 15, 4)->nullable()
                    ->after('sale_price')
                    ->comment('Satış fiyatının TL karşılığı');
            }

            // Maliyet fiyatının TL karşılığı (günlük güncellenir)
            if (!Schema::hasColumn('products', 'cost_price_try')) {
                $table->decimal('cost_price_try', 15, 4)->nullable()
                    ->after('cost_price')
                    ->comment('Maliyet fiyatının TL karşılığı');
            }

            // Fiyatın hangi tarihte TL'ye dönüştürüldüğü
            if (!Schema::hasColumn('products', 'price_converted_at')) {
                $table->date('price_converted_at')->nullable()
                    ->after('logo_price_synced_at')
                    ->comment('TL dönüşümünün yapıldığı tarih');
            }

            // Para birimi alanı yoksa ekle (logo_currency zaten var, bu genel currency)
            if (!Schema::hasColumn('products', 'currency')) {
                $table->string('currency', 3)->default('TRY')
                    ->after('sale_price_try')
                    ->comment('Ürün fiyat para birimi (TRY, USD, EUR)');
            }
        });

        // Index ekle - TL fiyat sorgularını hızlandırmak için
        Schema::table('products', function (Blueprint $table) {
            $table->index('sale_price_try', 'products_sale_price_try_index');
            $table->index('currency', 'products_currency_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $columns = ['sale_price_try', 'cost_price_try', 'price_converted_at', 'currency'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('products', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
