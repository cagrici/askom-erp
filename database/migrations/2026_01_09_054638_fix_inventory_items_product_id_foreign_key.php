<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Fix foreign key on inventory_items.product_id to reference 'products' table
     * instead of 'products_ticimax' table.
     */
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            // Drop the existing foreign key that references products_ticimax
            $table->dropForeign(['product_id']);
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            // Add new foreign key referencing products table
            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            // Drop the products foreign key
            $table->dropForeign(['product_id']);
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            // Restore the products_ticimax foreign key
            $table->foreign('product_id')
                ->references('id')
                ->on('products_ticimax')
                ->onDelete('cascade');
        });
    }
};
