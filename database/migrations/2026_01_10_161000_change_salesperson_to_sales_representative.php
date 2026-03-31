<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Changes salesperson_id from referencing users to sales_representatives
     */
    public function up(): void
    {
        // Clear existing salesperson_id values that previously referenced users table
        // These will be repopulated by Logo sync with correct sales_representative IDs
        DB::table('sales_orders')->update(['salesperson_id' => null]);

        Schema::table('sales_orders', function (Blueprint $table) {
            // Add foreign key constraint to sales_representatives
            $table->foreign('salesperson_id')
                ->references('id')
                ->on('sales_representatives')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropForeign(['salesperson_id']);
        });

        // Note: Original table had no FK on salesperson_id, just an index
        // Data cannot be automatically restored since IDs now reference different table
    }
};
