<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        // Önce mevcut verileri temizle
        Unit::truncate();
        
        $units = [
            // Length units (Uzunluk Birimleri)
            ['name' => 'Metre', 'symbol' => 'm', 'type' => 'length', 'conversion_factor' => null, 'base_unit_id' => null, 'description' => 'Temel uzunluk birimi'],
            ['name' => 'Santimetre', 'symbol' => 'cm', 'type' => 'length', 'conversion_factor' => 0.01, 'base_unit_id' => 1, 'description' => '1 m = 100 cm'],
            ['name' => 'Milimetre', 'symbol' => 'mm', 'type' => 'length', 'conversion_factor' => 0.001, 'base_unit_id' => 1, 'description' => '1 m = 1000 mm'],
            ['name' => 'Kilometre', 'symbol' => 'km', 'type' => 'length', 'conversion_factor' => 1000, 'base_unit_id' => 1, 'description' => '1 km = 1000 m'],
            ['name' => 'İnç', 'symbol' => 'in', 'type' => 'length', 'conversion_factor' => 0.0254, 'base_unit_id' => 1, 'description' => '1 in = 2.54 cm'],

            // Weight units (Ağırlık Birimleri)
            ['name' => 'Kilogram', 'symbol' => 'kg', 'type' => 'weight', 'conversion_factor' => null, 'base_unit_id' => null, 'description' => 'Temel ağırlık birimi'],
            ['name' => 'Gram', 'symbol' => 'g', 'type' => 'weight', 'conversion_factor' => 0.001, 'base_unit_id' => 6, 'description' => '1 kg = 1000 g'],
            ['name' => 'Ton', 'symbol' => 't', 'type' => 'weight', 'conversion_factor' => 1000, 'base_unit_id' => 6, 'description' => '1 t = 1000 kg'], 
            ['name' => 'Miligram', 'symbol' => 'mg', 'type' => 'weight', 'conversion_factor' => 0.000001, 'base_unit_id' => 6, 'description' => '1 kg = 1.000.000 mg'],
            ['name' => 'Pound', 'symbol' => 'lb', 'type' => 'weight', 'conversion_factor' => 0.453592, 'base_unit_id' => 6, 'description' => '1 lb = 453.592 g'],

            // Volume units (Hacim Birimleri)
            ['name' => 'Litre', 'symbol' => 'L', 'type' => 'volume', 'conversion_factor' => null, 'base_unit_id' => null, 'description' => 'Temel hacim birimi'],
            ['name' => 'Mililitre', 'symbol' => 'mL', 'type' => 'volume', 'conversion_factor' => 0.001, 'base_unit_id' => 11, 'description' => '1 L = 1000 mL'],
            ['name' => 'Metreküp', 'symbol' => 'm³', 'type' => 'volume', 'conversion_factor' => 1000, 'base_unit_id' => 11, 'description' => '1 m³ = 1000 L'],
            ['name' => 'Santimetreküp', 'symbol' => 'cm³', 'type' => 'volume', 'conversion_factor' => 0.001, 'base_unit_id' => 11, 'description' => '1 L = 1000 cm³'],
            ['name' => 'Galon', 'symbol' => 'gal', 'type' => 'volume', 'conversion_factor' => 3.78541, 'base_unit_id' => 11, 'description' => '1 gal = 3.785 L'],

            // Area units (Alan Birimleri)
            ['name' => 'Metrekare', 'symbol' => 'm²', 'type' => 'area', 'conversion_factor' => null, 'base_unit_id' => null, 'description' => 'Temel alan birimi'],
            ['name' => 'Santimetrekare', 'symbol' => 'cm²', 'type' => 'area', 'conversion_factor' => 0.0001, 'base_unit_id' => 16, 'description' => '1 m² = 10.000 cm²'],
            ['name' => 'Dekare', 'symbol' => 'da', 'type' => 'area', 'conversion_factor' => 1000, 'base_unit_id' => 16, 'description' => '1 da = 1000 m²'],
            ['name' => 'Hektar', 'symbol' => 'ha', 'type' => 'area', 'conversion_factor' => 10000, 'base_unit_id' => 16, 'description' => '1 ha = 10.000 m²'],
            ['name' => 'Dönüm', 'symbol' => 'dönüm', 'type' => 'area', 'conversion_factor' => 1000, 'base_unit_id' => 16, 'description' => '1 dönüm = 1000 m² (yaklaşık)'],

            // Piece units (Adet/Parça Birimleri)
            ['name' => 'Adet', 'symbol' => 'ad', 'type' => 'piece', 'conversion_factor' => null, 'base_unit_id' => null, 'description' => 'Temel adet birimi'],
            ['name' => 'Çift', 'symbol' => 'çift', 'type' => 'piece', 'conversion_factor' => 2, 'base_unit_id' => 21, 'description' => '1 çift = 2 adet'],
            ['name' => 'Düzine', 'symbol' => 'düzine', 'type' => 'piece', 'conversion_factor' => 12, 'base_unit_id' => 21, 'description' => '1 düzine = 12 adet'],
            ['name' => 'Gross', 'symbol' => 'gross', 'type' => 'piece', 'conversion_factor' => 144, 'base_unit_id' => 21, 'description' => '1 gross = 144 adet'],
            ['name' => 'Paket', 'symbol' => 'paket', 'type' => 'piece', 'conversion_factor' => 1, 'base_unit_id' => 21, 'description' => 'Paketleme birimi'],
            ['name' => 'Kutu', 'symbol' => 'kutu', 'type' => 'piece', 'conversion_factor' => 1, 'base_unit_id' => 21, 'description' => 'Kutulama birimi'],
            ['name' => 'Koli', 'symbol' => 'koli', 'type' => 'piece', 'conversion_factor' => 1, 'base_unit_id' => 21, 'description' => 'Kolileme birimi'],
            ['name' => 'Palet', 'symbol' => 'palet', 'type' => 'piece', 'conversion_factor' => 1, 'base_unit_id' => 21, 'description' => 'Paletleme birimi'],

            // Time units (Zaman Birimleri)
            ['name' => 'Saat', 'symbol' => 'saat', 'type' => 'time', 'conversion_factor' => null, 'base_unit_id' => null, 'description' => 'Temel zaman birimi'],
            ['name' => 'Dakika', 'symbol' => 'dk', 'type' => 'time', 'conversion_factor' => 0.0167, 'base_unit_id' => 29, 'description' => '1 saat = 60 dakika'],
            ['name' => 'Saniye', 'symbol' => 's', 'type' => 'time', 'conversion_factor' => 0.000278, 'base_unit_id' => 29, 'description' => '1 saat = 3600 saniye'],
            ['name' => 'Gün', 'symbol' => 'gün', 'type' => 'time', 'conversion_factor' => 24, 'base_unit_id' => 29, 'description' => '1 gün = 24 saat'],
            ['name' => 'Hafta', 'symbol' => 'hafta', 'type' => 'time', 'conversion_factor' => 168, 'base_unit_id' => 29, 'description' => '1 hafta = 168 saat'],
            ['name' => 'Ay', 'symbol' => 'ay', 'type' => 'time', 'conversion_factor' => 720, 'base_unit_id' => 29, 'description' => '1 ay = 720 saat (30 gün)'],

            // Other units (Diğer Birimler)
            ['name' => 'Derece', 'symbol' => '°', 'type' => 'other', 'conversion_factor' => null, 'base_unit_id' => null, 'description' => 'Açı ölçüm birimi'],
            ['name' => 'Radyan', 'symbol' => 'rad', 'type' => 'other', 'conversion_factor' => 57.2958, 'base_unit_id' => 35, 'description' => '1 rad = 57.296 derece'],
            ['name' => 'Yüzde', 'symbol' => '%', 'type' => 'other', 'conversion_factor' => null, 'base_unit_id' => null, 'description' => 'Yüzdelik oran'],
            ['name' => 'Permil', 'symbol' => '‰', 'type' => 'other', 'conversion_factor' => 0.1, 'base_unit_id' => 37, 'description' => '1 permil = 0.1%'],
        ];

        foreach ($units as $unit) {
            Unit::create([
                'name' => $unit['name'],
                'symbol' => $unit['symbol'],
                'type' => $unit['type'],
                'conversion_factor' => $unit['conversion_factor'],
                'base_unit_id' => $unit['base_unit_id'],
                'is_active' => true,
                'description' => $unit['description'],
            ]);
        }
    }
}