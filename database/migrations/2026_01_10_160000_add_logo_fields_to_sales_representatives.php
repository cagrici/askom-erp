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
        Schema::table('sales_representatives', function (Blueprint $table) {
            $table->unsignedBigInteger('logo_id')->nullable()->after('id')->comment('Logo SLSMAN.LOGICALREF');
            $table->string('logo_code', 50)->nullable()->after('logo_id')->comment('Logo SLSMAN.CODE');
            $table->unsignedSmallInteger('logo_firm_no')->nullable()->after('logo_code');
            $table->unsignedBigInteger('logo_user_id')->nullable()->after('logo_firm_no')->comment('Logo SLSMAN.USERID');
            $table->timestamp('logo_synced_at')->nullable()->after('logo_user_id');

            // Indexes
            $table->index(['logo_id', 'logo_firm_no'], 'sales_reps_logo_idx');
            $table->index('logo_code', 'sales_reps_logo_code_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_representatives', function (Blueprint $table) {
            $table->dropIndex('sales_reps_logo_idx');
            $table->dropIndex('sales_reps_logo_code_idx');
            $table->dropColumn(['logo_id', 'logo_code', 'logo_firm_no', 'logo_user_id', 'logo_synced_at']);
        });
    }
};
