<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\ShippingOrder;
use App\Models\ShippingOrderItem;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Vehicle;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class ShippingOrderController extends Controller
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Depo dashboard - Bekleyen sevk emirleri listesi
     */
    public function index(Request $request): Response
    {
        $query = ShippingOrder::with([
            'salesOrder.customer',
            'createdBy',
            'vehicle',
            'driver',
            'items.product',
        ]);

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            // Default: warehouse'da olan siparişler
            $query->inWarehouse();
        }

        // Priority filter
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        // Date filter
        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('shipping_number', 'like', "%{$search}%")
                    ->orWhereHas('salesOrder', function ($sq) use ($search) {
                        $sq->where('order_number', 'like', "%{$search}%");
                    })
                    ->orWhereHas('salesOrder.customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');

        // Priority-based sorting for warehouse view
        if ($sortField === 'priority') {
            $query->orderByRaw("FIELD(priority, 'urgent', 'high', 'normal', 'low') " . ($sortDirection === 'desc' ? 'DESC' : 'ASC'));
        } else {
            $query->orderBy($sortField, $sortDirection);
        }

        $shippingOrders = $query->paginate(20)->withQueryString();

        // Get stats for dashboard
        $stats = [
            'pending' => ShippingOrder::where('status', ShippingOrder::STATUS_PENDING)->count(),
            'picking' => ShippingOrder::whereIn('status', [
                ShippingOrder::STATUS_PICKING_ASSIGNED,
                ShippingOrder::STATUS_PICKING,
            ])->count(),
            'ready_to_ship' => ShippingOrder::where('status', ShippingOrder::STATUS_READY_TO_SHIP)->count(),
            'shipped_today' => ShippingOrder::where('status', ShippingOrder::STATUS_SHIPPED)
                ->whereDate('shipped_at', today())
                ->count(),
        ];

        return Inertia::render('Warehouse/ShippingOrders/Index', [
            'shippingOrders' => $shippingOrders,
            'stats' => $stats,
            'filters' => $request->only(['status', 'priority', 'date_from', 'date_to', 'search', 'sort', 'direction']),
            'statuses' => ShippingOrder::getStatuses(),
            'priorities' => ShippingOrder::getPriorities(),
        ]);
    }

    /**
     * Satışçının sevk emri oluşturma formu
     */
    public function create(Request $request): Response
    {
        $salesOrderId = $request->get('sales_order_id');

        $salesOrder = null;
        $cannotCreateReason = null;
        $existingShippingOrders = [];

        if ($salesOrderId) {
            $salesOrder = SalesOrder::with(['customer', 'items.product', 'shippingOrders' => function ($q) {
                $q->whereNotIn('status', [ShippingOrder::STATUS_CANCELLED]);
            }])
                ->findOrFail($salesOrderId);

            // Check if shipping order can be created
            if (!$salesOrder->canCreateShippingOrder()) {
                // Determine the reason
                $allowedStatuses = [
                    SalesOrder::STATUS_CONFIRMED,
                    SalesOrder::STATUS_IN_PRODUCTION,
                    SalesOrder::STATUS_READY_TO_SHIP,
                ];

                if (!in_array($salesOrder->status, $allowedStatuses)) {
                    $cannotCreateReason = "Bu sipariş '{$salesOrder->status_label}' durumunda olduğu için sevk emri oluşturulamaz.";
                } elseif (!$salesOrder->hasShippableItems()) {
                    // Check if there are existing shipping orders
                    $existingShippingOrders = $salesOrder->shippingOrders;
                    if ($existingShippingOrders->isNotEmpty()) {
                        $cannotCreateReason = "Bu siparişin tüm kalemleri için zaten sevk emri oluşturulmuş.";
                    } else {
                        $cannotCreateReason = "Bu siparişte sevk edilebilir kalem bulunmuyor.";
                    }
                }
            }
        }

        // Get all active vehicles (not just available ones)
        $vehicles = Vehicle::active()->orderBy('plate_number')->get(['id', 'plate_number', 'make', 'model', 'status']);

        // Drivers are users with is_driver = true
        $drivers = User::where('is_driver', true)
            ->where(function ($q) {
                $q->where('is_active_driver', true)
                  ->orWhereNull('is_active_driver');
            })
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Warehouse/ShippingOrders/Create', [
            'salesOrder' => $salesOrder,
            'vehicles' => $vehicles,
            'drivers' => $drivers,
            'priorities' => ShippingOrder::getPriorities(),
            'cannotCreateReason' => $cannotCreateReason,
            'existingShippingOrders' => $existingShippingOrders,
        ]);
    }

    /**
     * Sevk emri oluştur (Satışçı tarafından)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sales_order_id' => 'required|exists:sales_orders,id',
            'vehicle_id' => 'nullable|exists:vehicles,id',
            'driver_id' => 'nullable|exists:users,id',
            'priority' => 'required|in:low,normal,high,urgent',
            'requested_ship_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
            'shipping_notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.sales_order_item_id' => 'required|exists:sales_order_items,id',
            'items.*.shipping_quantity' => 'required|numeric|min:0.001',
        ]);

        $salesOrder = SalesOrder::with('items.product')->findOrFail($validated['sales_order_id']);

        // Check if order can have shipping created
        if (!$salesOrder->canCreateShippingOrder()) {
            return back()->withErrors(['error' => 'Bu sipariş için sevk emri oluşturulamaz.']);
        }

        DB::beginTransaction();

        try {
            // Create shipping order
            $shippingOrder = ShippingOrder::create([
                'sales_order_id' => $salesOrder->id,
                'created_by_id' => auth()->id(),
                'vehicle_id' => $validated['vehicle_id'] ?? null,
                'driver_id' => $validated['driver_id'] ?? null,
                'priority' => $validated['priority'],
                'requested_ship_date' => $validated['requested_ship_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'shipping_notes' => $validated['shipping_notes'] ?? null,
                'shipping_address' => $salesOrder->shipping_address,
                'status' => ShippingOrder::STATUS_PENDING,
            ]);

            $stockWarnings = [];

            // Create shipping order items
            foreach ($validated['items'] as $itemData) {
                $salesOrderItem = SalesOrderItem::findOrFail($itemData['sales_order_item_id']);

                // Check shippable quantity
                if ($itemData['shipping_quantity'] > $salesOrderItem->shippable_quantity) {
                    throw new \Exception(
                        "Ürün '{$salesOrderItem->product_name}' için sevk edilebilir miktar aşıldı. " .
                        "Mevcut: {$salesOrderItem->shippable_quantity}, İstenen: {$itemData['shipping_quantity']}"
                    );
                }

                // Check stock availability
                $stockCheck = $salesOrderItem->checkStockAvailability();
                if (!$stockCheck['available']) {
                    $stockWarnings[] = [
                        'product' => $salesOrderItem->product_name,
                        'required' => $itemData['shipping_quantity'],
                        'available' => $stockCheck['current_stock'],
                        'shortage' => $stockCheck['shortage'],
                    ];
                }

                // Create shipping order item
                ShippingOrderItem::create([
                    'shipping_order_id' => $shippingOrder->id,
                    'sales_order_item_id' => $salesOrderItem->id,
                    'product_id' => $salesOrderItem->product_id,
                    'ordered_quantity' => $salesOrderItem->quantity,
                    'shipping_quantity' => $itemData['shipping_quantity'],
                    'corridor' => $salesOrderItem->corridor,
                    'status' => ShippingOrderItem::STATUS_PENDING,
                ]);

                // Reserve stock
                $salesOrderItem->reserveStock($itemData['shipping_quantity']);
            }

            // Calculate totals
            $shippingOrder->calculateTotals();

            // Update sales order shipping status
            $salesOrder->updateShippingStatus();

            DB::commit();

            $message = 'Sevk emri başarıyla oluşturuldu.';
            if (!empty($stockWarnings)) {
                $message .= ' Dikkat: Bazı ürünlerde stok yetersizliği var.';
            }

            return redirect()
                ->route('warehouse.shipping-orders.show', $shippingOrder)
                ->with('success', $message)
                ->with('stock_warnings', $stockWarnings);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Shipping order creation failed: ' . $e->getMessage());
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Sevk emri detayı
     */
    public function show(ShippingOrder $shippingOrder): Response
    {
        $shippingOrder->load([
            'salesOrder.customer',
            'salesOrder.salesperson',
            'createdBy',
            'vehicle', // Load all vehicle fields for modal
            'driver' => function ($q) {
                // Load driver with all fields including license info
                $q->select([
                    'id', 'name', 'phone', 'mobile_phone',
                    'license_number', 'license_type', 'license_expiry_date',
                    'is_active_driver', 'driver_notes'
                ]);
            },
            'cancelledBy',
            'items.product',
            'items.salesOrderItem',
            'pickingTasks.assignedTo',
            'pickingTasks.items',
        ]);

        // Get available warehouse workers for picking assignment
        $warehouseWorkers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['warehouse_manager', 'warehouse_worker', 'depo_elemani', 'depo_yoneticisi']);
        })->get();

        return Inertia::render('Warehouse/ShippingOrders/Show', [
            'shippingOrder' => $shippingOrder,
            'warehouseWorkers' => $warehouseWorkers,
            'canAssignPicking' => $shippingOrder->canAssignPicking(),
            'canShip' => $shippingOrder->canShip(),
            'canCancel' => $shippingOrder->canBeCancelled(),
            'canEdit' => in_array($shippingOrder->status, [
                ShippingOrder::STATUS_PENDING,
                ShippingOrder::STATUS_PICKING_ASSIGNED,
            ]),
        ]);
    }

    /**
     * Sevk emri düzenleme formu
     */
    public function edit(ShippingOrder $shippingOrder): Response|\Illuminate\Http\RedirectResponse
    {
        // Sadece belirli durumlarda düzenlemeye izin ver
        if (!in_array($shippingOrder->status, [
            ShippingOrder::STATUS_PENDING,
            ShippingOrder::STATUS_PICKING_ASSIGNED,
        ])) {
            return redirect()
                ->route('warehouse.shipping-orders.show', $shippingOrder)
                ->with('error', 'Bu sevk emri düzenlenemez.');
        }

        $shippingOrder->load([
            'salesOrder.customer.deliveryAddresses' => function ($q) {
                $q->where('is_active', true)->orderByDesc('is_default');
            },
            'vehicle',
            'driver',
            'items.product',
        ]);

        // Get all active vehicles
        $vehicles = Vehicle::active()->orderBy('plate_number')->get(['id', 'plate_number', 'make', 'model', 'status']);

        // Drivers are users with is_driver = true
        $drivers = User::where('is_driver', true)
            ->where(function ($q) {
                $q->where('is_active_driver', true)
                  ->orWhereNull('is_active_driver');
            })
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get customer delivery addresses
        $deliveryAddresses = $shippingOrder->salesOrder->customer?->deliveryAddresses()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->get() ?? collect();

        return Inertia::render('Warehouse/ShippingOrders/Edit', [
            'shippingOrder' => $shippingOrder,
            'vehicles' => $vehicles,
            'drivers' => $drivers,
            'priorities' => ShippingOrder::getPriorities(),
            'deliveryAddresses' => $deliveryAddresses,
        ]);
    }

    /**
     * Sevk emri güncelle
     */
    public function update(Request $request, ShippingOrder $shippingOrder)
    {
        // Sadece belirli durumlarda düzenlemeye izin ver
        if (!in_array($shippingOrder->status, [
            ShippingOrder::STATUS_PENDING,
            ShippingOrder::STATUS_PICKING_ASSIGNED,
        ])) {
            return back()->withErrors(['error' => 'Bu sevk emri düzenlenemez.']);
        }

        $validated = $request->validate([
            'vehicle_id' => 'nullable|exists:vehicles,id',
            'driver_id' => 'nullable|exists:users,id',
            'priority' => 'required|in:low,normal,high,urgent',
            'requested_ship_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
            'shipping_notes' => 'nullable|string|max:1000',
            'delivery_address_id' => 'nullable|exists:current_account_delivery_addresses,id',
            'shipping_address' => 'nullable|array',
            'save_address_to_customer' => 'nullable|boolean',
        ]);

        // Build shipping address from delivery address or custom input
        $shippingAddress = $shippingOrder->shipping_address;

        if (!empty($validated['delivery_address_id'])) {
            $deliveryAddress = \App\Models\CurrentAccountDeliveryAddress::find($validated['delivery_address_id']);
            if ($deliveryAddress) {
                $shippingAddress = [
                    'name' => $deliveryAddress->name,
                    'contact_person' => $deliveryAddress->contact_person,
                    'contact_phone' => $deliveryAddress->contact_phone,
                    'address' => $deliveryAddress->address,
                    'district' => $deliveryAddress->district?->name,
                    'city' => $deliveryAddress->city?->name,
                    'postal_code' => $deliveryAddress->postal_code,
                    'delivery_notes' => $deliveryAddress->delivery_notes,
                ];
            }
        } elseif (!empty($validated['shipping_address'])) {
            $shippingAddress = $validated['shipping_address'];

            // Save address to customer's delivery addresses if requested
            if (!empty($validated['save_address_to_customer']) && $shippingOrder->salesOrder->customer_id) {
                $customerId = $shippingOrder->salesOrder->customer_id;
                $addressData = $validated['shipping_address'];

                // Check if address name is provided, use default if not
                $addressName = !empty($addressData['name']) ? $addressData['name'] : 'Teslimat Adresi';

                \App\Models\CurrentAccountDeliveryAddress::create([
                    'current_account_id' => $customerId,
                    'name' => $addressName,
                    'contact_person' => $addressData['contact_person'] ?? null,
                    'contact_phone' => $addressData['contact_phone'] ?? null,
                    'address' => $addressData['address'] ?? null,
                    'postal_code' => $addressData['postal_code'] ?? null,
                    'delivery_notes' => $addressData['delivery_notes'] ?? null,
                    'is_active' => true,
                    'is_default' => false,
                ]);
            }
        }

        $shippingOrder->update([
            'vehicle_id' => $validated['vehicle_id'] ?? null,
            'driver_id' => $validated['driver_id'] ?? null,
            'priority' => $validated['priority'],
            'requested_ship_date' => $validated['requested_ship_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'shipping_notes' => $validated['shipping_notes'] ?? null,
            'shipping_address' => $shippingAddress,
        ]);

        return redirect()
            ->route('warehouse.shipping-orders.show', $shippingOrder)
            ->with('success', 'Sevk emri başarıyla güncellendi.');
    }

    /**
     * Toplama görevi ata (Depo yöneticisi)
     */
    public function assignPicking(Request $request, ShippingOrder $shippingOrder)
    {
        if (!$shippingOrder->canAssignPicking()) {
            return back()->withErrors(['error' => 'Bu sevk emri için toplama ataması yapılamaz.']);
        }

        $validated = $request->validate([
            'assigned_to_id' => 'required|exists:users,id',
            'notes' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();

        try {
            // Create picking task
            $pickingTask = $shippingOrder->pickingTasks()->create([
                'assigned_to_id' => $validated['assigned_to_id'],
                'assigned_by_id' => auth()->id(),
                'status' => 'assigned',
                'notes' => $validated['notes'] ?? null,
            ]);

            // Create picking task items from shipping order items
            foreach ($shippingOrder->items as $item) {
                if ($item->status === ShippingOrderItem::STATUS_PENDING) {
                    $pickingTask->items()->create([
                        'shipping_order_item_id' => $item->id,
                        'product_id' => $item->product_id,
                        'required_quantity' => $item->shipping_quantity - $item->picked_quantity,
                        'corridor' => $item->corridor,
                        'shelf' => $item->shelf,
                        'bin_location' => $item->bin_location,
                        'status' => 'pending',
                    ]);
                }
            }

            // Update picking task totals
            $pickingTask->updateProgress();

            // Update shipping order status
            $shippingOrder->updateStatus(ShippingOrder::STATUS_PICKING_ASSIGNED);

            DB::commit();

            return back()->with('success', 'Toplama görevi başarıyla atandı.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Picking task assignment failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Toplama görevi atanamadı: ' . $e->getMessage()]);
        }
    }

    /**
     * Sevk et (İrsaliye kes)
     */
    public function ship(Request $request, ShippingOrder $shippingOrder)
    {
        if (!$shippingOrder->canShip()) {
            return back()->withErrors(['error' => 'Bu sevk emri sevk edilemez durumda.']);
        }

        $validated = $request->validate([
            'vehicle_id' => 'nullable|exists:vehicles,id',
            'driver_id' => 'nullable|exists:users,id',
            'shipping_notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();

        try {
            // Update vehicle and driver if provided
            if (isset($validated['vehicle_id'])) {
                $shippingOrder->vehicle_id = $validated['vehicle_id'];
            }
            if (isset($validated['driver_id'])) {
                $shippingOrder->driver_id = $validated['driver_id'];
            }

            // Update shipping order status
            $shippingOrder->updateStatus(
                ShippingOrder::STATUS_SHIPPED,
                $validated['shipping_notes'] ?? null
            );

            // Update shipping order items
            foreach ($shippingOrder->items as $item) {
                if ($item->status === ShippingOrderItem::STATUS_PICKED) {
                    $item->status = ShippingOrderItem::STATUS_SHIPPED;
                    $item->save();

                    // Record shipped quantity on sales order item
                    $item->salesOrderItem->recordShippedQuantity($item->picked_quantity);
                }
            }

            // Update sales order shipping status
            $shippingOrder->salesOrder->updateShippingStatus();

            // TODO: Logo'ya irsaliye senkronizasyonu
            // $this->syncDispatchToLogo($shippingOrder);

            DB::commit();

            return back()->with('success', 'Sevk işlemi başarıyla tamamlandı.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Shipping failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Sevk işlemi başarısız: ' . $e->getMessage()]);
        }
    }

    /**
     * Teslim edildi olarak işaretle
     */
    public function markDelivered(Request $request, ShippingOrder $shippingOrder)
    {
        if ($shippingOrder->status !== ShippingOrder::STATUS_SHIPPED) {
            return back()->withErrors(['error' => 'Sadece sevk edilmiş siparişler teslim edildi olarak işaretlenebilir.']);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        $shippingOrder->updateStatus(
            ShippingOrder::STATUS_DELIVERED,
            $validated['notes'] ?? 'Teslim edildi'
        );

        // Update sales order shipping status
        $shippingOrder->salesOrder->updateShippingStatus();

        return back()->with('success', 'Sevk teslim edildi olarak işaretlendi.');
    }

    /**
     * Sevk emrini iptal et
     */
    public function cancel(Request $request, ShippingOrder $shippingOrder)
    {
        if (!$shippingOrder->canBeCancelled()) {
            return back()->withErrors(['error' => 'Bu sevk emri iptal edilemez.']);
        }

        $validated = $request->validate([
            'cancellation_reason' => 'required|string|max:500',
        ]);

        DB::beginTransaction();

        try {
            // Release reserved stock
            foreach ($shippingOrder->items as $item) {
                $item->salesOrderItem->releaseReservedStock($item->shipping_quantity);
                $item->status = ShippingOrderItem::STATUS_CANCELLED;
                $item->save();
            }

            // Cancel picking tasks
            foreach ($shippingOrder->pickingTasks as $task) {
                if ($task->isActive()) {
                    $task->cancel();
                }
            }

            // Update shipping order
            $shippingOrder->cancellation_reason = $validated['cancellation_reason'];
            $shippingOrder->updateStatus(ShippingOrder::STATUS_CANCELLED);

            // Update sales order shipping status
            $shippingOrder->salesOrder->updateShippingStatus();

            DB::commit();

            return back()->with('success', 'Sevk emri başarıyla iptal edildi.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Shipping order cancellation failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'İptal işlemi başarısız: ' . $e->getMessage()]);
        }
    }

    /**
     * Sevke hazır siparişler için API
     */
    public function getShippableSalesOrders(Request $request)
    {
        $salesOrders = SalesOrder::with(['customer', 'items.product'])
            ->whereIn('status', [
                SalesOrder::STATUS_CONFIRMED,
                SalesOrder::STATUS_IN_PRODUCTION,
                SalesOrder::STATUS_READY_TO_SHIP,
            ])
            ->whereHas('items', function ($q) {
                $q->whereRaw('quantity > COALESCE(shipped_quantity, 0)');
            })
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $order->customer->name ?? 'Bilinmiyor',
                    'order_date' => $order->order_date?->format('d.m.Y'),
                    'total_amount' => $order->total_amount,
                    'currency' => $order->currency,
                    'status' => $order->status,
                    'status_label' => $order->status_label,
                    'items_count' => $order->items->count(),
                    'can_ship' => $order->canCreateShippingOrder(),
                ];
            });

        return response()->json($salesOrders);
    }
}
