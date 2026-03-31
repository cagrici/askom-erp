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
        Schema::table('inventory_movements', function (Blueprint $table) {
            // Add product_id if it doesn't exist
            if (!Schema::hasColumn('inventory_movements', 'product_id')) {
                $table->foreignId('product_id')->nullable()->constrained()->onDelete('cascade')->after('inventory_stock_id');
            }
            
            // Add created_by_id if it doesn't exist
            if (!Schema::hasColumn('inventory_movements', 'created_by_id')) {
                $table->foreignId('created_by_id')->nullable()->constrained('users')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_movements', function (Blueprint $table) {
            if (Schema::hasColumn('inventory_movements', 'product_id')) {
                $table->dropForeign(['product_id']);
                $table->dropColumn('product_id');
            }
            
            if (Schema::hasColumn('inventory_movements', 'created_by_id')) {
                $table->dropForeign(['created_by_id']);
                $table->dropColumn('created_by_id');
            }
        });
    }
};
