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
        // Countries table
        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 2)->unique(); // ISO 2-digit code (TR, US, etc.)
            $table->string('code_3', 3)->unique(); // ISO 3-digit code (TUR, USA, etc.)
            $table->string('phone_code', 10)->nullable(); // +90, +1, etc.
            $table->string('currency_code', 3)->nullable(); // TRY, USD, etc.
            $table->string('currency_symbol', 5)->nullable(); // ₺, $, etc.
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['is_active', 'sort_order']);
        });

        // Cities table
        Schema::create('cities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('code', 10)->nullable(); // Plate code for Turkey (34, 06, etc.)
            $table->string('region', 50)->nullable(); // Marmara, İç Anadolu, etc.
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['country_id', 'is_active']);
            $table->index(['name']);
        });

        // Districts table
        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('city_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('postal_code', 10)->nullable();
            $table->string('type', 20)->default('district'); // district, town, village
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['city_id', 'is_active']);
            $table->index(['name']);
        });

        // Tax offices table for Turkish tax system
        Schema::create('tax_offices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('city_id')->constrained()->cascadeOnDelete();
            $table->string('name', 200);
            $table->string('code', 10)->nullable(); // Tax office code
            $table->string('type', 50)->default('vergi_dairesi'); // vergi_dairesi, mal_müdürlüğü
            $table->text('address')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('fax', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['city_id', 'is_active']);
            $table->index(['name']);
            $table->index(['code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tax_offices');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('cities');
        Schema::dropIfExists('countries');
    }
};