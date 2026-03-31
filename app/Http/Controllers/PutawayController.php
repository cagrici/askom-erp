<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PutawayController extends Controller
{
    public function index(): Response
    {
        // Demo data - gerçek uygulamada AI algoritması ile lokasyon önerileri hesaplanacak
        $putawayItems = [
            [
                'id' => 1,
                'item_code' => 'ELK001',
                'item_name' => 'Samsung Galaxy Tablet',
                'category' => 'Elektronik',
                'quantity' => 10,
                'unit' => 'adet',
                'batch_number' => 'SGT2024001',
                'received_date' => '2024-01-20T10:30:00',
                'quality_status' => 'approved',
                'current_location' => null,
                'suggested_locations' => [
                    [
                        'location_id' => 101,
                        'location_code' => 'A-01-001',
                        'location_name' => 'Elektronik Raf 1',
                        'zone_name' => 'Elektronik Bölgesi',
                        'zone_type' => 'Yüksek Değerli',
                        'compatibility_score' => 95,
                        'distance_score' => 88,
                        'capacity_utilization' => 45,
                        'reasons' => [
                            'Aynı kategori ürünler mevcut',
                            'Güvenlik kamerası kapsamında',
                            'Klimalı ortam',
                            'Kolay erişim'
                        ],
                        'warnings' => []
                    ],
                    [
                        'location_id' => 102,
                        'location_code' => 'A-01-005',
                        'location_name' => 'Elektronik Raf 5',
                        'zone_name' => 'Elektronik Bölgesi',
                        'zone_type' => 'Yüksek Değerli',
                        'compatibility_score' => 87,
                        'distance_score' => 75,
                        'capacity_utilization' => 60,
                        'reasons' => [
                            'Benzer ürünler mevcut',
                            'İyi havalandırma'
                        ],
                        'warnings' => [
                            'Kapasite %60 dolu'
                        ]
                    ]
                ],
                'priority' => 'high',
                'warehouse' => [
                    'id' => 1,
                    'name' => 'Ana Depo',
                    'code' => 'AD001'
                ],
                'dimensions' => [
                    'length' => 25,
                    'width' => 18,
                    'height' => 2,
                    'weight' => 0.5
                ],
                'storage_requirements' => ['Klimalı', 'Kuru', 'Güvenli']
            ],
            [
                'id' => 2,
                'item_code' => 'GDA001',
                'item_name' => 'Organik Zeytinyağı',
                'category' => 'Gıda',
                'quantity' => 50,
                'unit' => 'litre',
                'batch_number' => 'OZ2024015',
                'received_date' => '2024-01-21T14:15:00',
                'quality_status' => 'approved',
                'current_location' => null,
                'suggested_locations' => [
                    [
                        'location_id' => 201,
                        'location_code' => 'B-02-010',
                        'location_name' => 'Gıda Rafı 10',
                        'zone_name' => 'Gıda Bölgesi',
                        'zone_type' => 'Sıcaklık Kontrollü',
                        'compatibility_score' => 92,
                        'distance_score' => 85,
                        'capacity_utilization' => 30,
                        'reasons' => [
                            'Gıda ürünleri bölgesi',
                            'Uygun sıcaklık',
                            'FIFO sistemi mevcut'
                        ],
                        'warnings' => []
                    ]
                ],
                'priority' => 'medium',
                'warehouse' => [
                    'id' => 1,
                    'name' => 'Ana Depo',
                    'code' => 'AD001'
                ],
                'dimensions' => [
                    'length' => 30,
                    'width' => 20,
                    'height' => 35,
                    'weight' => 50
                ],
                'storage_requirements' => ['Sıcaklık Kontrollü', 'Karanlık', 'FIFO']
            ],
            [
                'id' => 3,
                'item_code' => 'CAM001',
                'item_name' => 'Cam Şişe Seti',
                'category' => 'Ev Eşyaları',
                'quantity' => 25,
                'unit' => 'set',
                'batch_number' => null,
                'received_date' => '2024-01-22T09:45:00',
                'quality_status' => 'approved',
                'current_location' => [
                    'id' => 301,
                    'code' => 'C-03-005',
                    'name' => 'Kırılabilir Raf 5',
                    'zone' => 'Özel Bakım Bölgesi'
                ],
                'suggested_locations' => [],
                'priority' => 'low',
                'warehouse' => [
                    'id' => 1,
                    'name' => 'Ana Depo',
                    'code' => 'AD001'
                ],
                'dimensions' => [
                    'length' => 20,
                    'width' => 15,
                    'height' => 25,
                    'weight' => 2.5
                ],
                'storage_requirements' => ['Kırılabilir', 'Dikkatli Taşıma', 'Yastıklı']
            ],
            [
                'id' => 4,
                'item_code' => 'KRT001',
                'item_name' => 'Ofis Kırtasiye Seti',
                'category' => 'Kırtasiye',
                'quantity' => 100,
                'unit' => 'paket',
                'batch_number' => null,
                'received_date' => '2024-01-23T11:20:00',
                'quality_status' => 'pending',
                'current_location' => null,
                'suggested_locations' => [
                    [
                        'location_id' => 401,
                        'location_code' => 'D-04-020',
                        'location_name' => 'Genel Raf 20',
                        'zone_name' => 'Genel Bölge',
                        'zone_type' => 'Standart',
                        'compatibility_score' => 78,
                        'distance_score' => 65,
                        'capacity_utilization' => 80,
                        'reasons' => [
                            'Standart ürünler bölgesi',
                            'Kolay erişim'
                        ],
                        'warnings' => [
                            'Kapasite neredeyse dolu',
                            'Kalite kontrol bekliyor'
                        ]
                    ]
                ],
                'priority' => 'low',
                'warehouse' => [
                    'id' => 1,
                    'name' => 'Ana Depo',
                    'code' => 'AD001'
                ],
                'dimensions' => [
                    'length' => 40,
                    'width' => 30,
                    'height' => 15,
                    'weight' => 10
                ],
                'storage_requirements' => ['Kuru', 'Normal Sıcaklık']
            ]
        ];

        $warehouses = [
            ['id' => 1, 'name' => 'Ana Depo', 'code' => 'AD001'],
            ['id' => 2, 'name' => 'Yan Depo', 'code' => 'YD002']
        ];

        return Inertia::render('Warehouses/Putaway/Index', [
            'putawayItems' => $putawayItems,
            'warehouses' => $warehouses
        ]);
    }

    public function show($id): Response
    {
        // Demo data - gerçek uygulamada veritabanından gelecek
        $putawayItem = [
            'id' => (int)$id,
            'item_code' => 'ELK001',
            'item_name' => 'Samsung Galaxy Tablet',
            'category' => 'Elektronik',
            'quantity' => 10,
            'unit' => 'adet',
            'batch_number' => 'SGT2024001',
            'received_date' => '2024-01-20T10:30:00',
            'quality_status' => 'approved',
            'current_location' => null,
            'suggested_locations' => [
                [
                    'location_id' => 101,
                    'location_code' => 'A-01-001',
                    'location_name' => 'Elektronik Raf 1',
                    'zone_name' => 'Elektronik Bölgesi',
                    'zone_type' => 'Yüksek Değerli',
                    'compatibility_score' => 95,
                    'distance_score' => 88,
                    'capacity_utilization' => 45,
                    'available_capacity' => 15,
                    'reasons' => [
                        'Aynı kategori ürünler mevcut',
                        'Güvenlik kamerası kapsamında',
                        'Klimalı ortam',
                        'Kolay erişim',
                        'RFID okuyucu mevcut'
                    ],
                    'warnings' => [],
                    'coordinates' => [
                        'x' => 5,
                        'y' => 12,
                        'level' => 2
                    ],
                    'estimated_time' => 3
                ],
                [
                    'location_id' => 102,
                    'location_code' => 'A-01-005',
                    'location_name' => 'Elektronik Raf 5',
                    'zone_name' => 'Elektronik Bölgesi',
                    'zone_type' => 'Yüksek Değerli',
                    'compatibility_score' => 87,
                    'distance_score' => 75,
                    'capacity_utilization' => 60,
                    'available_capacity' => 8,
                    'reasons' => [
                        'Benzer ürünler mevcut',
                        'İyi havalandırma',
                        'Güvenli bölge'
                    ],
                    'warnings' => [
                        'Kapasite %60 dolu',
                        'Diğer elektronik ürünlerle karışabilir'
                    ],
                    'coordinates' => [
                        'x' => 8,
                        'y' => 15,
                        'level' => 1
                    ],
                    'estimated_time' => 5
                ],
                [
                    'location_id' => 103,
                    'location_code' => 'A-02-003',
                    'location_name' => 'Yüksek Değer Raf 3',
                    'zone_name' => 'Güvenlik Bölgesi',
                    'zone_type' => 'Yüksek Güvenlik',
                    'compatibility_score' => 82,
                    'distance_score' => 65,
                    'capacity_utilization' => 25,
                    'available_capacity' => 20,
                    'reasons' => [
                        'Maksimum güvenlik',
                        'Kamera ve alarm sistemi',
                        'Yeterli kapasite'
                    ],
                    'warnings' => [
                        'Erişim için yetkilendirme gerekli',
                        'Uzak mesafe'
                    ],
                    'coordinates' => [
                        'x' => 15,
                        'y' => 8,
                        'level' => 3
                    ],
                    'estimated_time' => 8
                ]
            ],
            'priority' => 'high',
            'warehouse' => [
                'id' => 1,
                'name' => 'Ana Depo',
                'code' => 'AD001'
            ],
            'dimensions' => [
                'length' => 25,
                'width' => 18,
                'height' => 2,
                'weight' => 0.5
            ],
            'storage_requirements' => ['Klimalı', 'Kuru', 'Güvenli', 'RFID Taglı'],
            'supplier_name' => 'ABC Elektronik A.Ş.',
            'value' => 25000.00
        ];

        return Inertia::render('Warehouses/Putaway/Show', [
            'putawayItem' => $putawayItem
        ]);
    }

    public function assign(Request $request, $itemId, $locationId)
    {
        // Gerçek uygulamada:
        // 1. Ürünü belirtilen lokasyona ata
        // 2. Stok hareketini kaydet
        // 3. Lokasyon kapasitesini güncelle
        // 4. Put-away işlemini tamamla
        // 5. Operasyon geçmişini kaydet

        return redirect()->route('warehouses.putaway.index')
                        ->with('success', 'Ürün başarıyla lokasyona yerleştirildi.');
    }

    public function bulkAssign(Request $request)
    {
        $request->validate([
            'item_ids' => 'required|array',
            'item_ids.*' => 'integer'
        ]);

        $itemIds = $request->input('item_ids');
        $assignedCount = 0;

        // Gerçek uygulamada her ürün için en iyi lokasyonu bul ve ata
        foreach ($itemIds as $itemId) {
            // AI algoritması ile optimal lokasyon seç
            // Ürünü lokasyona ata
            $assignedCount++;
        }

        return redirect()->route('warehouses.putaway.index')
                        ->with('success', "$assignedCount ürün başarıyla yerleştirildi.");
    }

    public function optimize()
    {
        // Gerçek uygulamada:
        // 1. Tüm bekleyen ürünler için AI algoritması çalıştır
        // 2. Lokasyon önerilerini güncelle
        // 3. Kapasite ve verimlilik hesaplamalarını yenile
        // 4. Çakışan yerleştirmeleri çöz

        return redirect()->route('warehouses.putaway.index')
                        ->with('success', 'Yerleştirme önerileri optimize edildi.');
    }

    public function manual($id)
    {
        // Manuel yerleştirme sayfası
        return Inertia::render('Warehouses/Putaway/Manual', [
            'itemId' => $id
        ]);
    }

    public function analytics()
    {
        // Put-away analytics ve performans metrikleri
        $analytics = [
            'total_items_processed' => 1250,
            'average_putaway_time' => 4.2, // dakika
            'space_utilization' => 78.5, // yüzde
            'accuracy_rate' => 96.8, // yüzde
            'top_categories' => [
                ['name' => 'Elektronik', 'count' => 450, 'percentage' => 36],
                ['name' => 'Gıda', 'count' => 350, 'percentage' => 28],
                ['name' => 'Ev Eşyaları', 'count' => 250, 'percentage' => 20],
                ['name' => 'Kırtasiye', 'count' => 200, 'percentage' => 16]
            ],
            'efficiency_by_zone' => [
                ['zone' => 'Elektronik Bölgesi', 'efficiency' => 94.2],
                ['zone' => 'Gıda Bölgesi', 'efficiency' => 91.8],
                ['zone' => 'Genel Bölge', 'efficiency' => 87.5],
                ['zone' => 'Özel Bakım', 'efficiency' => 89.3]
            ]
        ];

        return Inertia::render('Warehouses/Putaway/Analytics', [
            'analytics' => $analytics
        ]);
    }
}