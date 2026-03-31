<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;
use App\Models\PermissionModule;
use Illuminate\Support\Facades\DB;

class WarehousePermissionSeeder extends Seeder
{
    /**
     * Depo, Envanter, Stok ve Lojistik modulleri icin izinler ve roller
     */
    public function run(): void
    {
        // Permission cache temizle
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Permission Module'leri olustur
        $this->createPermissionModules();

        // 2. Izinleri olustur
        $this->createPermissions();

        // 3. Rolleri olustur ve izinleri ata
        $this->createRoles();

        $this->command->info('Depo izinleri ve rolleri basariyla olusturuldu!');
    }

    private function createPermissionModules(): void
    {
        $modules = [
            [
                'name' => 'Warehouse',
                'slug' => 'warehouse',
                'display_name' => 'Depo Yonetimi',
                'icon' => 'ri-building-line',
                'description' => 'Depo yonetimi ve operasyonlari',
                'order' => 15,
                'is_active' => true,
            ],
            [
                'name' => 'Inventory',
                'slug' => 'inventory',
                'display_name' => 'Envanter Yonetimi',
                'icon' => 'ri-qr-code-line',
                'description' => 'Envanter takip ve barkod yonetimi',
                'order' => 16,
                'is_active' => true,
            ],
            [
                'name' => 'Stock',
                'slug' => 'stock',
                'display_name' => 'Stok Yonetimi',
                'icon' => 'ri-stack-line',
                'description' => 'Stok hareketleri ve transferler',
                'order' => 17,
                'is_active' => true,
            ],
            [
                'name' => 'Logistics',
                'slug' => 'logistics',
                'display_name' => 'Lojistik Yonetimi',
                'icon' => 'ri-truck-line',
                'description' => 'Sevkiyat ve teslimat yonetimi',
                'order' => 18,
                'is_active' => true,
            ],
        ];

        foreach ($modules as $module) {
            PermissionModule::firstOrCreate(
                ['slug' => $module['slug']],
                $module
            );
        }
    }

