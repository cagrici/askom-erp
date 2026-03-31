<?php

namespace Database\Seeders;

use App\Models\Integration;
use Illuminate\Database\Seeder;

class IntegrationSeeder extends Seeder
{
    public function run(): void
    {
        $integrations = [
            // Accounting Software
            [
                'name' => 'Logo Tiger/Go',
                'code' => 'logo_tiger',
                'type' => 'accounting',
                'description' => 'Logo Tiger ve Logo Go muhasebe yazılımları ile entegrasyon. Cari hesaplar, ürünler, faturalar ve stok senkronizasyonu sağlar.',
                'is_active' => false,
                'is_configured' => false,
                'sync_settings' => [
                    'entities' => ['current_accounts', 'products', 'invoices', 'stock'],
                    'direction' => 'both',
                    'auto_sync' => false,
                    'sync_interval' => 3600,
                ],
            ],
            [
                'name' => 'Mikro/Netsis',
                'code' => 'mikro_netsis',
                'type' => 'accounting',
                'description' => 'Mikro ve Netsis muhasebe yazılımları ile entegrasyon.',
                'is_active' => false,
                'is_configured' => false,
            ],
            [
                'name' => 'Luca',
                'code' => 'luca',
                'type' => 'accounting',
                'description' => 'Luca online muhasebe platformu ile entegrasyon.',
                'is_active' => false,
                'is_configured' => false,
            ],

            // E-Invoice/E-Archive
            [
                'name' => 'GİB e-Fatura',
                'code' => 'gib_efatura',
                'type' => 'einvoice',
                'description' => 'Gelir İdaresi Başkanlığı e-Fatura sistemi entegrasyonu.',
                'is_active' => false,
                'is_configured' => false,
            ],
            [
                'name' => 'e-Arşiv Fatura',
                'code' => 'earsiv',
                'type' => 'einvoice',
                'description' => 'e-Arşiv fatura sistemi entegrasyonu.',
                'is_active' => false,
                'is_configured' => false,
            ],

            // Payment Systems
            [
                'name' => 'İyzico',
                'code' => 'iyzico',
                'type' => 'payment',
                'description' => 'İyzico ödeme sistemi entegrasyonu.',
                'is_active' => false,
                'is_configured' => false,
            ],
            [
                'name' => 'PayTR',
                'code' => 'paytr',
                'type' => 'payment',
                'description' => 'PayTR ödeme sistemi entegrasyonu.',
                'is_active' => false,
                'is_configured' => false,
            ],
            [
                'name' => 'Stripe',
                'code' => 'stripe',
                'type' => 'payment',
                'description' => 'Stripe global ödeme sistemi entegrasyonu.',
                'is_active' => false,
                'is_configured' => false,
            ],

            // Shipping/Cargo
            [
                'name' => 'Aras Kargo',
                'code' => 'aras_kargo',
                'type' => 'shipping',
                'description' => 'Aras Kargo entegrasyonu. Otomatik gönderi oluşturma ve takip.',
                'is_active' => false,
                'is_configured' => false,
            ],
            [
                'name' => 'Yurtiçi Kargo',
                'code' => 'yurtici_kargo',
                'type' => 'shipping',
                'description' => 'Yurtiçi Kargo entegrasyonu.',
                'is_active' => false,
                'is_configured' => false,
            ],
            [
                'name' => 'MNG Kargo',
                'code' => 'mng_kargo',
                'type' => 'shipping',
                'description' => 'MNG Kargo entegrasyonu.',
                'is_active' => false,
                'is_configured' => false,
            ],

            // E-Commerce Marketplaces
            [
                'name' => 'Trendyol',
                'code' => 'trendyol',
                'type' => 'marketplace',
                'description' => 'Trendyol pazaryeri entegrasyonu. Ürün ve sipariş senkronizasyonu.',
                'is_active' => false,
                'is_configured' => false,
            ],
            [
                'name' => 'Hepsiburada',
                'code' => 'hepsiburada',
                'type' => 'marketplace',
                'description' => 'Hepsiburada pazaryeri entegrasyonu.',
                'is_active' => false,
                'is_configured' => false,
            ],
            [
                'name' => 'N11',
                'code' => 'n11',
                'type' => 'marketplace',
                'description' => 'N11 pazaryeri entegrasyonu.',
                'is_active' => false,
                'is_configured' => false,
            ],

            // SMS Services
            [
                'name' => 'Netgsm',
                'code' => 'netgsm',
                'type' => 'sms',
                'description' => 'Netgsm SMS servisi entegrasyonu.',
                'is_active' => false,
                'is_configured' => false,
            ],
            [
                'name' => 'İleti Merkezi',
                'code' => 'iletimerkezi',
                'type' => 'sms',
                'description' => 'İleti Merkezi SMS servisi entegrasyonu.',
                'is_active' => false,
                'is_configured' => false,
            ],

            // Other Services
            [
                'name' => 'TCMB Döviz Kuru',
                'code' => 'tcmb_currency',
                'type' => 'currency',
                'description' => 'Türkiye Cumhuriyet Merkez Bankası döviz kuru servisi.',
                'is_active' => false,
                'is_configured' => false,
            ],
        ];

        foreach ($integrations as $integration) {
            Integration::updateOrCreate(
                ['code' => $integration['code']],
                $integration
            );
        }
    }
}
