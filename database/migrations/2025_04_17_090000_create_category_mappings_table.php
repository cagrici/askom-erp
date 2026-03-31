<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Geçiş sırasında eski kategori ID'lerini yeni ID'lerle eşleyen geçici tablo
        Schema::create('category_mappings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('old_category_id');
            $table->string('old_category_table');
            $table->unsignedBigInteger('new_category_id');
            $table->timestamps();
            
            // Bir eski kategorinin sadece bir yeni karşılığı olabilir
            $table->unique(['old_category_id', 'old_category_table']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('category_mappings');
    }
};
