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
        Schema::table('permissions', function (Blueprint $table) {
            $table->string('display_name')->nullable()->after('name');
            $table->string('group')->nullable()->after('module');
            $table->integer('order')->default(0)->after('group');
            $table->boolean('is_active')->default(true)->after('order');
        });

        // Roles tablosuna ek alanlar
        Schema::table('roles', function (Blueprint $table) {
            $table->integer('level')->default(1)->after('is_system');
            $table->boolean('is_active')->default(true)->after('level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropColumn(['display_name', 'group', 'order', 'is_active']);
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn(['level', 'is_active']);
        });
    }
};