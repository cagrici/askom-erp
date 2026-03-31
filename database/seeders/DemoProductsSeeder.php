<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoProductsSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'code' => 'KHV001',
                'name' => 'Kahve - Türk Kahvesi',
                'cost_price' => 150.00,
                'sale_price' => 180.00,
                'currency' => 'TRY',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'KHV002', 
                'name' => 'Kahve - Espresso',
                'cost_price' => 200.00,
                'sale_price' => 240.00,
                'currency' => 'TRY',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'CHY001',
                'name' => 'Çay - Earl Grey',
                'cost_price' => 80.00,
                'sale_price' => 100.00,
                'currency' => 'TRY',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'SUU001',
                'name' => 'Su - İçme Suyu 19L',
                'cost_price' => 15.00,
                'sale_price' => 20.00,
                'currency' => 'TRY',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'KGT001',
                'name' => 'Kağıt - A4 500 Yaprak',
                'cost_price' => 35.00,
                'sale_price' => 45.00,
                'currency' => 'TRY',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($products as $product) {
            DB::table('products')->insertOrIgnore($product);
        }

        $this->command->info('Demo products added: ' . count($products));
    }
}