    private function createPermissions(): void
    {
        $permissions = [
            // ========== WAREHOUSE MODULE ==========
            // Depo Yonetimi
            ['name' => 'warehouse.view', 'display_name' => 'Depo Goruntuleme', 'module' => 'warehouse', 'group' => 'management', 'order' => 1],
            ['name' => 'warehouse.create', 'display_name' => 'Depo Olusturma', 'module' => 'warehouse', 'group' => 'management', 'order' => 2],
            ['name' => 'warehouse.edit', 'display_name' => 'Depo Duzenleme', 'module' => 'warehouse', 'group' => 'management', 'order' => 3],
            ['name' => 'warehouse.delete', 'display_name' => 'Depo Silme', 'module' => 'warehouse', 'group' => 'management', 'order' => 4],
            ['name' => 'warehouse.dashboard', 'display_name' => 'Depo Dashboard', 'module' => 'warehouse', 'group' => 'management', 'order' => 5],
            ['name' => 'warehouse.reports', 'display_name' => 'Depo Raporlari', 'module' => 'warehouse', 'group' => 'management', 'order' => 6],

            // Bolge Yonetimi
            ['name' => 'warehouse.zones.view', 'display_name' => 'Bolge Goruntuleme', 'module' => 'warehouse', 'group' => 'zones', 'order' => 10],
            ['name' => 'warehouse.zones.create', 'display_name' => 'Bolge Olusturma', 'module' => 'warehouse', 'group' => 'zones', 'order' => 11],
            ['name' => 'warehouse.zones.edit', 'display_name' => 'Bolge Duzenleme', 'module' => 'warehouse', 'group' => 'zones', 'order' => 12],
            ['name' => 'warehouse.zones.delete', 'display_name' => 'Bolge Silme', 'module' => 'warehouse', 'group' => 'zones', 'order' => 13],

            // Lokasyon Yonetimi
            ['name' => 'warehouse.locations.view', 'display_name' => 'Lokasyon Goruntuleme', 'module' => 'warehouse', 'group' => 'locations', 'order' => 20],
            ['name' => 'warehouse.locations.create', 'display_name' => 'Lokasyon Olusturma', 'module' => 'warehouse', 'group' => 'locations', 'order' => 21],
            ['name' => 'warehouse.locations.edit', 'display_name' => 'Lokasyon Duzenleme', 'module' => 'warehouse', 'group' => 'locations', 'order' => 22],
            ['name' => 'warehouse.locations.delete', 'display_name' => 'Lokasyon Silme', 'module' => 'warehouse', 'group' => 'locations', 'order' => 23],

            // Mal Kabul
            ['name' => 'warehouse.receiving.view', 'display_name' => 'Mal Kabul Goruntuleme', 'module' => 'warehouse', 'group' => 'receiving', 'order' => 30],
            ['name' => 'warehouse.receiving.process', 'display_name' => 'Mal Kabul Isleme', 'module' => 'warehouse', 'group' => 'receiving', 'order' => 31],
            ['name' => 'warehouse.receiving.complete', 'display_name' => 'Mal Kabul Tamamlama', 'module' => 'warehouse', 'group' => 'receiving', 'order' => 32],

            // Kalite Kontrol
            ['name' => 'warehouse.qc.view', 'display_name' => 'Kalite Kontrol Goruntuleme', 'module' => 'warehouse', 'group' => 'qc', 'order' => 40],
            ['name' => 'warehouse.qc.approve', 'display_name' => 'Kalite Kontrol Onaylama', 'module' => 'warehouse', 'group' => 'qc', 'order' => 41],
            ['name' => 'warehouse.qc.reject', 'display_name' => 'Kalite Kontrol Reddetme', 'module' => 'warehouse', 'group' => 'qc', 'order' => 42],

            // Yerlestirme
            ['name' => 'warehouse.putaway.view', 'display_name' => 'Yerlestirme Goruntuleme', 'module' => 'warehouse', 'group' => 'putaway', 'order' => 50],
            ['name' => 'warehouse.putaway.assign', 'display_name' => 'Yerlestirme Atama', 'module' => 'warehouse', 'group' => 'putaway', 'order' => 51],

            // Operasyonlar
            ['name' => 'warehouse.operations.view', 'display_name' => 'Operasyon Goruntuleme', 'module' => 'warehouse', 'group' => 'operations', 'order' => 60],
            ['name' => 'warehouse.operations.create', 'display_name' => 'Operasyon Olusturma', 'module' => 'warehouse', 'group' => 'operations', 'order' => 61],
            ['name' => 'warehouse.operations.edit', 'display_name' => 'Operasyon Duzenleme', 'module' => 'warehouse', 'group' => 'operations', 'order' => 62],
            ['name' => 'warehouse.operations.assign', 'display_name' => 'Operasyon Atama', 'module' => 'warehouse', 'group' => 'operations', 'order' => 63],

            // Toplama (Picking)
            ['name' => 'warehouse.picking.view', 'display_name' => 'Toplama Goruntuleme', 'module' => 'warehouse', 'group' => 'picking', 'order' => 70],
            ['name' => 'warehouse.picking.start', 'display_name' => 'Toplama Baslat', 'module' => 'warehouse', 'group' => 'picking', 'order' => 71],
            ['name' => 'warehouse.picking.complete', 'display_name' => 'Toplama Tamamla', 'module' => 'warehouse', 'group' => 'picking', 'order' => 72],
            ['name' => 'warehouse.picking.scan', 'display_name' => 'Barkod Tarama', 'module' => 'warehouse', 'group' => 'picking', 'order' => 73],

            // Paketleme
            ['name' => 'warehouse.packing.view', 'display_name' => 'Paketleme Goruntuleme', 'module' => 'warehouse', 'group' => 'packing', 'order' => 80],
            ['name' => 'warehouse.packing.process', 'display_name' => 'Paketleme Isleme', 'module' => 'warehouse', 'group' => 'packing', 'order' => 81],

            // Sevkiyat
            ['name' => 'warehouse.shipping.view', 'display_name' => 'Sevkiyat Goruntuleme', 'module' => 'warehouse', 'group' => 'shipping', 'order' => 90],
            ['name' => 'warehouse.shipping.create', 'display_name' => 'Sevkiyat Olusturma', 'module' => 'warehouse', 'group' => 'shipping', 'order' => 91],
            ['name' => 'warehouse.shipping.edit', 'display_name' => 'Sevkiyat Duzenleme', 'module' => 'warehouse', 'group' => 'shipping', 'order' => 92],
            ['name' => 'warehouse.shipping.assign', 'display_name' => 'Sevkiyat Atama', 'module' => 'warehouse', 'group' => 'shipping', 'order' => 93],
            ['name' => 'warehouse.shipping.ship', 'display_name' => 'Sevkiyat Gonder', 'module' => 'warehouse', 'group' => 'shipping', 'order' => 94],
            ['name' => 'warehouse.shipping.deliver', 'display_name' => 'Teslimat Tamamla', 'module' => 'warehouse', 'group' => 'shipping', 'order' => 95],
            ['name' => 'warehouse.shipping.cancel', 'display_name' => 'Sevkiyat Iptal', 'module' => 'warehouse', 'group' => 'shipping', 'order' => 96],

            // Araclar
            ['name' => 'warehouse.vehicles.view', 'display_name' => 'Arac Goruntuleme', 'module' => 'warehouse', 'group' => 'vehicles', 'order' => 100],
            ['name' => 'warehouse.vehicles.manage', 'display_name' => 'Arac Yonetimi', 'module' => 'warehouse', 'group' => 'vehicles', 'order' => 101],

            // Soforler
            ['name' => 'warehouse.drivers.view', 'display_name' => 'Sofor Goruntuleme', 'module' => 'warehouse', 'group' => 'drivers', 'order' => 102],
            ['name' => 'warehouse.drivers.manage', 'display_name' => 'Sofor Yonetimi', 'module' => 'warehouse', 'group' => 'drivers', 'order' => 103],

            // Personel
            ['name' => 'warehouse.staff.view', 'display_name' => 'Personel Goruntuleme', 'module' => 'warehouse', 'group' => 'staff', 'order' => 110],
            ['name' => 'warehouse.staff.create', 'display_name' => 'Personel Ekleme', 'module' => 'warehouse', 'group' => 'staff', 'order' => 111],
            ['name' => 'warehouse.staff.edit', 'display_name' => 'Personel Duzenleme', 'module' => 'warehouse', 'group' => 'staff', 'order' => 112],
            ['name' => 'warehouse.staff.delete', 'display_name' => 'Personel Silme', 'module' => 'warehouse', 'group' => 'staff', 'order' => 113],

            // ========== INVENTORY MODULE ==========
            ['name' => 'inventory.view', 'display_name' => 'Envanter Goruntuleme', 'module' => 'inventory', 'group' => 'general', 'order' => 1],
            ['name' => 'inventory.dashboard', 'display_name' => 'Envanter Dashboard', 'module' => 'inventory', 'group' => 'general', 'order' => 2],
            ['name' => 'inventory.reports', 'display_name' => 'Envanter Raporlari', 'module' => 'inventory', 'group' => 'general', 'order' => 3],

            // Envanter Kalemleri
            ['name' => 'inventory.items.view', 'display_name' => 'Kalem Goruntuleme', 'module' => 'inventory', 'group' => 'items', 'order' => 10],
            ['name' => 'inventory.items.create', 'display_name' => 'Kalem Olusturma', 'module' => 'inventory', 'group' => 'items', 'order' => 11],
            ['name' => 'inventory.items.edit', 'display_name' => 'Kalem Duzenleme', 'module' => 'inventory', 'group' => 'items', 'order' => 12],

            // Stok Seviyeleri
            ['name' => 'inventory.stocks.view', 'display_name' => 'Stok Seviyesi Goruntuleme', 'module' => 'inventory', 'group' => 'stocks', 'order' => 20],
            ['name' => 'inventory.stocks.edit', 'display_name' => 'Stok Seviyesi Duzenleme', 'module' => 'inventory', 'group' => 'stocks', 'order' => 21],

            // Hareketler
            ['name' => 'inventory.movements.view', 'display_name' => 'Hareket Goruntuleme', 'module' => 'inventory', 'group' => 'movements', 'order' => 30],
            ['name' => 'inventory.movements.create', 'display_name' => 'Hareket Olusturma', 'module' => 'inventory', 'group' => 'movements', 'order' => 31],

            // Uyarilar
            ['name' => 'inventory.alerts.view', 'display_name' => 'Uyari Goruntuleme', 'module' => 'inventory', 'group' => 'alerts', 'order' => 40],
            ['name' => 'inventory.alerts.manage', 'display_name' => 'Uyari Yonetimi', 'module' => 'inventory', 'group' => 'alerts', 'order' => 41],

            // Barkodlar
            ['name' => 'inventory.barcodes.view', 'display_name' => 'Barkod Goruntuleme', 'module' => 'inventory', 'group' => 'barcodes', 'order' => 50],
            ['name' => 'inventory.barcodes.manage', 'display_name' => 'Barkod Yonetimi', 'module' => 'inventory', 'group' => 'barcodes', 'order' => 51],

            // ========== STOCK MODULE ==========
            ['name' => 'stock.view', 'display_name' => 'Stok Goruntuleme', 'module' => 'stock', 'group' => 'general', 'order' => 1],
            ['name' => 'stock.reports', 'display_name' => 'Stok Raporlari', 'module' => 'stock', 'group' => 'general', 'order' => 2],

            // Stok Islemleri
            ['name' => 'stock.adjust', 'display_name' => 'Stok Duzeltme', 'module' => 'stock', 'group' => 'operations', 'order' => 10],
            ['name' => 'stock.transfer', 'display_name' => 'Stok Transfer', 'module' => 'stock', 'group' => 'operations', 'order' => 11],
            ['name' => 'stock.movements', 'display_name' => 'Stok Hareketleri', 'module' => 'stock', 'group' => 'operations', 'order' => 12],
            ['name' => 'stock.count', 'display_name' => 'Sayim Yapma', 'module' => 'stock', 'group' => 'operations', 'order' => 13],

            // ========== LOGISTICS MODULE ==========
            ['name' => 'logistics.view', 'display_name' => 'Lojistik Goruntuleme', 'module' => 'logistics', 'group' => 'general', 'order' => 1],
            ['name' => 'logistics.planning', 'display_name' => 'Sevkiyat Planlama', 'module' => 'logistics', 'group' => 'planning', 'order' => 10],
            ['name' => 'logistics.routes', 'display_name' => 'Rota Yonetimi', 'module' => 'logistics', 'group' => 'routes', 'order' => 20],
            ['name' => 'logistics.tracking', 'display_name' => 'Teslimat Takibi', 'module' => 'logistics', 'group' => 'tracking', 'order' => 30],
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
        // 1. Depo Yoneticisi - Tam erisim
        $managerRole = Role::firstOrCreate(
            ['name' => 'warehouse_manager', 'guard_name' => 'web'],
            [
                'slug' => 'warehouse-manager',
                'description' => 'Depo yoneticisi - tum depo islemlerine tam erisim',
                'level' => 100,
                'is_system' => true,
                'is_active' => true,
            ]
        );
        // Tum warehouse, inventory, stock, logistics izinlerini ver
        $allPermissions = Permission::whereIn('module', ['warehouse', 'inventory', 'stock', 'logistics'])->get();
        $managerRole->syncPermissions($allPermissions);

        // 2. Mal Kabul Sorumlusu
        $receiverRole = Role::firstOrCreate(
            ['name' => 'warehouse_receiver', 'guard_name' => 'web'],
            [
                'slug' => 'warehouse-receiver',
                'description' => 'Mal kabul sorumlusu - teslim alma ve kalite kontrol',
                'level' => 60,
                'is_system' => true,
                'is_active' => true,
            ]
        );
        $receiverPermissions = [
            'warehouse.view', 'warehouse.dashboard',
            'warehouse.locations.view',
            'warehouse.receiving.view', 'warehouse.receiving.process', 'warehouse.receiving.complete',
            'warehouse.qc.view', 'warehouse.qc.approve', 'warehouse.qc.reject',
            'warehouse.putaway.view', 'warehouse.putaway.assign',
            'warehouse.operations.view',
            'inventory.view', 'inventory.items.view', 'inventory.stocks.view',
        ];
        $receiverRole->syncPermissions($receiverPermissions);

        // 3. Toplayici
        $pickerRole = Role::firstOrCreate(
            ['name' => 'warehouse_picker', 'guard_name' => 'web'],
            [
                'slug' => 'warehouse-picker',
                'description' => 'Toplayici - toplama gorevleri ve barkod tarama',
                'level' => 50,
                'is_system' => true,
                'is_active' => true,
            ]
        );
        $pickerPermissions = [
            'warehouse.view', 'warehouse.dashboard',
            'warehouse.locations.view',
            'warehouse.picking.view', 'warehouse.picking.start', 'warehouse.picking.complete', 'warehouse.picking.scan',
            'warehouse.packing.view', 'warehouse.packing.process',
            'warehouse.operations.view',
            'inventory.view', 'inventory.items.view', 'inventory.stocks.view',
            'stock.view',
        ];
        $pickerRole->syncPermissions($pickerPermissions);

        // 4. Sevkiyatci
        $shipperRole = Role::firstOrCreate(
            ['name' => 'warehouse_shipper', 'guard_name' => 'web'],
            [
                'slug' => 'warehouse-shipper',
                'description' => 'Sevkiyatci - sevk emirleri ve arac/sofor yonetimi',
                'level' => 50,
                'is_system' => true,
                'is_active' => true,
            ]
        );
        $shipperPermissions = [
            'warehouse.view', 'warehouse.dashboard',
            'warehouse.locations.view',
            'warehouse.shipping.view', 'warehouse.shipping.create', 'warehouse.shipping.edit',
            'warehouse.shipping.assign', 'warehouse.shipping.ship', 'warehouse.shipping.deliver', 'warehouse.shipping.cancel',
            'warehouse.vehicles.view', 'warehouse.vehicles.manage',
            'warehouse.drivers.view', 'warehouse.drivers.manage',
            'warehouse.operations.view',
            'logistics.view', 'logistics.planning', 'logistics.routes', 'logistics.tracking',
        ];
        $shipperRole->syncPermissions($shipperPermissions);

        // 5. Sayimci (Inventory Controller)
        $inventoryRole = Role::firstOrCreate(
            ['name' => 'warehouse_inventory', 'guard_name' => 'web'],
            [
                'slug' => 'warehouse-inventory',
                'description' => 'Sayimci - stok duzeltme, sayim ve transfer islemleri',
                'level' => 70,
                'is_system' => true,
                'is_active' => true,
            ]
        );
        $inventoryPermissions = [
            'warehouse.view', 'warehouse.dashboard', 'warehouse.reports',
            'warehouse.locations.view',
            'warehouse.operations.view',
            'inventory.view', 'inventory.dashboard', 'inventory.reports',
            'inventory.items.view', 'inventory.items.edit',
            'inventory.stocks.view', 'inventory.stocks.edit',
            'inventory.movements.view', 'inventory.movements.create',
            'inventory.alerts.view', 'inventory.alerts.manage',
            'inventory.barcodes.view', 'inventory.barcodes.manage',
            'stock.view', 'stock.reports',
            'stock.adjust', 'stock.transfer', 'stock.movements', 'stock.count',
        ];
        $inventoryRole->syncPermissions($inventoryPermissions);
    }
}
