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
        Schema::create('taxes', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // KDV, ÖTV, ÖIV, Stopaj etc.
            $table->string('type'); // percentage, fixed
            $table->decimal('rate', 8, 4); // Tax rate (e.g., 18.0000 for 18%)
            $table->decimal('fixed_amount', 10, 4)->nullable(); // For fixed taxes
            $table->string('code', 10)->unique(); // Tax code for reports (KDV18, OTV10 etc.)
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->string('country', 3)->default('TR'); // For international taxes
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('taxes');
    }
};
