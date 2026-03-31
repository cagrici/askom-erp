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
        if (!Schema::hasColumn('current_accounts', 'logo_id')) {
            Schema::table('current_accounts', function (Blueprint $table) {
                $table->bigInteger('logo_id')->nullable()->after('id')->index()->comment('Logo LOGICALREF');
            });
        }

        if (!Schema::hasColumn('current_accounts', 'logo_firm_no')) {
            Schema::table('current_accounts', function (Blueprint $table) {
                $table->integer('logo_firm_no')->nullable()->after('logo_id')->comment('Logo firm number');
            });
        }

        if (!Schema::hasColumn('current_accounts', 'address_line_1')) {
            Schema::table('current_accounts', function (Blueprint $table) {
                $table->string('address_line_1')->nullable()->comment('Address line 1');
            });
        }

        if (!Schema::hasColumn('current_accounts', 'address_line_2')) {
            Schema::table('current_accounts', function (Blueprint $table) {
                $table->string('address_line_2')->nullable()->comment('Address line 2');
            });
        }

        if (!Schema::hasColumn('current_accounts', 'logo_synced_at')) {
            Schema::table('current_accounts', function (Blueprint $table) {
                $table->timestamp('logo_synced_at')->nullable()->comment('Last synced from Logo');
            });
        }

        // Add composite index for faster Logo lookups
        Schema::table('current_accounts', function (Blueprint $table) {
            $table->index(['logo_id', 'logo_firm_no'], 'idx_logo_sync');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('current_accounts', function (Blueprint $table) {
            $table->dropIndex('idx_logo_sync');
            $table->dropColumn([
                'logo_id',
                'logo_firm_no',
                'address_line_1',
                'address_line_2',
                'logo_synced_at',
            ]);
        });
    }
};
