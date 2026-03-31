<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\SalesRepresentative;
use App\Models\CurrentAccount;
use App\Models\CurrentAccountDeliveryAddress;
use App\Models\Product;
use App\Models\User;
use App\Models\Tax;
use App\Models\Unit;
use App\Models\Country;
use App\Models\City;
use App\Models\District;
use App\Services\PdfService;
use App\Services\SalesOrderExportService;
use App\Services\BulkDiscountHistoryService;
use App\Services\PricingService;
use App\Services\SalesAnalyticsService;
use App\Services\ProductSearchService;
use App\Services\LogoService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SalesOrderController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of sales orders
     */
    public function index(Request $request): Response
    {
        // Authorization check
        Gate::authorize('viewAny', SalesOrder::class);

        $query = SalesOrder::with(['customer', 'salesperson', 'items'])
            ->orderBy('order_date', 'desc');

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->get('search');
            $normalized = str_replace(['ı', 'İ'], ['i', 'i'], mb_strtolower($search, 'UTF-8'));
            $query->where(function ($q) use ($search, $normalized) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%")
                  ->orWhere('external_order_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($customerQuery) use ($normalized) {
                      $customerQuery->whereRaw("LOWER(REPLACE(REPLACE(title, 'ı', 'i'), 'İ', 'i')) LIKE ?", ["%{$normalized}%"]);
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->get('customer_id'));
        }

        if ($request->filled('salesperson_id')) {
            $query->where('salesperson_id', $request->get('salesperson_id'));
        }

        if ($request->filled('product_id')) {
            $productId = $request->get('product_id');
            $query->whereHas('items', function ($q) use ($productId) {
                $q->where('product_id', $productId);
            });
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->get('priority'));
        }

        if ($request->filled('date_from')) {
            $query->where('order_date', '>=', $request->get('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('order_date', '<=', $request->get('date_to'));
        }

        // Apply sorting
        $sortField = $request->get('sort', 'order_date');
        $sortDirection = $request->get('direction', 'desc');

        if (in_array($sortField, ['order_number', 'order_date', 'delivery_date', 'total_amount', 'status', 'priority'])) {
            $query->orderBy($sortField, $sortDirection);
        }

        $salesOrders = $query->paginate(15)->withQueryString();

        // Get selected customer if filter is active (for CustomerSearchSelect initialCustomer)
        $selectedCustomer = null;
        if ($request->filled('customer_id')) {
            $selectedCustomer = CurrentAccount::where('id', $request->get('customer_id'))
                ->first(['id', 'title', 'account_code']);
        }

        // Get selected product if filter is active (for ProductFilterSelect initialProduct)
        $selectedProduct = null;
        if ($request->filled('product_id')) {
            $selectedProduct = Product::where('id', $request->get('product_id'))
                ->first(['id', 'code', 'name']);
        }

        $salespeople = SalesRepresentative::where('is_active', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'logo_code'])
            ->map(fn ($rep) => ['id' => $rep->id, 'name' => $rep->full_name]);

        return Inertia::render('Sales/Orders/Index', [
            'salesOrders' => $salesOrders,
            'filters' => $request->only(['search', 'status', 'customer_id', 'salesperson_id', 'product_id', 'priority', 'date_from', 'date_to', 'sort', 'direction']),
            'selectedCustomer' => $selectedCustomer,
            'selectedProduct' => $selectedProduct,
            'salespeople' => $salespeople,
            'statuses' => SalesOrder::getStatuses(),
            'priorities' => SalesOrder::getPriorities(),
            'userPermissions' => [
                'canCreate' => Gate::allows('create', SalesOrder::class),
                'canEdit' => Gate::allows('update', SalesOrder::class),
                'canDelete' => Gate::allows('delete', SalesOrder::class),
                'canViewAll' => Gate::allows('viewAny', SalesOrder::class),
                'canApprove' => auth()->user()->can('sales.orders.approve'),
            ]
        ]);
    }

    /**
     * Show the form for creating a new sales order
     */
    public function create(): Response
    {
        Gate::authorize('create', SalesOrder::class);

        $customers = CurrentAccount::where('account_type', 'customer')
            ->where('is_active', true)
            ->orderBy('title')
            ->get(['id', 'title', 'account_code', 'payment_term_days', 'currency']);

        $salespeople = SalesRepresentative::where('is_active', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'logo_code'])
            ->map(fn ($rep) => ['id' => $rep->id, 'name' => $rep->full_name]);

        $taxes = Tax::where('is_active', true)
            ->orderBy('rate')
            ->get(['id', 'name', 'rate', 'type', 'code', 'is_default']);

        $units = Unit::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'symbol', 'type']);

        return Inertia::render('Sales/Orders/Create', [
            'customers' => $customers,
            'salespeople' => $salespeople,
            'statuses' => SalesOrder::getStatuses(),
            'priorities' => SalesOrder::getPriorities(),
            'paymentMethods' => SalesOrder::getPaymentMethods(),
            'currencies' => [
                ['value' => 'TRY', 'label' => 'TL'],
                ['value' => 'USD', 'label' => 'USD'],
                ['value' => 'EUR', 'label' => 'EUR'],
            ],
            'taxes' => $taxes,
            'units' => $units,
        ]);
    }

    /**
     * Store a newly created sales order
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', SalesOrder::class);

        $validated = $request->validate([
            'customer_id' => 'required|exists:current_accounts,id',
            'salesperson_id' => 'nullable|exists:sales_representatives,id',
            'order_date' => 'required|date',
            'delivery_date' => 'nullable|date|after_or_equal:order_date',
            'requested_delivery_date' => 'nullable|date|after_or_equal:order_date',
            'priority' => 'required|in:' . implode(',', array_keys(SalesOrder::getPriorities())),
            'payment_term_days' => 'required|integer|min:0|max:365',
            'payment_method' => 'required|in:' . implode(',', array_keys(SalesOrder::getPaymentMethods())),
            'currency' => 'required|string|size:3',
            'exchange_rate' => 'required|numeric|min:0.01',
            'shipping_cost' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'billing_address' => 'nullable|array',
            'shipping_address' => 'nullable|array',
            'notes' => 'nullable|string|max:2000',
            'internal_notes' => 'nullable|string|max:2000',
            'terms_and_conditions' => 'nullable|string|max:5000',
            'reference_number' => 'nullable|string|max:100',
            'external_order_number' => 'nullable|string|max:100',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.unit_id' => 'nullable|exists:units,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_rate1' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_rate2' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_rate3' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.tax_rate' => 'required|numeric|min:0|max:100',
            'items.*.requested_delivery_date' => 'nullable|date',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.special_instructions' => 'nullable|string|max:500',
        ]);

        try {
            DB::beginTransaction();

            // Teklif carisi (ID: 7576) için taslak, diğerleri için onaylandı
            $orderStatus = ($validated['customer_id'] == 7576)
                ? SalesOrder::STATUS_DRAFT
                : SalesOrder::STATUS_CONFIRMED;

            // Create the sales order
            $salesOrder = SalesOrder::create([
                ...$validated,
                'created_by_id' => auth()->id(),
                'status' => $orderStatus,
            ]);

            // Create order items
            foreach ($validated['items'] as $index => $itemData) {
                $item = new SalesOrderItem([
                    ...$itemData,
                    'sort_order' => $index + 1,
                    'status' => SalesOrderItem::STATUS_PENDING,
                ]);

                // Populate product details
                $item->populateProductDetails();

                $salesOrder->items()->save($item);
            }

            // Calculate totals
            $salesOrder->calculateTotals();

            DB::commit();

            // Logo'ya otomatik senkronizasyon (config'den kontrol edilebilir)
            $logoSyncResult = null;
            if (config('services.logo.auto_sync_orders', false)) {
                try {
                    $firmNo = (int) config('services.logo.firm_no', 12);
                    \Log::info('Logo sync starting for new order', ['firm_no' => $firmNo, 'order_id' => $salesOrder->id]);
                    $logoSyncResult = $salesOrder->syncToLogo($firmNo);
                    if (!$logoSyncResult['success']) {
                        \Log::warning('Logo sync failed for new order', [
                            'order_id' => $salesOrder->id,
                            'error' => $logoSyncResult['error'] ?? 'Unknown error'
                        ]);
                    }
                } catch (\Exception $logoException) {
                    \Log::error('Logo sync exception for new order', [
                        'order_id' => $salesOrder->id,
                        'error' => $logoException->getMessage()
                    ]);
                }
            }

            $message = 'Satış siparişi başarıyla oluşturuldu.';
            if ($logoSyncResult && $logoSyncResult['success']) {
                $message .= ' Logo\'ya aktarıldı.';
            }

            return redirect()
                ->route('sales.orders.show', $salesOrder)
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->withInput()
                ->with('error', 'Satış siparişi oluşturulurken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified sales order
     */
    public function show(SalesOrder $salesOrder): Response
    {
        Gate::authorize('view', $salesOrder);

        $salesOrder->load([
            'customer',
            'salesperson',
            'createdBy',
            'cancelledBy',
            'items.product.primaryImage',
            'items.product.brand',
            'items.product.supplier',
            'items.product.baseUnit',
            'statusHistory.changedBy'
        ]);

        // Check stock availability for this order
        $stockAvailability = $salesOrder->checkStockAvailability();

        return Inertia::render('Sales/Orders/Show', [
            'salesOrder' => $salesOrder,
            'statuses' => SalesOrder::getStatuses(),
            'itemStatuses' => SalesOrderItem::getStatuses(),
            'stockAvailability' => $stockAvailability,
            'userPermissions' => [
                'canEdit' => Gate::allows('update', $salesOrder),
                'canDelete' => Gate::allows('delete', $salesOrder),
                'canUpdateStatus' => Gate::allows('updateStatus', $salesOrder),
            ]
        ]);
    }

    /**
     * Show the form for editing the specified sales order
     */
    public function edit(SalesOrder $salesOrder): Response|RedirectResponse
    {
        Gate::authorize('update', $salesOrder);

        if (!$salesOrder->canBeEdited()) {
            return redirect()
                ->route('sales.orders.show', $salesOrder)
                ->with('error', 'Bu sipariş düzenlenemez durumda.');
        }

        $salesOrder->load([
            'customer',
            'salesperson',
            'items.product.category',
            'items.product.brand',
            'items.product.supplier',
            'items.product.baseUnit',
            'items.product.tax',
            'items.unit'
        ]);

        // Manually load primaryImage for each product
        foreach ($salesOrder->items as $item) {
            if ($item->product) {
                $primaryImage = \App\Models\ProductImage::where('product_id', $item->product->id)
                    ->where('is_primary', true)
                    ->first();

                if ($primaryImage) {
                    // Force add primaryImage to product
                    $item->product->primaryImage = $primaryImage;
                    $item->product->setRelation('primaryImage', $primaryImage);

                    // Also add it as a direct property for JSON serialization
                    $item->product->setAttribute('primaryImage', $primaryImage);
                }
            }
        }


        $customers = CurrentAccount::where('account_type', 'customer')
            ->where('is_active', true)
            ->orderBy('title')
            ->get(['id', 'title', 'account_code', 'payment_term_days', 'currency']);

        $salespeople = SalesRepresentative::where('is_active', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'logo_code'])
            ->map(fn ($rep) => ['id' => $rep->id, 'name' => $rep->full_name]);

        $taxes = Tax::where('is_active', true)
            ->orderBy('rate')
            ->get(['id', 'name', 'rate', 'type', 'code', 'is_default']);

        $units = Unit::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'symbol', 'type']);

        // Check stock availability for this order
        $stockAvailability = $salesOrder->checkStockAvailability();

        // Check if Logo dispatch (irsaliye) exists for this order
        $logoDispatch = null;
        if ($salesOrder->logo_id) {
            $logoDispatch = app(LogoService::class)->hasDispatchForOrder($salesOrder->logo_id);
        }

        return Inertia::render('Sales/Orders/Edit', [
            'salesOrder' => $salesOrder,
            'customers' => $customers,
            'salespeople' => $salespeople,
            'statuses' => SalesOrder::getStatuses(),
            'priorities' => SalesOrder::getPriorities(),
            'paymentMethods' => SalesOrder::getPaymentMethods(),
            'currencies' => [
                ['value' => 'TRY', 'label' => 'TL'],
                ['value' => 'USD', 'label' => 'USD'],
                ['value' => 'EUR', 'label' => 'EUR'],
            ],
            'taxes' => $taxes,
            'units' => $units,
            'stockAvailability' => $stockAvailability,
            'logoDispatch' => $logoDispatch,
        ]);
    }

    /**
     * Update the specified sales order
     */
    public function update(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        Gate::authorize('update', $salesOrder);

        if (!$salesOrder->canBeEdited()) {
            return back()->with('error', 'Bu sipariş düzenlenemez durumda.');
        }

        // Block update if Logo dispatch (irsaliye) exists
        if ($salesOrder->logo_id) {
            $dispatch = app(LogoService::class)->hasDispatchForOrder($salesOrder->logo_id);
            if ($dispatch['has_dispatch']) {
                return back()->with('error',
                    "Bu sipariş için Logo'da irsaliye kesilmiş ({$dispatch['dispatch_no']} - {$dispatch['dispatch_date']}). Düzenleme yapılamaz."
                );
            }
        }

        $validated = $request->validate([
            'customer_id' => 'required|exists:current_accounts,id',
            'salesperson_id' => 'nullable|exists:sales_representatives,id',
            'order_date' => 'required|date',
            'delivery_date' => 'nullable|date|after_or_equal:order_date',
            'requested_delivery_date' => 'nullable|date|after_or_equal:order_date',
            'priority' => 'required|in:' . implode(',', array_keys(SalesOrder::getPriorities())),
            'payment_term_days' => 'required|integer|min:0|max:365',
            'payment_method' => 'required|in:' . implode(',', array_keys(SalesOrder::getPaymentMethods())),
            'currency' => 'required|string|size:3',
            'exchange_rate' => 'required|numeric|min:0.01',
            'shipping_cost' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'billing_address' => 'nullable|array',
            'shipping_address' => 'nullable|array',
            'notes' => 'nullable|string|max:2000',
            'internal_notes' => 'nullable|string|max:2000',
            'terms_and_conditions' => 'nullable|string|max:5000',
            'reference_number' => 'nullable|string|max:100',
            'external_order_number' => 'nullable|string|max:100',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:sales_order_items,id',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.unit_id' => 'nullable|exists:units,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_rate1' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_rate2' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_rate3' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.tax_rate' => 'required|numeric|min:0|max:100',
            'items.*.requested_delivery_date' => 'nullable|date',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.special_instructions' => 'nullable|string|max:500',
        ]);

        try {
            DB::beginTransaction();

            // Debug: Log what we're updating
            \Log::info('Sales Order Update Debug STEP 1:', [
                'order_id' => $salesOrder->id,
                'discount_amount_before' => $salesOrder->discount_amount,
                'discount_amount_new' => $validated['discount_amount'] ?? 'NOT PROVIDED',
                'discount_amount_type' => gettype($validated['discount_amount'] ?? null),
                'shipping_cost' => $validated['shipping_cost'] ?? 'NOT PROVIDED',
                'all_validated_keys' => array_keys($validated)
            ]);

            // Get existing item IDs first
            $existingItemIds = $salesOrder->items->pluck('id')->toArray();
            $updatedItemIds = [];

            // Update/create order items
            foreach ($validated['items'] as $index => $itemData) {
                if (isset($itemData['id']) && in_array($itemData['id'], $existingItemIds)) {
                    // Update existing item
                    $item = SalesOrderItem::find($itemData['id']);
                    $item->update([
                        ...$itemData,
                        'sort_order' => $index + 1,
                    ]);
                    $updatedItemIds[] = $item->id;
                } else {
                    // Create new item
                    $item = new SalesOrderItem([
                        ...$itemData,
                        'sort_order' => $index + 1,
                        'status' => SalesOrderItem::STATUS_PENDING,
                    ]);

                    $item->populateProductDetails();
                    $item = $salesOrder->items()->save($item);
                    $updatedItemIds[] = $item->id;
                }
            }

            // Delete removed items
            $itemsToDelete = array_diff($existingItemIds, $updatedItemIds);
            if (!empty($itemsToDelete)) {
                SalesOrderItem::whereIn('id', $itemsToDelete)->delete();
            }

            // Refresh items relationship to get updated calculations
            $salesOrder->load('items');

            // Calculate the totals manually (without overriding discount_amount)
            $itemTax = $salesOrder->items->sum('tax_amount');
            $netSubtotal = $salesOrder->items->sum('line_total') - $itemTax; // KDV hariç net
            $orderDiscount = (float) ($validated['discount_amount'] ?? 0);

            // Sipariş iskontosu KDV matrahını da düşürür
            if ($netSubtotal > 0 && $orderDiscount > 0) {
                $ratio = 1 - ($orderDiscount / $netSubtotal);
                $tax_amount = round($itemTax * $ratio, 2);
            } else {
                $tax_amount = $itemTax;
            }

            $subtotal = $netSubtotal;
            $total_amount = ($netSubtotal - $orderDiscount) + $tax_amount + (float) ($salesOrder->shipping_cost ?? 0);

            // Debug: Log calculated values before update
            \Log::info('Sales Order Update Debug STEP 2:', [
                'calculated_subtotal' => $subtotal,
                'calculated_tax_amount' => $tax_amount,
                'calculated_total_amount' => $total_amount,
                'shipping_cost_used' => $salesOrder->shipping_cost,
                'discount_amount_used' => $orderDiscount,
            ]);

            // Update the sales order with all values including calculated totals
            $salesOrder->update([
                ...$validated,
                'subtotal' => $subtotal,
                'tax_amount' => $tax_amount,
                'total_amount' => $total_amount,
            ]);

            // Debug: Log values after update
            $salesOrder->refresh();
            \Log::info('Sales Order Update Debug STEP 3:', [
                'discount_amount_after' => $salesOrder->discount_amount,
                'total_amount_after' => $salesOrder->total_amount,
                'shipping_cost_after' => $salesOrder->shipping_cost,
                'subtotal_after' => $salesOrder->subtotal,
                'tax_amount_after' => $salesOrder->tax_amount,
            ]);

            DB::commit();

            // Logo'ya otomatik senkronizasyon (config'den kontrol edilebilir)
            $logoSyncResult = null;
            if (config('services.logo.auto_sync_orders', false)) {
                try {
                    $firmNo = (int) config('services.logo.firm_no', 12);
                    \Log::info('Logo sync starting for updated order', ['firm_no' => $firmNo, 'order_id' => $salesOrder->id]);
                    $logoSyncResult = $salesOrder->syncToLogo($firmNo);
                    if (!$logoSyncResult['success']) {
                        \Log::warning('Logo sync failed for updated order', [
                            'order_id' => $salesOrder->id,
                            'error' => $logoSyncResult['error'] ?? 'Unknown error'
                        ]);
                    }
                } catch (\Exception $logoException) {
                    \Log::error('Logo sync exception for updated order', [
                        'order_id' => $salesOrder->id,
                        'error' => $logoException->getMessage()
                    ]);
                }
            }

            $message = 'Satış siparişi başarıyla güncellendi.';
            if ($logoSyncResult && $logoSyncResult['success']) {
                $message .= ' Logo\'ya aktarıldı.';
            }

            return redirect()
                ->route('sales.orders.show', $salesOrder)
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->withInput()
                ->with('error', 'Satış siparişi güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Manuel olarak siparişi Logo'ya senkronize et
     */
    public function syncToLogo(SalesOrder $salesOrder): RedirectResponse
    {
        Gate::authorize('update', $salesOrder);

        try {
            // Sync oncesi siparis toplamlarini yeniden hesapla
            $salesOrder->calculateTotals();

            $firmNo = (int) config('services.logo.firm_no', 12);
            \Log::info('Manual Logo sync starting', [
                'firm_no' => $firmNo,
                'order_id' => $salesOrder->id,
                'subtotal' => $salesOrder->subtotal,
                'tax_amount' => $salesOrder->tax_amount,
                'total_amount' => $salesOrder->total_amount,
            ]);
            $result = $salesOrder->syncToLogo($firmNo);

            if ($result['success']) {
                return back()->with('success', 'Sipariş Logo\'ya başarıyla aktarıldı. Logo ID: ' . $result['logo_id']);
            } else {
                return back()->with('error', 'Logo\'ya aktarım başarısız: ' . ($result['error'] ?? 'Bilinmeyen hata'));
            }
        } catch (\Exception $e) {
            \Log::error('Manual Logo sync failed', [
                'order_id' => $salesOrder->id,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Logo\'ya aktarım sırasında hata: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified sales order
     */
    public function destroy(SalesOrder $salesOrder): RedirectResponse
    {
        Gate::authorize('delete', $salesOrder);

        if (!$salesOrder->canBeCancelled()) {
            return back()->with('error', 'Bu sipariş silinemez durumda.');
        }

        try {
            $salesOrder->delete();

            return redirect()
                ->route('sales.orders.index')
                ->with('success', 'Satış siparişi başarıyla silindi.');

        } catch (\Exception $e) {
            return back()->with('error', 'Satış siparişi silinirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Update sales order status
     */
    public function updateStatus(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        Gate::authorize('updateStatus', $salesOrder);

        $validated = $request->validate([
            'status' => 'required|in:' . implode(',', array_keys(SalesOrder::getStatuses())),
            'notes' => 'nullable|string|max:1000',
            'reason' => 'nullable|string|max:1000',
        ]);

        if ($salesOrder->updateStatus($validated['status'], $validated['notes'] ?? null, $validated['reason'] ?? null)) {
            return back()->with('success', 'Sipariş durumu başarıyla güncellendi.');
        }

        return back()->with('error', 'Sipariş durumu güncellenemedi.');
    }

    /**
     * Approve a draft sales order (change status from draft to confirmed)
     */
    public function approve(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        // Check permission
        if (!auth()->user()->can('sales.orders.approve')) {
            return back()->with('error', 'Sipariş onaylama yetkiniz bulunmamaktadır.');
        }

        // Only draft orders can be approved
        if ($salesOrder->status !== SalesOrder::STATUS_DRAFT) {
            return back()->with('error', 'Sadece taslak durumundaki siparişler onaylanabilir.');
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            if ($salesOrder->updateStatus(SalesOrder::STATUS_CONFIRMED, $validated['notes'] ?? 'Sipariş onaylandı.')) {
                // Onaylanan siparişi otomatik olarak Logo'ya aktar
                try {
                    $salesOrder->calculateTotals();
                    $firmNo = (int) config('services.logo.firm_no', 12);
                    $logoResult = $salesOrder->syncToLogo($firmNo);

                    if ($logoResult['success']) {
                        return back()->with('success', 'Sipariş onaylandı ve Logo\'ya aktarıldı. Logo ID: ' . $logoResult['logo_id']);
                    } else {
                        \Log::warning('Auto Logo sync failed on approve', [
                            'order_id' => $salesOrder->id,
                            'error' => $logoResult['error'] ?? 'Unknown error'
                        ]);
                        return back()->with('warning', 'Sipariş onaylandı ancak Logo\'ya aktarım başarısız: ' . ($logoResult['error'] ?? 'Bilinmeyen hata'));
                    }
                } catch (\Exception $logoException) {
                    \Log::error('Auto Logo sync exception on approve', [
                        'order_id' => $salesOrder->id,
                        'error' => $logoException->getMessage()
                    ]);
                    return back()->with('warning', 'Sipariş onaylandı ancak Logo\'ya aktarım sırasında hata: ' . $logoException->getMessage());
                }
            }

            return back()->with('error', 'Sipariş onaylanamadı.');
        } catch (\Exception $e) {
            return back()->with('error', 'Sipariş onaylanırken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Get frequently used products for quick access
     */
    public function getFrequentProducts(Request $request, SalesAnalyticsService $analyticsService)
    {
        $customerId = $request->get('customer_id');
        $limit = $request->get('limit', 8);

        // Get top products from last 3 months
        $filters = [
            'date_from' => now()->subMonths(3),
            'date_to' => now(),
            'limit' => $limit
        ];

        // If customer is specified, get their frequent products
        if ($customerId) {
            $filters['customer_id'] = $customerId;
        }

        $topProducts = $analyticsService->getTopProducts($filters);

        // Convert to Product format and add pricing
        $products = collect($topProducts)->map(function ($productData) use ($customerId, $request) {
            $product = Product::with(['category', 'brand', 'supplier', 'baseUnit', 'tax'])
                ->find($productData['id']);

            if (!$product) {
                return null;
            }

            // Add analytics data
            $product->usage_frequency = $productData['order_count'];
            $product->total_quantity_sold = $productData['total_quantity'];
            $product->is_frequent = true;

            return $product;
        })->filter()->values();

        return response()->json($products);
    }

    /**
     * Get products for AJAX search with pricing
     */
    public function searchProducts(Request $request, PricingService $pricingService, ProductSearchService $searchService)
    {
        $search = $request->get('q', '');
        $customerId = $request->get('customer_id');
        $quantity = $request->get('quantity', 1);
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 20);

        if (strlen($search) < 2) {
            return response()->json(['data' => [], 'next_page_url' => null]);
        }

        $columns = ['id', 'code', 'name', 'sale_price', 'sale_price_try', 'currency', 'tax_rate', 'stock_quantity', 'unit_id', 'category_id', 'brand_id', 'tax_id',
                     'logo_sale_price', 'logo_purchase_price', 'logo_currency', 'logo_price_synced_at'];

        $paginated = $searchService->search(
            query: $search,
            page: (int) $page,
            perPage: (int) $perPage,
            canBeSoldOnly: true,
            columns: $columns,
            with: ['category', 'brand', 'supplier', 'baseUnit', 'tax', 'primaryImage', 'activeUnits.unit']
        );

        // Get customer for pricing
        $customer = null;
        if ($customerId) {
            $customer = CurrentAccount::find($customerId);
        }

        // Enhance products with pricing information
        foreach ($paginated->items() as $product) {
            $pricing = $pricingService->getBestPrice($product, $quantity, $customer);

            $product->best_price = $pricing['price'];
            $product->original_price = $pricing['original_price'];
            $product->has_special_pricing = $pricing['source'] === 'price_list';
            $product->discount_percentage = $pricing['discount_percentage'];
            $product->price_list_name = $pricing['price_list']->name ?? null;

            $product->logo_price = $product->logo_sale_price;
            $product->has_logo_price = $product->logo_sale_price !== null;

            $product->sale_price = $pricing['price'];
        }

        return response()->json($paginated);
    }

    /**
     * Product catalog - browse all products with sorting and pagination
     */
    public function productCatalog(Request $request, PricingService $pricingService)
    {
        $search = $request->get('q', '');
        $customerId = $request->get('customer_id');
        $quantity = $request->get('quantity', 1);
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 50);
        $sortField = $request->get('sort', 'code');
        $sortDir = $request->get('sort_dir', 'asc');

        $allowedSorts = ['code', 'name', 'sale_price', 'stock_quantity'];
        if (!in_array($sortField, $allowedSorts)) {
            $sortField = 'code';
        }
        $sortDir = $sortDir === 'desc' ? 'desc' : 'asc';

        $query = Product::query()
            ->where('is_active', true)
            ->where('can_be_sold', true)
            ->with(['category', 'brand', 'baseUnit', 'activeUnits.unit']);

        if (strlen($search) >= 1) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%")
                  ->orWhere('logo_producer_code', 'like', "%{$search}%");
            });
        }

        $paginated = $query->orderBy($sortField, $sortDir)
            ->paginate($perPage, ['*'], 'page', $page);

        // Enhance with pricing if customer specified
        $customer = $customerId ? CurrentAccount::find($customerId) : null;

        foreach ($paginated->items() as $product) {
            if ($customer) {
                $pricing = $pricingService->getBestPrice($product, $quantity, $customer);
                $product->sale_price = $pricing['price'];
                $product->has_special_pricing = $pricing['source'] === 'price_list';
            }

            $product->logo_price = $product->logo_sale_price;
            $product->has_logo_price = $product->logo_sale_price !== null;
        }

        return response()->json($paginated);
    }

    /**
     * Bulk search products by codes
     */
    public function bulkSearchProducts(Request $request, PricingService $pricingService)
    {
        $validated = $request->validate([
            'product_codes' => 'required|array',
            'product_codes.*' => 'string',
            'customer_id' => 'nullable|integer|exists:current_accounts,id'
        ]);

        $productCodes = collect($validated['product_codes'])->map(function ($code) {
            return strtoupper(trim($code));
        })->filter()->unique()->toArray();

        if (empty($productCodes)) {
            return response()->json([]);
        }

        $products = Product::where('is_active', true)
            ->where('can_be_sold', true)
            ->whereIn('code', $productCodes)
            ->with(['category', 'brand', 'supplier', 'baseUnit', 'tax', 'primaryImage', 'activeUnits.unit'])
            ->get(['id', 'code', 'name', 'sale_price', 'sale_price_try', 'currency', 'tax_rate', 'stock_quantity', 'unit_id', 'category_id', 'brand_id', 'tax_id',
                   'logo_sale_price', 'logo_purchase_price', 'logo_currency', 'logo_price_synced_at']);

        // Get customer for pricing
        $customer = null;
        if ($validated['customer_id']) {
            $customer = CurrentAccount::find($validated['customer_id']);
        }

        // Enhance products with pricing information
        foreach ($products as $product) {
            $quantity = 1; // Default quantity for bulk search
            $pricing = $pricingService->getBestPrice($product, $quantity, $customer);

            // Add pricing info to product
            $product->best_price = $pricing['price'];
            $product->original_price = $pricing['original_price'];
            $product->has_special_pricing = $pricing['source'] === 'price_list';
            $product->discount_percentage = $pricing['discount_percentage'];
            $product->price_list_name = $pricing['price_list']->name ?? null;

            // Logo fiyat bilgileri
            $product->logo_price = $product->logo_sale_price;
            $product->has_logo_price = $product->logo_sale_price !== null;

            // Override sale_price with best price for consistency
            $product->sale_price = $pricing['price'];

            // Add primary image URL for display
            if ($product->primaryImage) {
                $product->primary_image_url = $product->primaryImage->url ?? null;
            }

            // Ensure code is uppercase for consistent matching
            $product->code = strtoupper($product->code);
        }

        return response()->json($products);
    }

    /**
     * Get customer delivery addresses
     */
    public function getCustomerDeliveryAddresses(Request $request)
    {
        $customerId = $request->get('customer_id');
        
        if (!$customerId) {
            return response()->json([]);
        }

        $addresses = CurrentAccountDeliveryAddress::where('current_account_id', $customerId)
            ->where('is_active', true)
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();

        return response()->json($addresses);
    }

    /**
     * Store a new delivery address
     */
    public function storeDeliveryAddress(Request $request)
    {
        $validated = $request->validate([
            'current_account_id' => 'required|exists:current_accounts,id',
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'address' => 'required|string|max:500',
            'city_id' => 'nullable|exists:cities,id',
            'district_id' => 'nullable|exists:districts,id',
            'country_id' => 'nullable|exists:countries,id',
            'postal_code' => 'nullable|string|max:20',
            'type' => 'nullable|string|max:50',
            'delivery_notes' => 'nullable|string|max:500',
            'delivery_hours' => 'nullable|string|max:255',
            'is_default' => 'boolean',
            'is_active' => 'boolean'
        ]);

        // If this is being set as default, remove default from others
        if ($validated['is_default'] ?? false) {
            CurrentAccountDeliveryAddress::where('current_account_id', $validated['current_account_id'])
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $address = CurrentAccountDeliveryAddress::create($validated);

        return response()->json($address, 201);
    }

    /**
     * Generate PDF for sales order (download)
     */
    public function downloadPdf(SalesOrder $salesOrder, PdfService $pdfService)
    {
        Gate::authorize('view', $salesOrder);

        try {
            return $pdfService->downloadSalesOrderPdf($salesOrder);
        } catch (\Exception $e) {
            return back()->with('error', 'PDF oluşturulurken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Generate PDF for sales order (view in browser)
     */
    public function viewPdf(SalesOrder $salesOrder, PdfService $pdfService)
    {
        Gate::authorize('view', $salesOrder);

        try {
            return $pdfService->streamSalesOrderPdf($salesOrder);
        } catch (\Exception $e) {
            return back()->with('error', 'PDF oluşturulurken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Generate PDF for sales order with custom options
     */
    public function generateCustomPdf(Request $request, SalesOrder $salesOrder, PdfService $pdfService)
    {
        Gate::authorize('view', $salesOrder);

        $validated = $request->validate([
            'format' => 'sometimes|in:download,view,email',
            'preset' => 'sometimes|in:default,email,archive,thermal',
            'options' => 'sometimes|array'
        ]);

        try {
            $preset = $validated['preset'] ?? 'default';
            $options = $pdfService->getPresetOptions($preset);

            if (isset($validated['options'])) {
                $options = array_merge($options, $validated['options']);
            }

            $format = $validated['format'] ?? 'download';

            switch ($format) {
                case 'view':
                    return $pdfService->streamSalesOrderPdf($salesOrder, $options);
                case 'email':
                    // For now, just download - email functionality can be added later
                    return $pdfService->downloadSalesOrderPdf($salesOrder, $options);
                default:
                    return $pdfService->downloadSalesOrderPdf($salesOrder, $options);
            }
        } catch (\Exception $e) {
            return back()->with('error', 'PDF oluşturulurken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Download Excel (XLSX) for a sales order
     */
    public function downloadExcel(SalesOrder $salesOrder, SalesOrderExportService $exportService)
    {
        Gate::authorize('view', $salesOrder);

        try {
            return $exportService->download($salesOrder);
        } catch (\Exception $e) {
            return back()->with('error', 'Excel oluşturulurken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Batch generate PDFs for multiple sales orders
     */
    public function batchGeneratePdfs(Request $request, PdfService $pdfService)
    {
        $validated = $request->validate([
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'exists:sales_orders,id'
        ]);

        try {
            // Check authorization for each order
            foreach ($validated['order_ids'] as $orderId) {
                $salesOrder = SalesOrder::find($orderId);
                Gate::authorize('view', $salesOrder);
            }

            $results = $pdfService->batchGenerateSalesOrderPdfs($validated['order_ids']);

            $successCount = collect($results)->where('success', true)->count();
            $totalCount = count($results);

            if ($successCount === $totalCount) {
                return response()->json([
                    'success' => true,
                    'message' => "{$successCount} adet PDF başarıyla oluşturuldu.",
                    'results' => $results
                ]);
            } else {
                $failureCount = $totalCount - $successCount;
                return response()->json([
                    'success' => false,
                    'message' => "{$successCount} başarılı, {$failureCount} başarısız PDF oluşturma.",
                    'results' => $results
                ], 207); // Multi-Status
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Toplu PDF oluşturma işlemi başarısız: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Record bulk discount application
     */
    public function recordBulkDiscount(Request $request, SalesOrder $salesOrder, BulkDiscountHistoryService $service)
    {
        Gate::authorize('update', $salesOrder);

        $validated = $request->validate([
            'discount_type' => 'required|in:category,brand,supplier',
            'discount_target' => 'required|string',
            'discount_target_name' => 'required|string',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'affected_items' => 'required|array|min:1',
            'total_discount_amount' => 'required|numeric|min:0',
            'discount_rules' => 'nullable|array',
            'notes' => 'nullable|string'
        ]);

        try {
            $history = $service->recordBulkDiscount(
                $salesOrder,
                $validated['discount_type'],
                $validated['discount_target'],
                $validated['discount_target_name'],
                $validated['discount_percentage'],
                $validated['affected_items'],
                $validated['total_discount_amount'],
                $validated['discount_rules'] ?? null,
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Toplu indirim geçmişi kaydedildi.',
                'history' => $history
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Toplu indirim geçmişi kaydedilemedi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get bulk discount history for a sales order
     */
    public function getBulkDiscountHistory(SalesOrder $salesOrder, BulkDiscountHistoryService $service)
    {
        Gate::authorize('view', $salesOrder);

        try {
            $historyData = $service->getDiscountHistory($salesOrder);
            $summaryData = $service->getDiscountSummary($salesOrder);

            return response()->json([
                'success' => true,
                'history' => $historyData,
                'summary' => $summaryData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Toplu indirim geçmişi alınamadı: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send sales order via email
     */
    public function sendEmail(Request $request, SalesOrder $salesOrder, PdfService $pdfService)
    {
        Gate::authorize('view', $salesOrder);

        $validated = $request->validate([
            'email' => 'required|email',
            'cc' => 'nullable|string', // Comma separated emails
            'message' => 'nullable|string|max:2000',
            'attach_pdf' => 'boolean',
        ]);

        try {
            // Load relationships for email template
            $salesOrder->load(['customer', 'items.product', 'salesperson']);

            // Generate PDF if requested
            $pdfContent = null;
            if ($validated['attach_pdf'] ?? true) {
                $pdfContent = $pdfService->generateSalesOrderPdfContent($salesOrder);
            }

            // Parse CC emails
            $ccEmails = [];
            if (!empty($validated['cc'])) {
                $ccEmails = array_filter(array_map('trim', explode(',', $validated['cc'])));
                // Validate each CC email
                foreach ($ccEmails as $ccEmail) {
                    if (!filter_var($ccEmail, FILTER_VALIDATE_EMAIL)) {
                        return response()->json([
                            'success' => false,
                            'message' => "Geçersiz CC email adresi: {$ccEmail}"
                        ], 422);
                    }
                }
            }

            // Send email
            $mail = new \App\Mail\SalesOrderMail(
                $salesOrder,
                $validated['message'] ?? null,
                $pdfContent
            );

            $mailer = \Illuminate\Support\Facades\Mail::to($validated['email']);

            if (!empty($ccEmails)) {
                $mailer->cc($ccEmails);
            }

            $mailer->send($mail);

            // Log email sent
            \Log::info('Sales order email sent', [
                'order_id' => $salesOrder->id,
                'order_number' => $salesOrder->order_number,
                'email' => $validated['email'],
                'cc' => $ccEmails,
                'has_pdf' => (bool)$pdfContent,
                'sent_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Email başarıyla gönderildi.'
            ]);
        } catch (\Exception $e) {
            \Log::error('Sales order email sending failed', [
                'order_id' => $salesOrder->id,
                'email' => $validated['email'] ?? null,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Email gönderilemedi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer email for pre-filling
     */
    public function getCustomerEmail(SalesOrder $salesOrder)
    {
        Gate::authorize('view', $salesOrder);

        $customerEmail = $salesOrder->customer?->email;

        return response()->json([
            'email' => $customerEmail,
            'customer_name' => $salesOrder->customer?->title ?? $salesOrder->customer?->name,
        ]);
    }

    /**
     * Search products for autocomplete filter
     * Returns products matching search query (simplified for filter)
     */
    public function searchProductsForFilter(Request $request)
    {
        $query = $request->get('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $products = Product::where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('code', 'like', "%{$query}%")
                  ->orWhere('barcode', 'like', "%{$query}%");
            })
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'code', 'name']);

        return response()->json($products);
    }

    /**
     * Search customers for autocomplete filter
     * Returns customers matching search query
     */
    public function searchCustomers(Request $request)
    {
        $query = $request->get('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $customers = CurrentAccount::where('account_type', 'customer')
            ->where('is_active', true)
            ->turkishSearch(['title', 'account_code'], $query)
            ->orderBy('title')
            ->limit(20)
            ->get(['id', 'title', 'account_code', 'current_balance', 'currency']);

        return response()->json($customers);
    }

    /**
     * Get recent customers (customers with recent orders)
     * Returns customers who have placed orders recently, sorted by most recent order
     */
    public function recentCustomers(Request $request)
    {
        $limit = $request->get('limit', 15);

        // Get unique customer IDs from recent orders
        $recentCustomerIds = SalesOrder::select('customer_id')
            ->whereNotNull('customer_id')
            ->orderBy('created_at', 'desc')
            ->limit(100) // Look at last 100 orders
            ->pluck('customer_id')
            ->unique()
            ->take($limit)
            ->values();

        if ($recentCustomerIds->isEmpty()) {
            return response()->json([]);
        }

        // Fetch customer details while preserving order
        $customers = CurrentAccount::whereIn('id', $recentCustomerIds)
            ->where('is_active', true)
            ->get(['id', 'title', 'account_code', 'current_balance', 'currency'])
            ->sortBy(function ($customer) use ($recentCustomerIds) {
                return $recentCustomerIds->search($customer->id);
            })
            ->values();

        return response()->json($customers);
    }

    /**
     * Get order items for expandable row (AJAX)
     */
    public function getOrderItems(SalesOrder $salesOrder)
    {
        Gate::authorize('view', $salesOrder);

        $salesOrder->load(['items.product.baseUnit']);

        $items = $salesOrder->items->map(function ($item) {
            return [
                'id' => $item->id,
                'product_code' => $item->product?->code ?? '-',
                'product_name' => $item->product_name ?? $item->product?->name ?? '-',
                'quantity' => $item->quantity,
                'unit_name' => $item->unit_name ?? $item->product?->baseUnit?->name ?? 'Adet',
                'unit_price' => $item->unit_price,
                'discount_percentage' => $item->discount_percentage ?? 0,
                'tax_rate' => $item->tax_rate ?? 0,
                'line_total' => $item->line_total,
                'status' => $item->status ?? 'pending',
            ];
        });

        return response()->json([
            'success' => true,
            'items' => $items,
            'currency' => $salesOrder->currency,
        ]);
    }

    /**
     * Search sales representatives for AJAX search
     */
    public function searchSalesRepresentatives(Request $request)
    {
        $search = $request->get('q', '');

        $query = SalesRepresentative::where('is_active', true);

        if (strlen($search) >= 1) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('logo_code', 'like', "%{$search}%")
                  ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
            });
        }

        $representatives = $query->orderBy('first_name')
            ->orderBy('last_name')
            ->limit(50)
            ->get(['id', 'first_name', 'last_name', 'logo_code', 'department', 'title'])
            ->map(function ($rep) {
                return [
                    'id' => $rep->id,
                    'name' => $rep->full_name,
                    'logo_code' => $rep->logo_code,
                    'department' => $rep->department,
                    'title' => $rep->title,
                ];
            });

        return response()->json($representatives);
    }
}
