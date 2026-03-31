<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Brand;
use App\Models\Product; 
use Illuminate\Database\Seeder;

class ProductTestSeeder extends Seeder
{
    public function run(): void
    {
        // Test kategorileri oluştur
        $electronics = Category::create([
            'name' => 'Elektronik',
            'slug' => 'elektronik',
            'description' => 'Elektronik ürünler',
            'type' => 'product',
            'is_active' => true,
            'display_order' => 1
        ]);

        $clothing = Category::create([
            'name' => 'Giyim',
            'slug' => 'giyim', 
            'description' => 'Giyim ürünleri',
            'type' => 'product',
            'is_active' => true,
            'display_order' => 2
        ]);

        // Test markaları oluştur
        $apple = Brand::create([
            'name' => 'Apple',
            'slug' => 'apple',
            'description' => 'Apple ürünleri',
            'is_active' => true
        ]);

        $samsung = Brand::create([
            'name' => 'Samsung',
            'slug' => 'samsung',
            'description' => 'Samsung ürünleri', 
            'is_active' => true
        ]);

        // Test ürünleri oluştur
        Product::create([
            'code' => 'PROD001',
            'name' => 'iPhone 15',
            'slug' => 'iphone-15',
            'description' => 'Apple iPhone 15',
            'category_id' => $electronics->id,
            'brand_id' => $apple->id,
            'sale_price' => 25000.00,
            'cost_price' => 20000.00,
            'stock_quantity' => 10,
            'min_stock_level' => 5,
            'sku' => 'SKU001',
            'product_type' => 'simple',
            'is_active' => true,
            'track_inventory' => true
        ]);

        Product::create([
            'code' => 'PROD002', 
            'name' => 'Samsung Galaxy S24',
            'slug' => 'samsung-galaxy-s24',
            'description' => 'Samsung Galaxy S24',
            'category_id' => $electronics->id,
            'brand_id' => $samsung->id,
            'sale_price' => 22000.00,
            'cost_price' => 18000.00,
            'stock_quantity' => 15,
            'min_stock_level' => 5,
            'sku' => 'SKU002',
            'product_type' => 'simple',
            'is_active' => true,
            'track_inventory' => true
        ]);

        Product::create([
            'code' => 'PROD003',
            'name' => 'T-Shirt',
            'slug' => 't-shirt',
            'description' => 'Pamuklu T-Shirt',
            'category_id' => $clothing->id,
            'sale_price' => 150.00,
            'cost_price' => 80.00,
            'stock_quantity' => 50,
            'min_stock_level' => 10,
            'sku' => 'SKU003',
            'product_type' => 'simple',
            'is_active' => true,
            'track_inventory' => true
        ]);

        // İnaktif test ürünü
        Product::create([
            'code' => 'PROD004',
            'name' => 'Eski iPhone 12',
            'slug' => 'eski-iphone-12',
            'description' => 'Artık satılmayan iPhone 12',
            'category_id' => $electronics->id,
            'brand_id' => $apple->id,
            'sale_price' => 18000.00,
            'cost_price' => 15000.00,
            'stock_quantity' => 0,
            'min_stock_level' => 0,
            'sku' => 'SKU004',
            'product_type' => 'simple',
            'is_active' => false, // İnaktif ürün
            'track_inventory' => true
        ]);
    }
}