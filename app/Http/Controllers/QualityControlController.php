<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QualityControlController extends Controller
{
    public function index(): Response
    {
        // Demo data - gerçek uygulamada veritabanından gelecek
        $qualityControlItems = [
            [
                'id' => 1,
                'item_code' => 'ITM001',
                'item_name' => 'Samsung Galaxy Tablet',
                'batch_number' => 'SGT2024001',
                'received_quantity' => 10,
                'received_date' => '2024-01-20',
                'status' => 'pending',
                'inspector' => null,
                'quality_notes' => null,
                'damage_details' => null,
                'priority' => 'high',
                'warehouse' => [
                    'name' => 'Ana Depo',
                    'code' => 'AD001'
                ],
                'supplier_name' => 'ABC Elektronik A.Ş.',
                'days_waiting' => 3
            ],
            [
                'id' => 2,
                'item_code' => 'ITM002',
                'item_name' => 'Cam Kapaklı Konserve',
                'batch_number' => 'CK2024015',
                'received_quantity' => 50,
                'received_date' => '2024-01-21',
                'status' => 'pending',
                'inspector' => null,
                'quality_notes' => null,
                'damage_details' => null,
                'priority' => 'medium',
                'warehouse' => [
                    'name' => 'Ana Depo',
                    'code' => 'AD001'
                ],
                'supplier_name' => 'Gıda Tedarik Ltd.',
                'days_waiting' => 2
            ],
            [
                'id' => 3,
                'item_code' => 'ITM003',
                'item_name' => 'Medikal Maske',
                'batch_number' => 'MM2024050',
                'received_quantity' => 100,
                'received_date' => '2024-01-19',
                'status' => 'approved',
                'inspector' => 'Ahmet Yılmaz',
                'quality_notes' => 'Kalite standartlarına uygun. Ambalaj hasarsız.',
                'damage_details' => null,
                'priority' => 'high',
                'warehouse' => [
                    'name' => 'Ana Depo',
                    'code' => 'AD001'
                ],
                'supplier_name' => 'Sağlık Malzemeleri San.',
                'days_waiting' => 0
            ],
            [
                'id' => 4,
                'item_code' => 'ITM004',
                'item_name' => 'Cam Şişe (500ml)',
                'batch_number' => 'CS2024012',
                'received_quantity' => 25,
                'received_date' => '2024-01-18',
                'status' => 'rejected',
                'inspector' => 'Fatma Kara',
                'quality_notes' => 'Ambalajda hasar tespit edildi.',
                'damage_details' => '5 adet şişede çatlak mevcut. Taşıma sırasında oluşmuş olabilir.',
                'priority' => 'medium',
                'warehouse' => [
                    'name' => 'Ana Depo',
                    'code' => 'AD001'
                ],
                'supplier_name' => 'Cam Ürünleri A.Ş.',
                'days_waiting' => 0
            ],
            [
                'id' => 5,
                'item_code' => 'ITM005',
                'item_name' => 'Kırtasiye Set',
                'batch_number' => null,
                'received_quantity' => 20,
                'received_date' => '2024-01-22',
                'status' => 'pending',
                'inspector' => null,
                'quality_notes' => null,
                'damage_details' => null,
                'priority' => 'low',
                'warehouse' => [
                    'name' => 'Ana Depo',
                    'code' => 'AD001'
                ],
                'supplier_name' => 'Ofis Malzemeleri Ltd.',
                'days_waiting' => 1
            ]
        ];

        return Inertia::render('Warehouses/QualityControl/Index', [
            'qualityControlItems' => $qualityControlItems
        ]);
    }

    public function show($id): Response
    {
        // Demo data - gerçek uygulamada veritabanından gelecek
        $item = [
            'id' => (int)$id,
            'item_code' => 'ITM001',
            'item_name' => 'Samsung Galaxy Tablet',
            'batch_number' => 'SGT2024001',
            'received_quantity' => 10,
            'received_date' => '2024-01-20T10:30:00',
            'status' => 'pending',
            'inspector' => null,
            'quality_notes' => null,
            'damage_details' => null,
            'priority' => 'high',
            'warehouse' => [
                'name' => 'Ana Depo',
                'code' => 'AD001'
            ],
            'supplier_name' => 'ABC Elektronik A.Ş.',
            'supplier_contact' => 'info@abcelektronik.com',
            'days_waiting' => 3,
            'purchase_order_number' => 'PO-2024-001',
            'unit_price' => 2500.00,
            'total_value' => 25000.00,
            'quality_checklist' => [
                'physical_check' => false,
                'packaging_check' => false,
                'quantity_check' => false,
                'expiry_check' => false,
                'documentation_check' => false,
                'specification_check' => false
            ],
            'photos' => [],
            'history' => [
                [
                    'action' => 'Teslim alındı',
                    'user' => 'Ali Veli',
                    'date' => '2024-01-20 10:30',
                    'note' => 'Depoya giriş yapıldı'
                ],
                [
                    'action' => 'Kalite kontrole gönderildi',
                    'user' => 'Ali Veli',
                    'date' => '2024-01-20 10:35',
                    'note' => 'Yüksek değerli ürün - kalite kontrol gerekli'
                ]
            ]
        ];

        return Inertia::render('Warehouses/QualityControl/Show', [
            'qualityControlItem' => $item
        ]);
    }

    public function approve(Request $request, $id)
    {
        $request->validate([
            'quality_notes' => 'nullable|string|max:1000',
            'inspector_notes' => 'nullable|string|max:1000'
        ]);

        // Burada gerçek onaylama işlemleri yapılacak:
        // 1. quality_control_records tablosunu güncelle
        // 2. Ürünü ana stok alanına taşı
        // 3. Stok seviyelerini güncelle
        // 4. İşlem geçmişini kaydet

        return redirect()->route('warehouses.quality-control.index')
                        ->with('success', 'Ürün başarıyla onaylandı ve stoka alındı.');
    }

    public function reject(Request $request, $id)
    {
        $request->validate([
            'damage_details' => 'required|string|max:1000',
            'quality_notes' => 'nullable|string|max:1000',
            'action_required' => 'required|in:return_supplier,quarantine,dispose'
        ]);

        // Burada gerçek reddetme işlemleri yapılacak:
        // 1. quality_control_records tablosunu güncelle
        // 2. Ürünü karantina alanına taşı veya iade işlemi başlat
        // 3. Tedarikçiye bildirim gönder
        // 4. İşlem geçmişini kaydet

        return redirect()->route('warehouses.quality-control.index')
                        ->with('success', 'Ürün reddedildi ve uygun işlem başlatıldı.');
    }

    public function updatePriority(Request $request, $id)
    {
        $request->validate([
            'priority' => 'required|in:low,medium,high'
        ]);

        // Öncelik güncellemesi
        return redirect()->back()->with('success', 'Öncelik seviyesi güncellendi.');
    }
}