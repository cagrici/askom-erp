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
        Schema::table('units', function (Blueprint $table) {
            // Logo UNITSETL.LOGICALREF - Sipariş satırlarında UOMREF olarak kullanılır
            $table->unsignedBigInteger('logo_unit_ref')->nullable()->after('id');
            $table->index('logo_unit_ref');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->dropIndex(['logo_unit_ref']);
            $table->dropColumn('logo_unit_ref');
        });
    }
};
