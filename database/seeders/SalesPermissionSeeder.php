<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;
use App\Models\PermissionModule;

class SalesPermissionSeeder extends Seeder
{
    /**
     * Satis modulu icin izinler ve roller
     */
    public function run(): void
    {
        // Permission cache temizle
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Permission Module olustur
        $this->createPermissionModule();

        // 2. Izinleri olustur
        $this->createPermissions();

        // 3. Rolleri olustur ve izinleri ata
        $this->createRoles();

        $this->command->info('Satis izinleri ve rolleri basariyla olusturuldu!');
    }

    private function createPermissionModule(): void
    {
        PermissionModule::firstOrCreate(
            ['slug' => 'sales'],
            [
                'name' => 'Sales',
                'slug' => 'sales',
                'display_name' => 'Satis Yonetimi',
                'icon' => 'ri-shopping-cart-line',
                'description' => 'Satis islemleri ve yonetimi',
                'order' => 10,
                'is_active' => true,
            ]
        );
    }

    private function createPermissions(): void
    {
        $permissions = [
            // ========== SATIS SIPARISLERI ==========
            ['name' => 'sales.orders.view', 'display_name' => 'Siparis Goruntuleme', 'module' => 'sales', 'group' => 'orders', 'order' => 1],
            ['name' => 'sales.orders.create', 'display_name' => 'Siparis Olusturma', 'module' => 'sales', 'group' => 'orders', 'order' => 2],
            ['name' => 'sales.orders.edit', 'display_name' => 'Siparis Duzenleme', 'module' => 'sales', 'group' => 'orders', 'order' => 3],
            ['name' => 'sales.orders.delete', 'display_name' => 'Siparis Silme', 'module' => 'sales', 'group' => 'orders', 'order' => 4],
            ['name' => 'sales.orders.status', 'display_name' => 'Siparis Durum Degistirme', 'module' => 'sales', 'group' => 'orders', 'order' => 5],
            ['name' => 'sales.orders.pdf', 'display_name' => 'Siparis PDF Olusturma', 'module' => 'sales', 'group' => 'orders', 'order' => 6],
            ['name' => 'sales.orders.email', 'display_name' => 'Siparis E-posta Gonderme', 'module' => 'sales', 'group' => 'orders', 'order' => 7],
            ['name' => 'sales.orders.sync_logo', 'display_name' => 'Logo Senkronizasyonu', 'module' => 'sales', 'group' => 'orders', 'order' => 8],
            ['name' => 'sales.orders.discount', 'display_name' => 'Siparis Indirim Uygulama', 'module' => 'sales', 'group' => 'orders', 'order' => 9],

            // ========== TEKLIFLER ==========
            ['name' => 'sales.offers.view', 'display_name' => 'Teklif Goruntuleme', 'module' => 'sales', 'group' => 'offers', 'order' => 20],
            ['name' => 'sales.offers.create', 'display_name' => 'Teklif Olusturma', 'module' => 'sales', 'group' => 'offers', 'order' => 21],
            ['name' => 'sales.offers.edit', 'display_name' => 'Teklif Duzenleme', 'module' => 'sales', 'group' => 'offers', 'order' => 22],
            ['name' => 'sales.offers.delete', 'display_name' => 'Teklif Silme', 'module' => 'sales', 'group' => 'offers', 'order' => 23],
            ['name' => 'sales.offers.convert', 'display_name' => 'Teklifi Siparise Donusturme', 'module' => 'sales', 'group' => 'offers', 'order' => 24],
            ['name' => 'sales.offers.approve', 'display_name' => 'Teklif Onaylama', 'module' => 'sales', 'group' => 'offers', 'order' => 25],

            // ========== FATURALAR ==========
            ['name' => 'sales.invoices.view', 'display_name' => 'Fatura Goruntuleme', 'module' => 'sales', 'group' => 'invoices', 'order' => 30],
            ['name' => 'sales.invoices.mark_paid', 'display_name' => 'Fatura Odendi Isaretleme', 'module' => 'sales', 'group' => 'invoices', 'order' => 31],
            ['name' => 'sales.invoices.cancel', 'display_name' => 'Fatura Iptal Etme', 'module' => 'sales', 'group' => 'invoices', 'order' => 32],
            ['name' => 'sales.invoices.export', 'display_name' => 'Fatura Disa Aktarma', 'module' => 'sales', 'group' => 'invoices', 'order' => 33],

            // ========== IADELER ==========
            ['name' => 'sales.returns.view', 'display_name' => 'Iade Goruntuleme', 'module' => 'sales', 'group' => 'returns', 'order' => 40],
            ['name' => 'sales.returns.create', 'display_name' => 'Iade Olusturma', 'module' => 'sales', 'group' => 'returns', 'order' => 41],
            ['name' => 'sales.returns.approve', 'display_name' => 'Iade Onaylama', 'module' => 'sales', 'group' => 'returns', 'order' => 42],
            ['name' => 'sales.returns.reject', 'display_name' => 'Iade Reddetme', 'module' => 'sales', 'group' => 'returns', 'order' => 43],
            ['name' => 'sales.returns.complete', 'display_name' => 'Iade Tamamlama', 'module' => 'sales', 'group' => 'returns', 'order' => 44],

            // ========== KAMPANYALAR ==========
            ['name' => 'sales.campaigns.view', 'display_name' => 'Kampanya Goruntuleme', 'module' => 'sales', 'group' => 'campaigns', 'order' => 50],
            ['name' => 'sales.campaigns.create', 'display_name' => 'Kampanya Olusturma', 'module' => 'sales', 'group' => 'campaigns', 'order' => 51],
            ['name' => 'sales.campaigns.edit', 'display_name' => 'Kampanya Duzenleme', 'module' => 'sales', 'group' => 'campaigns', 'order' => 52],
            ['name' => 'sales.campaigns.delete', 'display_name' => 'Kampanya Silme', 'module' => 'sales', 'group' => 'campaigns', 'order' => 53],

            // ========== FIYAT LISTELERI ==========
            ['name' => 'sales.price_lists.view', 'display_name' => 'Fiyat Listesi Goruntuleme', 'module' => 'sales', 'group' => 'price_lists', 'order' => 60],
            ['name' => 'sales.price_lists.create', 'display_name' => 'Fiyat Listesi Olusturma', 'module' => 'sales', 'group' => 'price_lists', 'order' => 61],
            ['name' => 'sales.price_lists.edit', 'display_name' => 'Fiyat Listesi Duzenleme', 'module' => 'sales', 'group' => 'price_lists', 'order' => 62],
            ['name' => 'sales.price_lists.delete', 'display_name' => 'Fiyat Listesi Silme', 'module' => 'sales', 'group' => 'price_lists', 'order' => 63],
            ['name' => 'sales.price_lists.manage_prices', 'display_name' => 'Fiyat Yonetimi', 'module' => 'sales', 'group' => 'price_lists', 'order' => 64],

            // ========== ISKONTOLAR ==========
            ['name' => 'sales.discounts.view', 'display_name' => 'Iskonto Goruntuleme', 'module' => 'sales', 'group' => 'discounts', 'order' => 70],
            ['name' => 'sales.discounts.create', 'display_name' => 'Iskonto Olusturma', 'module' => 'sales', 'group' => 'discounts', 'order' => 71],
            ['name' => 'sales.discounts.edit', 'display_name' => 'Iskonto Duzenleme', 'module' => 'sales', 'group' => 'discounts', 'order' => 72],
            ['name' => 'sales.discounts.delete', 'display_name' => 'Iskonto Silme', 'module' => 'sales', 'group' => 'discounts', 'order' => 73],

            // ========== SATIS HEDEFLERI ==========
            ['name' => 'sales.targets.view', 'display_name' => 'Hedef Goruntuleme', 'module' => 'sales', 'group' => 'targets', 'order' => 80],
            ['name' => 'sales.targets.create', 'display_name' => 'Hedef Olusturma', 'module' => 'sales', 'group' => 'targets', 'order' => 81],
            ['name' => 'sales.targets.edit', 'display_name' => 'Hedef Duzenleme', 'module' => 'sales', 'group' => 'targets', 'order' => 82],
            ['name' => 'sales.targets.delete', 'display_name' => 'Hedef Silme', 'module' => 'sales', 'group' => 'targets', 'order' => 83],

            // ========== ANALITIK & RAPORLAR ==========
            ['name' => 'sales.analytics.view', 'display_name' => 'Analitik Goruntuleme', 'module' => 'sales', 'group' => 'analytics', 'order' => 90],
            ['name' => 'sales.analytics.export', 'display_name' => 'Analitik Disa Aktarma', 'module' => 'sales', 'group' => 'analytics', 'order' => 91],
            ['name' => 'sales.reports.view', 'display_name' => 'Rapor Goruntuleme', 'module' => 'sales', 'group' => 'reports', 'order' => 92],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(
                ['name' => $perm['name']],
                array_merge($perm, ['guard_name' => 'web', 'is_active' => true])
            );
        }
    }

