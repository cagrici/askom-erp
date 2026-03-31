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
        // Default language is Turkish as per app config
        $defaultLocale = 'tr';
        
        // Get all products and migrate their data to translations table
        DB::table('products')->orderBy('id')->chunk(100, function ($products) use ($defaultLocale) {
            $translations = [];
            
            foreach ($products as $product) {
                // Only migrate if the product has translatable content
                if (!empty($product->name) || !empty($product->description) || !empty($product->short_description)) {
                    $translations[] = [
                        'product_id' => $product->id,
                        'locale' => $defaultLocale,
                        'name' => $product->name ?? '',
                        'description' => $product->description,
                        'short_description' => $product->short_description,
                        'meta_title' => $product->meta_title,
                        'meta_description' => $product->meta_description,
                        'meta_keywords' => $product->meta_keywords,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
            
            if (!empty($translations)) {
                DB::table('product_translations')->insert($translations);
            }
        });
        
        echo "\nMigrated " . DB::table('products')->count() . " products to translations table with locale: {$defaultLocale}\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove all Turkish translations that were created by this migration
        DB::table('product_translations')->where('locale', 'tr')->delete();
        echo "\nRemoved Turkish translations from product_translations table\n";
    }
};
