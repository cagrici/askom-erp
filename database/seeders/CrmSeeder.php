<?php

namespace Database\Seeders;

use App\Models\LeadStage;
use App\Models\LeadSource;
use App\Models\PipelineStage;
use App\Models\User;
use Illuminate\Database\Seeder;

class CrmSeeder extends Seeder
{
    public function run(): void
    {
        $adminUser = User::first();
        $userId = $adminUser?->id ?? 1;

        $this->seedLeadStages($userId);
        $this->seedLeadSources($userId);
        $this->seedPipelineStages($userId);
    }

    private function seedLeadStages(int $userId): void
    {
        $stages = [
            [
                'name' => 'Yeni',
                'slug' => 'yeni',
                'color' => '#6366f1',
                'icon' => 'ri-add-circle-line',
                'description' => 'Yeni gelen potansiyel müşteriler',
                'sort_order' => 1,
                'is_default' => true,
                'win_probability' => 10,
            ],
            [
                'name' => 'İletişime Geçildi',
                'slug' => 'iletisime-gecildi',
                'color' => '#8b5cf6',
                'icon' => 'ri-phone-line',
                'description' => 'İlk iletişim kurulmuş müşteriler',
                'sort_order' => 2,
                'win_probability' => 20,
            ],
            [
                'name' => 'Niteleme',
                'slug' => 'niteleme',
                'color' => '#3b82f6',
                'icon' => 'ri-search-line',
                'description' => 'İhtiyaç analizi yapılıyor',
                'sort_order' => 3,
                'win_probability' => 40,
            ],
            [
                'name' => 'Teklif Aşaması',
                'slug' => 'teklif-asamasi',
                'color' => '#f59e0b',
                'icon' => 'ri-file-list-3-line',
                'description' => 'Teklif hazırlanıyor veya gönderildi',
                'sort_order' => 4,
                'win_probability' => 60,
            ],
            [
                'name' => 'Müzakere',
                'slug' => 'muzakere',
                'color' => '#10b981',
                'icon' => 'ri-discuss-line',
                'description' => 'Fiyat ve koşullar görüşülüyor',
                'sort_order' => 5,
                'win_probability' => 80,
            ],
            [
                'name' => 'Kazanıldı',
                'slug' => 'kazanildi',
                'color' => '#22c55e',
                'icon' => 'ri-checkbox-circle-line',
                'description' => 'Müşteriye dönüştürüldü',
                'sort_order' => 6,
                'is_won' => true,
                'win_probability' => 100,
            ],
            [
                'name' => 'Kaybedildi',
                'slug' => 'kaybedildi',
                'color' => '#ef4444',
                'icon' => 'ri-close-circle-line',
                'description' => 'Fırsat kaybedildi',
                'sort_order' => 7,
                'is_lost' => true,
                'win_probability' => 0,
            ],
        ];

        foreach ($stages as $stage) {
            LeadStage::firstOrCreate(
                ['slug' => $stage['slug']],
                array_merge($stage, [
                    'created_by' => $userId,
                    'is_active' => true,
                ])
            );
        }
    }

    private function seedLeadSources(int $userId): void
    {
        $sources = [
            [
                'name' => 'Web Sitesi',
                'slug' => 'web-sitesi',
                'description' => 'Web sitesi üzerinden gelen başvurular',
                'sort_order' => 1,
            ],
            [
                'name' => 'Referans',
                'slug' => 'referans',
                'description' => 'Mevcut müşteri referansları',
                'sort_order' => 2,
            ],
            [
                'name' => 'Sosyal Medya',
                'slug' => 'sosyal-medya',
                'description' => 'Sosyal medya kanalları',
                'sort_order' => 3,
            ],
            [
                'name' => 'Fuar / Etkinlik',
                'slug' => 'fuar-etkinlik',
                'description' => 'Fuar ve etkinliklerden gelen talepler',
                'sort_order' => 4,
            ],
            [
                'name' => 'Telefon',
                'slug' => 'telefon',
                'description' => 'Doğrudan telefon aramaları',
                'sort_order' => 5,
            ],
            [
                'name' => 'E-posta',
                'slug' => 'e-posta',
                'description' => 'E-posta ile gelen talepler',
                'sort_order' => 6,
            ],
            [
                'name' => 'Reklam',
                'slug' => 'reklam',
                'description' => 'Dijital veya geleneksel reklam kampanyaları',
                'sort_order' => 7,
            ],
            [
                'name' => 'Diğer',
                'slug' => 'diger',
                'description' => 'Diğer kaynaklar',
                'sort_order' => 8,
            ],
        ];

        foreach ($sources as $source) {
            LeadSource::firstOrCreate(
                ['slug' => $source['slug']],
                array_merge($source, [
                    'created_by' => $userId,
                    'is_active' => true,
                ])
            );
        }
    }

    private function seedPipelineStages(int $userId): void
    {
        $stages = [
            [
                'name' => 'Ön Değerlendirme',
                'slug' => 'on-degerlendirme',
                'color' => '#6366f1',
                'icon' => 'ri-search-eye-line',
                'description' => 'Teklif için ön değerlendirme',
                'sort_order' => 1,
                'is_default' => true,
                'win_probability' => 10,
            ],
            [
                'name' => 'Teklif Hazırlanıyor',
                'slug' => 'teklif-hazirlaniyor',
                'color' => '#8b5cf6',
                'icon' => 'ri-draft-line',
                'description' => 'Teklif hazırlanma aşamasında',
                'sort_order' => 2,
                'win_probability' => 25,
            ],
            [
                'name' => 'Teklif Gönderildi',
                'slug' => 'teklif-gonderildi',
                'color' => '#3b82f6',
                'icon' => 'ri-send-plane-line',
                'description' => 'Teklif müşteriye iletildi',
                'sort_order' => 3,
                'win_probability' => 40,
            ],
            [
                'name' => 'İnceleniyor',
                'slug' => 'inceleniyor',
                'color' => '#f59e0b',
                'icon' => 'ri-file-search-line',
                'description' => 'Müşteri teklifi inceliyor',
                'sort_order' => 4,
                'win_probability' => 50,
            ],
            [
                'name' => 'Müzakere',
                'slug' => 'muzakere',
                'color' => '#10b981',
                'icon' => 'ri-discuss-line',
                'description' => 'Fiyat ve koşullar görüşülüyor',
                'sort_order' => 5,
                'win_probability' => 70,
            ],
            [
                'name' => 'Onay Bekliyor',
                'slug' => 'onay-bekliyor',
                'color' => '#14b8a6',
                'icon' => 'ri-time-line',
                'description' => 'Müşteri onayı bekleniyor',
                'sort_order' => 6,
                'win_probability' => 85,
            ],
            [
                'name' => 'Kazanıldı',
                'slug' => 'kazanildi',
                'color' => '#22c55e',
                'icon' => 'ri-checkbox-circle-line',
                'description' => 'Teklif kabul edildi',
                'sort_order' => 7,
                'is_won' => true,
                'win_probability' => 100,
            ],
            [
                'name' => 'Kaybedildi',
                'slug' => 'kaybedildi',
                'color' => '#ef4444',
                'icon' => 'ri-close-circle-line',
                'description' => 'Teklif reddedildi',
                'sort_order' => 8,
                'is_lost' => true,
                'win_probability' => 0,
            ],
        ];

        foreach ($stages as $stage) {
            PipelineStage::firstOrCreate(
                ['slug' => $stage['slug']],
                array_merge($stage, [
                    'created_by' => $userId,
                    'is_active' => true,
                ])
            );
        }
    }
}
