<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Setting;

class SalesReturnSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'sales_return.max_days',
                'value' => '15',
                'type' => 'integer',
                'group' => 'sales_return',
                'description' => 'Maksimum iade süresi (gün). Sipariş teslim tarihinden itibaren kaç gün içinde iade yapılabilir.',
                'is_public' => false,
            ],
            [
                'key' => 'sales_return.min_images',
                'value' => '3',
                'type' => 'integer',
                'group' => 'sales_return',
                'description' => 'Her ürün için yüklenebilecek minimum fotoğraf sayısı.',
                'is_public' => false,
            ],
            [
                'key' => 'sales_return.auto_approve_limit',
                'value' => '1000',
                'type' => 'integer',
                'group' => 'sales_return',
                'description' => 'Otomatik onay limiti (TL). Bu tutarın altındaki iadeler otomatik onaylanır.',
                'is_public' => false,
            ],
            [
                'key' => 'sales_return.require_approval',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'sales_return',
                'description' => 'İade onayı gerekli mi? (1: Evet, 0: Hayır)',
                'is_public' => false,
            ],
            [
                'key' => 'sales_return.notification_emails',
                'value' => '',
                'type' => 'text',
                'group' => 'sales_return',
                'description' => 'İade bildirimleri için email adresleri (virgül ile ayırarak giriniz)',
                'is_public' => false,
            ],
            [
                'key' => 'sales_return.allow_partial_return',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'sales_return',
                'description' => 'Kısmi iade yapılabilir mi? (1: Evet, 0: Hayır)',
                'is_public' => false,
            ],
            [
                'key' => 'sales_return.max_image_size_mb',
                'value' => '10',
                'type' => 'integer',
                'group' => 'sales_return',
                'description' => 'Maksimum görsel dosya boyutu (MB)',
                'is_public' => false,
            ],
            [
                'key' => 'sales_return.refund_processing_days',
                'value' => '7',
                'type' => 'integer',
                'group' => 'sales_return',
                'description' => 'İade tutarının işlenme süresi (iş günü)',
                'is_public' => false,
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('Sales return settings seeded successfully!');
    }
}
