<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\InventoryStock;
use App\Models\InventoryMovement;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class WarehouseReceivingController extends Controller
{
    public function index(): Response
    {
        // Demo data - gerçek uygulamada veritabanından gelecek
        $purchaseOrders = [
            [
                'id' => 1,
                'order_number' => 'PO-2024-001',
                'supplier_name' => 'ABC Tedarik A.Ş.',
                'order_date' => '2024-01-15',
                'expected_delivery_date' => '2024-01-20',
                'status' => 'pending',
                'total_items' => 15,
                'received_items' => 0,
                'warehouse_id' => 1,
                'warehouse' => [
                    'name' => 'Ana Depo',
                    'code' => 'AD001'
                ]
            ],
            [
                'id' => 2,
                'order_number' => 'PO-2024-002',
                'supplier_name' => 'XYZ Elektronik Ltd.',
                'order_date' => '2024-01-16',
                'expected_delivery_date' => '2024-01-21',
                'status' => 'partial',
                'total_items' => 25,
                'received_items' => 12,
                'warehouse_id' => 1,
                'warehouse' => [
                    'name' => 'Ana Depo',
                    'code' => 'AD001'
                ]
            ],
            [
                'id' => 3,
                'order_number' => 'PO-2024-003',
                'supplier_name' => 'DEF Malzeme San.',
                'order_date' => '2024-01-17',
                'expected_delivery_date' => '2024-01-22',
                'status' => 'completed',
                'total_items' => 8,
                'received_items' => 8,
                'warehouse_id' => 1,
                'warehouse' => [
                    'name' => 'Ana Depo',
                    'code' => 'AD001'
                ]
            ]
        ];

        return Inertia::render('Warehouses/Receiving/Index', [
            'purchaseOrders' => $purchaseOrders
        ]);
    }

    public function show($id): Response
    {
        // Demo data - gerçek uygulamada veritabanından gelecek
        $purchaseOrder = [
            'id' => (int)$id,
            'order_number' => 'PO-2024-001',
            'supplier_name' => 'ABC Tedarik A.Ş.',
            'supplier_contact' => 'info@abctedarik.com',
            'order_date' => '2024-01-15',
            'expected_delivery_date' => '2024-01-20',
            'delivery_date' => null,
            'status' => 'pending',
            'total_amount' => 15750.00,
            'warehouse' => [
                'id' => 1,
                'name' => 'Ana Depo',
                'code' => 'AD001'
            ],
            'items' => [
                [
                    'id' => 1,
                    'item_code' => 'ITM001',
                    'item_name' => 'Laptop Adaptörü',
                    'ordered_quantity' => 10,
                    'received_quantity' => 0,
                    'remaining_quantity' => 10,
                    'unit_price' => 125.50,
                    'total_price' => 1255.00,
                    'barcode' => '1234567890123',
                    'batch_number' => null,
                    'expiry_date' => null
                ],
                [
                    'id' => 2,
                    'item_code' => 'ITM002',
                    'item_name' => 'USB Kablo',
                    'ordered_quantity' => 25,
                    'received_quantity' => 0,
                    'remaining_quantity' => 25,
                    'unit_price' => 15.75,
                    'total_price' => 393.75,
                    'barcode' => null,
                    'batch_number' => null,
                    'expiry_date' => null
                ],
                [
                    'id' => 3,
                    'item_code' => 'ITM003',
                    'item_name' => 'Yazıcı Kartuşu',
                    'ordered_quantity' => 5,
                    'received_quantity' => 0,
                    'remaining_quantity' => 5,
                    'unit_price' => 89.25,
                    'total_price' => 446.25,
                    'barcode' => '9876543210987',
                    'batch_number' => null,
                    'expiry_date' => null
                ]
            ],
            'notes' => 'Acil sipariş - öncelikli işlem yapılması gerekiyor.'
        ];

        return Inertia::render('Warehouses/Receiving/Show', [
            'purchaseOrder' => $purchaseOrder
        ]);
    }

    public function process($id): Response
    {
        // Demo data - gerçek uygulamada veritabanından gelecek
        $purchaseOrder = [
            'id' => (int)$id,
            'order_number' => 'PO-2024-001',
            'supplier_name' => 'ABC Tedarik A.Ş.',
            'order_date' => '2024-01-15',
            'expected_delivery_date' => '2024-01-20',
            'warehouse' => [
                'id' => 1,
                'name' => 'Ana Depo',
                'code' => 'AD001'
            ],
            'items' => [
                [
                    'id' => 1,
                    'item_code' => 'ITM001',
                    'item_name' => 'Laptop Adaptörü',
                    'ordered_quantity' => 10,
                    'received_quantity' => 0,
                    'remaining_quantity' => 10,
                    'unit_price' => 125.50,
                    'barcode' => '1234567890123',
                    'batch_number' => null,
                    'expiry_date' => null
                ],
                [
                    'id' => 2,
                    'item_code' => 'ITM002',
                    'item_name' => 'USB Kablo',
                    'ordered_quantity' => 25,
                    'received_quantity' => 0,
                    'remaining_quantity' => 25,
                    'unit_price' => 15.75,
                    'barcode' => null,
                    'batch_number' => null,
                    'expiry_date' => null
                ],
                [
                    'id' => 3,
                    'item_code' => 'ITM003',
                    'item_name' => 'Yazıcı Kartuşu',
                    'ordered_quantity' => 5,
                    'received_quantity' => 0,
                    'remaining_quantity' => 5,
                    'unit_price' => 89.25,
                    'barcode' => '9876543210987',
                    'batch_number' => null,
                    'expiry_date' => null
                ]
            ]
        ];

        return Inertia::render('Warehouses/Receiving/Process', [
            'purchaseOrder' => $purchaseOrder
        ]);
    }

    public function store(Request $request, $id)
    {
        $validated = $request->validate([
            'item_id' => 'required|integer',
            'quantity' => 'required|numeric|min:0.0001',
            'batch_number' => 'nullable|string|max:50',
            'expiry_date' => 'nullable|date',
            'barcode' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:500',
            'quality_status' => 'required|in:pending,approved,rejected',
            'quality_notes' => 'nullable|string|max:1000',
            'damage_details' => 'nullable|string|max:1000',
            'inspector_id' => 'nullable|integer'
        ]);

        try {
            DB::beginTransaction();

            $qualityStatus = $validated['quality_status'];

            // TODO: Gerçek uygulamada purchase order item'dan warehouse_id ve inventory_item_id alınacak
            // Şimdilik demo verilerle çalışıyoruz
            $warehouseId = 1; // Demo warehouse ID
            $inventoryItemId = $validated['item_id']; // Demo - gerçekte purchase_order_items'dan alınacak

            // 1. Stok kaydı oluştur
            $stock = InventoryStock::create([
                'inventory_item_id' => $inventoryItemId,
                'warehouse_id' => $warehouseId,
                'lot_number' => $validated['batch_number'] ?? null,
                'batch_code' => $validated['batch_number'] ?? null,
                'serial_number' => $validated['barcode'] ?? null,
                'quantity_on_hand' => $qualityStatus === 'approved' ? $validated['quantity'] : 0,
                'quantity_available' => $qualityStatus === 'approved' ? $validated['quantity'] : 0,
                'quantity_allocated' => 0,
                'quantity_in_transit' => 0,
                'received_date' => now(),
                'expiry_date' => $validated['expiry_date'] ?? null,
                'quality_approved' => $qualityStatus === 'approved',
                'condition' => $qualityStatus === 'approved' ? 'good' : ($qualityStatus === 'rejected' ? 'damaged' : 'pending_inspection'),
                'condition_notes' => $validated['quality_notes'] ?? $validated['damage_details'] ?? null,
                'status' => $qualityStatus === 'rejected' ? 'quarantine' : ($qualityStatus === 'pending' ? 'pending_qc' : 'available'),
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id()
            ]);

            // 2. Stok hareketi kaydı oluştur
            $movementNumber = 'RCV-' . now()->format('Ymd') . '-' . str_pad($id, 6, '0', STR_PAD_LEFT);

            InventoryMovement::create([
                'movement_number' => $movementNumber,
                'inventory_item_id' => $inventoryItemId,
                'inventory_stock_id' => $stock->id,
                'movement_type' => 'receiving',
                'direction' => 'in',
                'warehouse_id' => $warehouseId,
                'to_warehouse_id' => $warehouseId,
                'quantity' => $validated['quantity'],
                'base_quantity' => $validated['quantity'],
                'lot_number' => $validated['batch_number'] ?? null,
                'batch_code' => $validated['batch_number'] ?? null,
                'serial_number' => $validated['barcode'] ?? null,
                'movement_date' => now(),
                'effective_date' => now(),
                'expiry_date' => $validated['expiry_date'] ?? null,
                'reference_type' => 'purchase_order',
                'reference_id' => $id,
                'reference_number' => 'PO-' . $id,
                'document_type' => 'goods_receipt',
                'document_number' => $movementNumber,
                'document_date' => now(),
                'quality_check_done' => $qualityStatus !== 'pending',
                'quality_results' => json_encode([
                    'status' => $qualityStatus,
                    'notes' => $validated['quality_notes'] ?? null,
                    'damage_details' => $validated['damage_details'] ?? null,
                    'inspector_id' => $validated['inspector_id'] ?? Auth::id(),
                    'inspection_date' => now()
                ]),
                'condition_after' => $qualityStatus === 'approved' ? 'good' : ($qualityStatus === 'rejected' ? 'damaged' : 'pending'),
                'notes' => $validated['notes'] ?? null,
                'created_by_id' => Auth::id()
            ]);

            // 3. TODO: Purchase order item güncelle (received_quantity artır)
            // PurchaseOrderItem::where('id', $validated['item_id'])
            //     ->increment('received_quantity', $validated['quantity']);

            DB::commit();

            // Başarı mesajı
            $message = match($qualityStatus) {
                'approved' => 'Ürün başarıyla teslim alındı ve stoğa eklendi!',
                'rejected' => 'Ürün kalite kontrolden reddedildi ve karantina alanına yerleştirildi.',
                'pending' => 'Ürün kalite kontrol beklemede. İnceleme devam ediyor.',
            };

            return redirect()->back()->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Teslim alma sırasında bir hata oluştu: ' . $e->getMessage())
                ->withInput();
        }
    }
}