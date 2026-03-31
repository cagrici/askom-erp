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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('color')->nullable();
            $table->string('icon')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->onDelete('set null');
            $table->string('type')->nullable()->comment('İsteğe bağlı kategori tipi (duyuru, döküman, yemek vb.)');
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->json('meta_data')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // İsim ve tipe göre benzersiz indeks
            $table->unique(['name', 'type']);
        });

        // Kategorize edilebilir tablosu (polimorfik ilişki için)
        Schema::create('categorizables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->morphs('categorizable'); // categorizable_type ve categorizable_id sütunları oluşturur
            $table->timestamps();
            
            // Benzersiz indeks
            $table->unique(['category_id', 'categorizable_id', 'categorizable_type'], 'unique_category_relation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categorizables');
        Schema::dropIfExists('categories');
    }
};
