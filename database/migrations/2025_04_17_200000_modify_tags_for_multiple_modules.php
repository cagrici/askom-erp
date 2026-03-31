<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Mevcut tags tablosunu değiştirin (eğer yoksa oluşturun)
        if (!Schema::hasTable('tags')) {
            Schema::create('tags', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->string('color')->nullable();
                $table->string('type')->nullable(); // news, document, project vb.
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();
                
                // İsim ve tipe göre benzersizlik
                $table->unique(['name', 'type']);
            });
        } else {
            Schema::table('tags', function (Blueprint $table) {
                if (!Schema::hasColumn('tags', 'slug')) {
                    $table->string('slug')->unique()->after('name');
                }
                if (!Schema::hasColumn('tags', 'type')) {
                    $table->string('type')->nullable()->after('description'); // news, document, project vb.
                }
                if (!Schema::hasColumn('tags', 'color')) {
                    $table->string('color')->nullable()->after('description');
                }
                if (!Schema::hasColumn('tags', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('type');
                }
                if (!Schema::hasColumn('tags', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }

        // 2. Taggable ara tablosu oluşturun (polimorfik ilişki için)
        if (!Schema::hasTable('taggables')) {
            Schema::create('taggables', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tag_id')->constrained()->onDelete('cascade');
                $table->morphs('taggable'); // taggable_id ve taggable_type sütunları oluşturacak
                $table->timestamps();
                
                // Benzersiz indeks
                $table->unique(['tag_id', 'taggable_id', 'taggable_type'], 'unique_tag_relation');
            });
        }

        // 3. news_tags tablosundan verileri yeni tags tablosuna taşıyın (eğer news_tags tablosu varsa)
        if (Schema::hasTable('news_tags')) {
            $newsTags = DB::table('news_tags')->get();
            
            foreach ($newsTags as $newsTag) {
                // Önce tag var mı kontrol et
                $existingTag = DB::table('tags')
                    ->where('name', $newsTag->name)
                    ->where('type', 'news')
                    ->first();
                
                if (!$existingTag) {
                    // Yeni tag ekle
                    $tagId = DB::table('tags')->insertGetId([
                        'name' => $newsTag->name,
                        'slug' => $newsTag->slug,
                        'type' => 'news',
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $tagId = $existingTag->id;
                }
                
                // news_post_tag tablosundaki ilişkileri taggables tablosuna taşı
                if (Schema::hasTable('news_post_tag')) {
                    $taggedPosts = DB::table('news_post_tag')
                        ->where('news_tag_id', $newsTag->id)
                        ->get();
                    
                    foreach ($taggedPosts as $taggedPost) {
                        // İlişki zaten var mı kontrol et
                        $existingRelation = DB::table('taggables')
                            ->where('tag_id', $tagId)
                            ->where('taggable_id', $taggedPost->news_post_id)
                            ->where('taggable_type', 'App\\Models\\NewsPost')
                            ->first();
                        
                        if (!$existingRelation) {
                            // Yeni ilişki ekle
                            DB::table('taggables')->insert([
                                'tag_id' => $tagId,
                                'taggable_id' => $taggedPost->news_post_id,
                                'taggable_type' => 'App\\Models\\NewsPost',
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Bu migration geri alındığında hiçbir şey yapma
        // Verileri silmek önerilmez, çünkü yeni sisteme geçilmiş olabilir
    }
};
