<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ExpenseCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            // Ana Kategoriler
            [
                'name' => 'Ofis Giderleri',
                'code' => 'OF001',
                'description' => 'Ofis ile ilgili tüm giderler',
                'parent_id' => null,
                'color' => '#17a2b8',
                'icon' => 'building',
                'is_active' => true,
                'requires_approval' => false,
                'approval_limit' => null,
                'monthly_budget' => 50000.00,
                'yearly_budget' => 600000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Personel Giderleri',
                'code' => 'PR001',
                'description' => 'Personel ile ilgili giderler',
                'parent_id' => null,
                'color' => '#28a745',
                'icon' => 'users',
                'is_active' => true,
                'requires_approval' => true,
                'approval_limit' => 10000.00,
                'monthly_budget' => 100000.00,
                'yearly_budget' => 1200000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Pazarlama Giderleri',
                'code' => 'PZ001',
                'description' => 'Pazarlama ve reklam giderleri',
                'parent_id' => null,
                'color' => '#ffc107',
                'icon' => 'bullhorn',
                'is_active' => true,
                'requires_approval' => true,
                'approval_limit' => 25000.00,
                'monthly_budget' => 75000.00,
                'yearly_budget' => 900000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Seyahat Giderleri',
                'code' => 'SY001',
                'description' => 'İş seyahati giderleri',
                'parent_id' => null,
                'color' => '#dc3545',
                'icon' => 'plane',
                'is_active' => true,
                'requires_approval' => true,
                'approval_limit' => 15000.00,
                'monthly_budget' => 30000.00,
                'yearly_budget' => 360000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Araç Giderleri',
                'code' => 'AR001',
                'description' => 'Araç ve ulaşım giderleri',
                'parent_id' => null,
                'color' => '#6f42c1',
                'icon' => 'car',
                'is_active' => true,
                'requires_approval' => false,
                'approval_limit' => null,
                'monthly_budget' => 40000.00,
                'yearly_budget' => 480000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'IT ve Teknoloji',
                'code' => 'IT001',
                'description' => 'Bilgi teknolojileri giderleri',
                'parent_id' => null,
                'color' => '#20c997',
                'icon' => 'laptop',
                'is_active' => true,
                'requires_approval' => true,
                'approval_limit' => 20000.00,
                'monthly_budget' => 60000.00,
                'yearly_budget' => 720000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Hukuki Giderler',
                'code' => 'HK001',
                'description' => 'Hukuki danışmanlık ve dava giderleri',
                'parent_id' => null,
                'color' => '#fd7e14',
                'icon' => 'gavel',
                'is_active' => true,
                'requires_approval' => true,
                'approval_limit' => 50000.00,
                'monthly_budget' => 25000.00,
                'yearly_budget' => 300000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Vergi ve Harçlar',
                'code' => 'VG001',
                'description' => 'Vergi, resim ve harç ödemeleri',
                'parent_id' => null,
                'color' => '#e83e8c',
                'icon' => 'file-invoice',
                'is_active' => true,
                'requires_approval' => true,
                'approval_limit' => 100000.00,
                'monthly_budget' => 50000.00,
                'yearly_budget' => 600000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('expense_categories')->insert($categories);

        // Alt kategoriler
        $subCategories = [
            // Ofis Giderleri Alt Kategorileri
            ['name' => 'Kira', 'code' => 'OF101', 'parent_id' => 1, 'color' => '#17a2b8', 'monthly_budget' => 15000.00],
            ['name' => 'Elektrik', 'code' => 'OF102', 'parent_id' => 1, 'color' => '#17a2b8', 'monthly_budget' => 5000.00],
            ['name' => 'Su', 'code' => 'OF103', 'parent_id' => 1, 'color' => '#17a2b8', 'monthly_budget' => 2000.00],
            ['name' => 'İnternet', 'code' => 'OF104', 'parent_id' => 1, 'color' => '#17a2b8', 'monthly_budget' => 3000.00],
            ['name' => 'Telefon', 'code' => 'OF105', 'parent_id' => 1, 'color' => '#17a2b8', 'monthly_budget' => 4000.00],
            ['name' => 'Temizlik', 'code' => 'OF106', 'parent_id' => 1, 'color' => '#17a2b8', 'monthly_budget' => 3000.00],
            ['name' => 'Güvenlik', 'code' => 'OF107', 'parent_id' => 1, 'color' => '#17a2b8', 'monthly_budget' => 8000.00],
            ['name' => 'Kırtasiye', 'code' => 'OF108', 'parent_id' => 1, 'color' => '#17a2b8', 'monthly_budget' => 2000.00],

            // Personel Giderleri Alt Kategorileri
            ['name' => 'Yemek', 'code' => 'PR101', 'parent_id' => 2, 'color' => '#28a745', 'monthly_budget' => 20000.00],
            ['name' => 'Servis', 'code' => 'PR102', 'parent_id' => 2, 'color' => '#28a745', 'monthly_budget' => 15000.00],
            ['name' => 'Eğitim', 'code' => 'PR103', 'parent_id' => 2, 'color' => '#28a745', 'monthly_budget' => 10000.00],
            ['name' => 'Sosyal Aktivite', 'code' => 'PR104', 'parent_id' => 2, 'color' => '#28a745', 'monthly_budget' => 8000.00],

            // Pazarlama Giderleri Alt Kategorileri
            ['name' => 'Online Reklam', 'code' => 'PZ101', 'parent_id' => 3, 'color' => '#ffc107', 'monthly_budget' => 30000.00],
            ['name' => 'Basılı Materyal', 'code' => 'PZ102', 'parent_id' => 3, 'color' => '#ffc107', 'monthly_budget' => 15000.00],
            ['name' => 'Fuarlar', 'code' => 'PZ103', 'parent_id' => 3, 'color' => '#ffc107', 'monthly_budget' => 20000.00],
            ['name' => 'Sponsorluk', 'code' => 'PZ104', 'parent_id' => 3, 'color' => '#ffc107', 'monthly_budget' => 10000.00],

            // Seyahat Giderleri Alt Kategorileri
            ['name' => 'Konaklama', 'code' => 'SY101', 'parent_id' => 4, 'color' => '#dc3545', 'monthly_budget' => 12000.00],
            ['name' => 'Uçak Bileti', 'code' => 'SY102', 'parent_id' => 4, 'color' => '#dc3545', 'monthly_budget' => 10000.00],
            ['name' => 'Yemek', 'code' => 'SY103', 'parent_id' => 4, 'color' => '#dc3545', 'monthly_budget' => 5000.00],
            ['name' => 'Yerel Ulaşım', 'code' => 'SY104', 'parent_id' => 4, 'color' => '#dc3545', 'monthly_budget' => 3000.00],

            // Araç Giderleri Alt Kategorileri
            ['name' => 'Yakıt', 'code' => 'AR101', 'parent_id' => 5, 'color' => '#6f42c1', 'monthly_budget' => 15000.00],
            ['name' => 'Bakım', 'code' => 'AR102', 'parent_id' => 5, 'color' => '#6f42c1', 'monthly_budget' => 8000.00],
            ['name' => 'Sigorta', 'code' => 'AR103', 'parent_id' => 5, 'color' => '#6f42c1', 'monthly_budget' => 5000.00],
            ['name' => 'Muayene', 'code' => 'AR104', 'parent_id' => 5, 'color' => '#6f42c1', 'monthly_budget' => 2000.00],

            // IT ve Teknoloji Alt Kategorileri
            ['name' => 'Yazılım Lisansı', 'code' => 'IT101', 'parent_id' => 6, 'color' => '#20c997', 'monthly_budget' => 20000.00],
            ['name' => 'Donanım', 'code' => 'IT102', 'parent_id' => 6, 'color' => '#20c997', 'monthly_budget' => 15000.00],
            ['name' => 'Hosting', 'code' => 'IT103', 'parent_id' => 6, 'color' => '#20c997', 'monthly_budget' => 8000.00],
            ['name' => 'Teknik Destek', 'code' => 'IT104', 'parent_id' => 6, 'color' => '#20c997', 'monthly_budget' => 10000.00],
        ];

        foreach ($subCategories as $category) {
            $category['is_active'] = true;
            $category['requires_approval'] = false;
            $category['approval_limit'] = null;
            $category['yearly_budget'] = $category['monthly_budget'] * 12;
            $category['created_at'] = now();
            $category['updated_at'] = now();
            DB::table('expense_categories')->insert($category);
        }
    }
}
