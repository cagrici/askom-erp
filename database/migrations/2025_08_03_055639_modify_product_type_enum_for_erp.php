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
        // Önce enum'u genişlet (mevcut değerleri koruyarak)
        DB::statement("ALTER TABLE products MODIFY COLUMN product_type ENUM('simple', 'variable', 'bundle', 'grouped', 'raw_material', 'finished_goods', 'semi_finished', 'trading_goods', 'service', 'consumable') DEFAULT 'trading_goods' COMMENT 'Ürün tipi'");
        
        // Sonra mevcut değerleri güncelle
        DB::statement("UPDATE products SET product_type = 'trading_goods' WHERE product_type IN ('simple', 'variable', 'bundle', 'grouped')");
        
        // Son olarak enum'u temizle
        DB::statement("ALTER TABLE products MODIFY COLUMN product_type ENUM('raw_material', 'finished_goods', 'semi_finished', 'trading_goods', 'service', 'consumable') DEFAULT 'trading_goods' COMMENT 'Ürün tipi'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Enum'u eski haline döndür
        DB::statement("ALTER TABLE products MODIFY COLUMN product_type ENUM('simple', 'variable', 'bundle', 'grouped') DEFAULT 'simple'");
    }
};
