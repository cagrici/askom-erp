<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GeographicDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Countries
        $countries = [
            ['id' => 1, 'name' => 'Türkiye', 'code' => 'TR', 'code_3' => 'TUR', 'phone_code' => '+90', 'currency_code' => 'TRY', 'currency_symbol' => '₺', 'is_active' => true, 'sort_order' => 1],
            ['id' => 2, 'name' => 'Amerika Birleşik Devletleri', 'code' => 'US', 'code_3' => 'USA', 'phone_code' => '+1', 'currency_code' => 'USD', 'currency_symbol' => '$', 'is_active' => true, 'sort_order' => 2],
            ['id' => 3, 'name' => 'Almanya', 'code' => 'DE', 'code_3' => 'DEU', 'phone_code' => '+49', 'currency_code' => 'EUR', 'currency_symbol' => '€', 'is_active' => true, 'sort_order' => 3],
            ['id' => 4, 'name' => 'Fransa', 'code' => 'FR', 'code_3' => 'FRA', 'phone_code' => '+33', 'currency_code' => 'EUR', 'currency_symbol' => '€', 'is_active' => true, 'sort_order' => 4],
            ['id' => 5, 'name' => 'İngiltere', 'code' => 'GB', 'code_3' => 'GBR', 'phone_code' => '+44', 'currency_code' => 'GBP', 'currency_symbol' => '£', 'is_active' => true, 'sort_order' => 5],
        ];

        foreach ($countries as $country) {
            DB::table('countries')->insertOrIgnore($country);
        }

        // Turkish cities
        $turkishCities = [
            ['id' => 1, 'country_id' => 1, 'name' => 'Adana', 'code' => '01', 'region' => 'Akdeniz', 'is_active' => true, 'sort_order' => 1],
            ['id' => 2, 'country_id' => 1, 'name' => 'Adıyaman', 'code' => '02', 'region' => 'Güneydoğu Anadolu', 'is_active' => true, 'sort_order' => 2],
            ['id' => 3, 'country_id' => 1, 'name' => 'Afyonkarahisar', 'code' => '03', 'region' => 'Ege', 'is_active' => true, 'sort_order' => 3],
            ['id' => 4, 'country_id' => 1, 'name' => 'Ağrı', 'code' => '04', 'region' => 'Doğu Anadolu', 'is_active' => true, 'sort_order' => 4],
            ['id' => 5, 'country_id' => 1, 'name' => 'Amasya', 'code' => '05', 'region' => 'Karadeniz', 'is_active' => true, 'sort_order' => 5],
            ['id' => 6, 'country_id' => 1, 'name' => 'Ankara', 'code' => '06', 'region' => 'İç Anadolu', 'is_active' => true, 'sort_order' => 6],
            ['id' => 7, 'country_id' => 1, 'name' => 'Antalya', 'code' => '07', 'region' => 'Akdeniz', 'is_active' => true, 'sort_order' => 7],
            ['id' => 8, 'country_id' => 1, 'name' => 'Artvin', 'code' => '08', 'region' => 'Karadeniz', 'is_active' => true, 'sort_order' => 8],
            ['id' => 9, 'country_id' => 1, 'name' => 'Aydın', 'code' => '09', 'region' => 'Ege', 'is_active' => true, 'sort_order' => 9],
            ['id' => 10, 'country_id' => 1, 'name' => 'Balıkesir', 'code' => '10', 'region' => 'Marmara', 'is_active' => true, 'sort_order' => 10],
            ['id' => 34, 'country_id' => 1, 'name' => 'İstanbul', 'code' => '34', 'region' => 'Marmara', 'is_active' => true, 'sort_order' => 34],
            ['id' => 35, 'country_id' => 1, 'name' => 'İzmir', 'code' => '35', 'region' => 'Ege', 'is_active' => true, 'sort_order' => 35],
            ['id' => 16, 'country_id' => 1, 'name' => 'Bursa', 'code' => '16', 'region' => 'Marmara', 'is_active' => true, 'sort_order' => 16],
        ];

        foreach ($turkishCities as $city) {
            DB::table('cities')->insertOrIgnore($city);
        }

        // Sample districts for major cities
        $districts = [
            // İstanbul
            ['city_id' => 34, 'name' => 'Kadıköy', 'postal_code' => '34710', 'type' => 'district', 'is_active' => true, 'sort_order' => 1],
            ['city_id' => 34, 'name' => 'Beşiktaş', 'postal_code' => '34349', 'type' => 'district', 'is_active' => true, 'sort_order' => 2],
            ['city_id' => 34, 'name' => 'Şişli', 'postal_code' => '34371', 'type' => 'district', 'is_active' => true, 'sort_order' => 3],
            ['city_id' => 34, 'name' => 'Üsküdar', 'postal_code' => '34662', 'type' => 'district', 'is_active' => true, 'sort_order' => 4],
            ['city_id' => 34, 'name' => 'Fatih', 'postal_code' => '34134', 'type' => 'district', 'is_active' => true, 'sort_order' => 5],
            
            // Ankara
            ['city_id' => 6, 'name' => 'Çankaya', 'postal_code' => '06690', 'type' => 'district', 'is_active' => true, 'sort_order' => 1],
            ['city_id' => 6, 'name' => 'Keçiören', 'postal_code' => '06290', 'type' => 'district', 'is_active' => true, 'sort_order' => 2],
            ['city_id' => 6, 'name' => 'Yenimahalle', 'postal_code' => '06170', 'type' => 'district', 'is_active' => true, 'sort_order' => 3],
            
            // İzmir
            ['city_id' => 35, 'name' => 'Konak', 'postal_code' => '35250', 'type' => 'district', 'is_active' => true, 'sort_order' => 1],
            ['city_id' => 35, 'name' => 'Karşıyaka', 'postal_code' => '35540', 'type' => 'district', 'is_active' => true, 'sort_order' => 2],
            ['city_id' => 35, 'name' => 'Bornova', 'postal_code' => '35040', 'type' => 'district', 'is_active' => true, 'sort_order' => 3],
        ];

        foreach ($districts as $district) {
            DB::table('districts')->insertOrIgnore($district);
        }

        // Tax offices for major cities
        $taxOffices = [
            // İstanbul
            ['city_id' => 34, 'name' => 'Kadıköy Vergi Dairesi', 'code' => '034001', 'type' => 'vergi_dairesi', 'is_active' => true, 'sort_order' => 1],
            ['city_id' => 34, 'name' => 'Beşiktaş Vergi Dairesi', 'code' => '034002', 'type' => 'vergi_dairesi', 'is_active' => true, 'sort_order' => 2],
            ['city_id' => 34, 'name' => 'Şişli Vergi Dairesi', 'code' => '034003', 'type' => 'vergi_dairesi', 'is_active' => true, 'sort_order' => 3],
            ['city_id' => 34, 'name' => 'Üsküdar Vergi Dairesi', 'code' => '034004', 'type' => 'vergi_dairesi', 'is_active' => true, 'sort_order' => 4],
            ['city_id' => 34, 'name' => 'Fatih Vergi Dairesi', 'code' => '034005', 'type' => 'vergi_dairesi', 'is_active' => true, 'sort_order' => 5],
            
            // Ankara
            ['city_id' => 6, 'name' => 'Çankaya Vergi Dairesi', 'code' => '006001', 'type' => 'vergi_dairesi', 'is_active' => true, 'sort_order' => 1],
            ['city_id' => 6, 'name' => 'Keçiören Vergi Dairesi', 'code' => '006002', 'type' => 'vergi_dairesi', 'is_active' => true, 'sort_order' => 2],
            ['city_id' => 6, 'name' => 'Yenimahalle Vergi Dairesi', 'code' => '006003', 'type' => 'vergi_dairesi', 'is_active' => true, 'sort_order' => 3],
            
            // İzmir
            ['city_id' => 35, 'name' => 'Konak Vergi Dairesi', 'code' => '035001', 'type' => 'vergi_dairesi', 'is_active' => true, 'sort_order' => 1],
            ['city_id' => 35, 'name' => 'Karşıyaka Vergi Dairesi', 'code' => '035002', 'type' => 'vergi_dairesi', 'is_active' => true, 'sort_order' => 2],
            ['city_id' => 35, 'name' => 'Bornova Vergi Dairesi', 'code' => '035003', 'type' => 'vergi_dairesi', 'is_active' => true, 'sort_order' => 3],
        ];

        foreach ($taxOffices as $taxOffice) {
            DB::table('tax_offices')->insertOrIgnore($taxOffice);
        }
    }
}