<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class CompanyManagerRoleSeeder extends Seeder
{
    /**
     * Sirket Yonetimi rolu icin seeder
     * Ust duzey yoneticiler icin ozet gorunum ve raporlama erisimi
     */
    public function run(): void
    {
        // Permission cache temizle
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Dashboard izinlerini olustur
        $this->createPermissions();

        // 2. Rolu olustur ve izinleri ata
        $this->createRole();

        $this->command->info('Sirket Yonetimi rolu basariyla olusturuldu!');
    }

    private function createPermissions(): void
    {
        $permissions = [
            // Dashboard izinleri
            ['name' => 'dashboard.company.view', 'display_name' => 'Sirket Dashboard Goruntuleme', 'module' => 'dashboard', 'group' => 'company', 'order' => 1],
            ['name' => 'dashboard.sales_overview.view', 'display_name' => 'Satis Ozeti Goruntuleme', 'module' => 'dashboard', 'group' => 'company', 'order' => 2],
            ['name' => 'dashboard.orders.view', 'display_name' => 'Siparis Listesi Goruntuleme', 'module' => 'dashboard', 'group' => 'company', 'order' => 3],
            ['name' => 'dashboard.customers.view', 'display_name' => 'Musteri Ozeti Goruntuleme', 'module' => 'dashboard', 'group' => 'company', 'order' => 4],
            ['name' => 'dashboard.products.view', 'display_name' => 'Urun Ozeti Goruntuleme', 'module' => 'dashboard', 'group' => 'company', 'order' => 5],
            ['name' => 'dashboard.receivables.view', 'display_name' => 'Alacak Ozeti Goruntuleme', 'module' => 'dashboard', 'group' => 'company', 'order' => 6],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(
                ['name' => $perm['name']],
                array_merge($perm, ['guard_name' => 'web', 'is_active' => true])
            );
        }
    }

    private function createRole(): void
    {
        // Sirket Yonetimi Rolu
        $role = Role::firstOrCreate(
            ['name' => 'company_manager', 'guard_name' => 'web'],
            [
                'slug' => 'company-manager',
                'description' => 'Sirket yonetimi - ust duzey raporlama ve ozet gorunum',
                'level' => 90,
                'is_system' => true,
                'is_active' => true,
            ]
        );

        // Dashboard izinleri
        $dashboardPermissions = Permission::where('module', 'dashboard')
            ->where('group', 'company')
            ->pluck('name')
            ->toArray();

        // Ek olarak satis ve fatura goruntuleme izinleri
        $additionalPermissions = [
            'sales.orders.view',
            'sales.invoices.view',
            'sales.analytics.view',
            'sales.reports.view',
            'inventory.view',
        ];

        $allPermissions = array_merge($dashboardPermissions, $additionalPermissions);

        // Mevcut izinleri filtrele (sadece var olanlar)
        $existingPermissions = Permission::whereIn('name', $allPermissions)->pluck('name')->toArray();

        $role->syncPermissions($existingPermissions);
    }
}
