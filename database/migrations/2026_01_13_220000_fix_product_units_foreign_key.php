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
        // Find and drop the foreign key constraint pointing to products_ticimax
        $constraints = DB::select("
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'product_units'
            AND COLUMN_NAME = 'product_id'
            AND REFERENCED_TABLE_NAME = 'products_ticimax'
        ");

        Schema::table('product_units', function (Blueprint $table) use ($constraints) {
            foreach ($constraints as $constraint) {
                $table->dropForeign($constraint->CONSTRAINT_NAME);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We don't want to restore this incorrect constraint
    }
};
