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
        Schema::table('brands', function (Blueprint $table) {
            // Logo MARK tablosu referansları
            $table->unsignedBigInteger('logo_id')->nullable()->after('id');
            $table->string('logo_code', 50)->nullable()->after('logo_id');
            $table->timestamp('logo_synced_at')->nullable()->after('logo_code');

            $table->index('logo_id');
            $table->index('logo_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            $table->dropIndex(['logo_id']);
            $table->dropIndex(['logo_code']);
            $table->dropColumn(['logo_id', 'logo_code', 'logo_synced_at']);
        });
    }
};
