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
        Schema::table('current_accounts', function (Blueprint $table) {
            // Add sales_representative_id foreign key column
            if (!Schema::hasColumn('current_accounts', 'sales_representative_id')) {
                $table->foreignId('sales_representative_id')->nullable()->after('region')->constrained()->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('current_accounts', function (Blueprint $table) {
            if (Schema::hasColumn('current_accounts', 'sales_representative_id')) {
                $table->dropForeign(['sales_representative_id']);
                $table->dropColumn('sales_representative_id');
            }
        });
    }
};
