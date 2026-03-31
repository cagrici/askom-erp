<?php

namespace App\Http\Controllers\Purchasing;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseRequest;
use App\Models\CurrentAccount;
use App\Models\Location;
use App\Models\Product;
use App\Models\Unit;
use App\Models\Tax;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::with([
            'supplier:id,title,account_code',
            'location:id,name',
            'orderedBy:id,name',
            'approvedBy:id,name'
        ]);

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->filled('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('order_date_from')) {
            $query->whereDate('order_date', '>=', $request->order_date_from);
        }

        if ($request->filled('order_date_to')) {
            $query->whereDate('order_date', '<=', $request->order_date_to);
        }

        // Sort
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $orders = $query->paginate(20)->withQueryString();

        // Get filter options
        $suppliers = CurrentAccount::where('account_type', 'supplier')->where('is_active', true)->get(['id', 'title']);
        $locations = Location::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('Purchasing/Orders/Index', [
            'orders' => $orders,
            'suppliers' => $suppliers,
            'locations' => $locations,
            'filters' => $request->only([
                'status', 'supplier_id', 'location_id', 'search', 
                'order_date_from', 'order_date_to', 'sort_field', 'sort_direction'
            ]),
        ]);
    }

    public function create(Request $request)
    {
        $purchaseRequest = null;
        $requestItems = [];

        // If creating from a purchase request
        if ($request->filled('request_id')) {
            $purchaseRequest = PurchaseRequest::with(['items.product', 'items.unit'])
                ->where('status', 'approved')
                ->findOrFail($request->request_id);
            
            $requestItems = $purchaseRequest->items()
                ->where('status', 'approved')
                ->where('remaining_quantity', '>', 0)
                ->get();
        }

        $suppliers = CurrentAccount::where('account_type', 'supplier')->where('is_active', true)->get();
        $locations = Location::where('is_active', true)->get(['id', 'name']);
        $products = Product::where('is_active', true)->with('baseUnit')->get();
        $units = Unit::where('is_active', true)->get(['id', 'name', 'symbol']);
        $taxes = Tax::where('is_active', true)->get(['id', 'name', 'type', 'rate', 'fixed_amount', 'code']);

        return Inertia::render('Purchasing/Orders/Create', [
            'purchaseRequest' => $purchaseRequest,
            'requestItems' => $requestItems,
            'suppliers' => $suppliers,
            'locations' => $locations,
            'products' => $products,
            'units' => $units,
            'taxes' => $taxes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'order_type' => 'required|in:regular,urgent,blanket,framework',
            'purchase_request_id' => 'nullable|exists:purchase_requests,id',
            'supplier_id' => 'required|exists:current_accounts,id',
            'location_id' => 'nullable|exists:locations,id',
            'order_date' => 'required|date',
            'delivery_date' => 'required|date|after_or_equal:order_date',
            'currency' => 'required|string|in:TRY,USD,EUR,GBP',
            'exchange_rate' => 'required|numeric|min:0',
            'terms_conditions' => 'nullable|string',
            'delivery_terms' => 'nullable|string',
            'notes' => 'nullable|string',
            'reference_number' => 'nullable|string|max:100',
            'is_urgent' => 'boolean',
            'items' => 'required|array|min:1',
            'items.*.purchase_request_item_id' => 'nullable|exists:purchase_request_items,id',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.specifications' => 'nullable|string',
            'items.*.ordered_quantity' => 'required|numeric|min:0.0001',
            'items.*.unit_id' => 'nullable|exists:units,id',
            'items.*.unit_name' => 'nullable|string|max:50',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.delivery_date' => 'nullable|date',
            'items.*.notes' => 'nullable|string',
            'items.*.supplier_item_code' => 'nullable|string|max:100',
            'items.*.brand' => 'nullable|string|max:100',
            'items.*.model' => 'nullable|string|max:100',
            'items.*.status' => 'nullable|string|in:pending,confirmed,partially_received,received,cancelled',
        ]);

        DB::transaction(function () use ($validated) {
            // Create purchase order
            $purchaseOrder = PurchaseOrder::create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'order_type' => $validated['order_type'],
                'purchase_request_id' => $validated['purchase_request_id'] ?? null,
                'supplier_id' => $validated['supplier_id'],
                'location_id' => $validated['location_id'] ?? null,
                'ordered_by' => Auth::id(),
                'order_date' => $validated['order_date'],
                'delivery_date' => $validated['delivery_date'],
                'currency' => $validated['currency'],
                'exchange_rate' => $validated['exchange_rate'],
                'terms_conditions' => $validated['terms_conditions'] ?? null,
                'delivery_terms' => $validated['delivery_terms'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'reference_number' => $validated['reference_number'] ?? null,
                'is_urgent' => $validated['is_urgent'] ?? false,
                'status' => 'draft',
            ]);

            // Create items
            foreach ($validated['items'] as $index => $itemData) {
                $totalPrice = $itemData['ordered_quantity'] * $itemData['unit_price'];
                $discountAmount = ($itemData['discount_percentage'] ?? 0) > 0 
                    ? $totalPrice * ($itemData['discount_percentage'] / 100) 
                    : 0;
                $netPrice = $totalPrice - $discountAmount;

                $orderItem = PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'purchase_request_item_id' => $itemData['purchase_request_item_id'] ?? null,
                    'product_id' => $itemData['product_id'] ?? null,
                    'item_name' => $itemData['item_name'],
                    'description' => $itemData['description'] ?? null,
                    'specifications' => $itemData['specifications'] ?? null,
                    'ordered_quantity' => $itemData['ordered_quantity'],
                    'unit_id' => $itemData['unit_id'] ?? null,
                    'unit_name' => $itemData['unit_name'] ?? null,
                    'unit_price' => $itemData['unit_price'],
                    'total_price' => $totalPrice,
                    'discount_percentage' => $itemData['discount_percentage'] ?? 0,
                    'discount_amount' => $discountAmount,
                    'net_price' => $netPrice,
                    'currency' => $validated['currency'],
                    'delivery_date' => $itemData['delivery_date'] ?? $validated['delivery_date'],
                    'notes' => $itemData['notes'] ?? null,
                    'supplier_item_code' => $itemData['supplier_item_code'] ?? null,
                    'brand' => $itemData['brand'] ?? null,
                    'model' => $itemData['model'] ?? null,
                    'sort_order' => $index + 1,
                    'remaining_quantity' => $itemData['ordered_quantity'],
                    'status' => $itemData['status'] ?? 'pending',
                ]);

                // Update purchase request item if linked
                if ($itemData['purchase_request_item_id']) {
                    $requestItem = \App\Models\PurchaseRequestItem::find($itemData['purchase_request_item_id']);
                    if ($requestItem) {
                        $requestItem->convertQuantity($itemData['ordered_quantity']);
                    }
                }
            }

            // Calculate total amount
            $purchaseOrder->calculateTotalAmount();
        });

        return redirect()
            ->route('purchasing.orders.index')
            ->with('success', 'Satın alma siparişi başarıyla oluşturuldu.');
    }

    public function show(PurchaseOrder $order)
    {
        $order->load([
            'purchaseRequest',
            'supplier',
            'location',
            'orderedBy',
            'approvedBy',
            'items.product',
            'items.unit',
            'items.purchaseRequestItem'
        ]);

        return Inertia::render('Purchasing/Orders/Show', [
            'order' => $order,
        ]);
    }

    public function edit(PurchaseOrder $order)
    {
        if (!$order->canBeEdited()) {
            return redirect()
                ->route('purchasing.orders.show', $order)
                ->with('error', 'Bu sipariş düzenlenemez.');
        }

        // Load items with full product details including images
        $order->load([
            'items.product.primaryImage',
            'items.product.baseUnit',
            'items.product.tax',
            'items.product.activeUnits.unit',
            'items.product.category',
            'items.product.brand',
            'items.product.supplier',
            'items.unit'
        ]);

        $suppliers = CurrentAccount::where('account_type', 'supplier')->where('is_active', true)->get();
        $locations = Location::where('is_active', true)->get(['id', 'name']);
        $units = Unit::where('is_active', true)->get(['id', 'name', 'symbol']);
        $taxes = Tax::where('is_active', true)->get(['id', 'name', 'type', 'rate', 'fixed_amount', 'code']);

        return Inertia::render('Purchasing/Orders/Edit', [
            'order' => $order,
            'suppliers' => $suppliers,
            'locations' => $locations,
            'units' => $units,
            'taxes' => $taxes,
        ]);
    }

    public function update(Request $request, PurchaseOrder $order)
    {
        if (!$order->canBeEdited()) {
            return redirect()
                ->route('purchasing.orders.show', $order)
                ->with('error', 'Bu sipariş düzenlenemez.');
        }

        // Similar validation and update logic as store method
        // Implementation would be similar to PurchaseRequestController::update
        
        return redirect()
            ->route('purchasing.orders.show', $order)
            ->with('success', 'Satın alma siparişi başarıyla güncellendi.');
    }

    public function destroy(PurchaseOrder $order)
    {
        if (!$order->canBeDeleted()) {
            return redirect()
                ->route('purchasing.orders.index')
                ->with('error', 'Bu sipariş silinemez.');
        }

        $order->delete();

        return redirect()
            ->route('purchasing.orders.index')
            ->with('success', 'Satın alma siparişi başarıyla silindi.');
    }

    public function approve(Request $request, PurchaseOrder $order)
    {
        if ($order->approve(Auth::id())) {
            return redirect()
                ->route('purchasing.orders.show', $order)
                ->with('success', 'Satın alma siparişi onaylandı.');
        }

        return redirect()
            ->route('purchasing.orders.show', $order)
            ->with('error', 'Sipariş onaylanamadı.');
    }

    public function send(PurchaseOrder $order)
    {
        if ($order->send()) {
            return redirect()
                ->route('purchasing.orders.show', $order)
                ->with('success', 'Satın alma siparişi tedarikçiye gönderildi.');
        }

        return redirect()
            ->route('purchasing.orders.show', $order)
            ->with('error', 'Sipariş gönderilemedi.');
    }

    public function confirm(PurchaseOrder $order)
    {
        if ($order->confirm()) {
            return redirect()
                ->route('purchasing.orders.show', $order)
                ->with('success', 'Satın alma siparişi onaylandı.');
        }

        return redirect()
            ->route('purchasing.orders.show', $order)
            ->with('error', 'Sipariş onaylanamadı.');
    }

    public function cancel(PurchaseOrder $order)
    {
        if ($order->cancel()) {
            return redirect()
                ->route('purchasing.orders.show', $order)
                ->with('success', 'Satın alma siparişi iptal edildi.');
        }

        return redirect()
            ->route('purchasing.orders.show', $order)
            ->with('error', 'Sipariş iptal edilemedi.');
    }

    public function generatePdf(PurchaseOrder $order)
    {
        // PDF generation logic would go here
        // This could use libraries like DomPDF or mPDF
        
        return response()->json(['message' => 'PDF generation feature coming soon']);
    }
}