    private function createRoles(): void
    {
        // 1. Satis Muduru - Tam erisim
        $managerRole = Role::firstOrCreate(
            ['name' => 'sales_manager', 'guard_name' => 'web'],
            [
                'slug' => 'sales-manager',
                'description' => 'Satis muduru - tum satis islemlerine tam erisim',
                'level' => 100,
                'is_system' => true,
                'is_active' => true,
            ]
        );
        // Tum satis izinleri + sevkiyat olusturma izinleri
        $allSalesPermissions = Permission::where('module', 'sales')->get();
        $shippingPermissions = Permission::whereIn('name', [
            'warehouse.shipping.view',
            'warehouse.shipping.create',
        ])->get();
        $managerRole->syncPermissions($allSalesPermissions->merge($shippingPermissions));

        // 2. Satis Temsilcisi
        $representativeRole = Role::firstOrCreate(
            ['name' => 'sales_representative', 'guard_name' => 'web'],
            [
                'slug' => 'sales-representative',
                'description' => 'Satis temsilcisi - siparis ve teklif islemleri',
                'level' => 60,
                'is_system' => true,
                'is_active' => true,
            ]
        );
        $representativePermissions = [
            // Siparisler
            'sales.orders.view', 'sales.orders.create', 'sales.orders.edit',
            'sales.orders.status', 'sales.orders.pdf', 'sales.orders.email', 'sales.orders.discount',
            // Teklifler
            'sales.offers.view', 'sales.offers.create', 'sales.offers.edit', 'sales.offers.convert',
            // Faturalar (salt okunur)
            'sales.invoices.view',
            // Iadeler
            'sales.returns.view', 'sales.returns.create',
            // Kampanyalar (salt okunur)
            'sales.campaigns.view',
            // Fiyat listeleri (salt okunur)
            'sales.price_lists.view',
            // Iskontolar (salt okunur)
            'sales.discounts.view',
            // Hedefler (kendi hedefleri)
            'sales.targets.view',
            // Raporlar
            'sales.reports.view',
            // Sevkiyat (olusturma ve goruntuleme)
            'warehouse.shipping.view', 'warehouse.shipping.create',
        ];
        $representativeRole->syncPermissions($representativePermissions);

        // 3. Magaza Satiscisi (Kasiyer)
        $cashierRole = Role::firstOrCreate(
            ['name' => 'store_cashier', 'guard_name' => 'web'],
            [
                'slug' => 'store-cashier',
                'description' => 'Magaza satiscisi - temel satis islemleri',
                'level' => 40,
                'is_system' => true,
                'is_active' => true,
            ]
        );
        $cashierPermissions = [
            // Siparisler (olusturma ve goruntuleme)
            'sales.orders.view', 'sales.orders.create', 'sales.orders.pdf',
            // Faturalar (salt okunur)
            'sales.invoices.view',
            // Iadeler (olusturma)
            'sales.returns.view', 'sales.returns.create',
            // Kampanyalar (goruntuleme)
            'sales.campaigns.view',
            // Fiyat listeleri (goruntuleme)
            'sales.price_lists.view',
        ];
        $cashierRole->syncPermissions($cashierPermissions);

        // 4. Satis Muhasebe
        $accountingRole = Role::firstOrCreate(
            ['name' => 'sales_accounting', 'guard_name' => 'web'],
            [
                'slug' => 'sales-accounting',
                'description' => 'Satis muhasebe - fatura ve rapor islemleri',
                'level' => 50,
                'is_system' => true,
                'is_active' => true,
            ]
        );
        $accountingPermissions = [
            // Siparisler (salt okunur)
            'sales.orders.view', 'sales.orders.pdf',
            // Faturalar (tam erisim)
            'sales.invoices.view', 'sales.invoices.mark_paid', 'sales.invoices.cancel', 'sales.invoices.export',
            // Iadeler (salt okunur)
            'sales.returns.view',
            // Fiyat listeleri (salt okunur)
            'sales.price_lists.view',
            // Analitik ve raporlar
            'sales.analytics.view', 'sales.analytics.export', 'sales.reports.view',
        ];
        $accountingRole->syncPermissions($accountingPermissions);
    }
}
