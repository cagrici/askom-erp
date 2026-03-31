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
        if (!Schema::hasColumn('products', 'logo_image_synced_at')) {
            Schema::table('products', function (Blueprint $table) {
                $table->timestamp('logo_image_synced_at')->nullable()->after('logo_synced_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('logo_image_synced_at');
        });
    }
};
