<?php

namespace App\Http\Controllers\Purchasing;

use App\Http\Controllers\Controller;
use App\Models\SupplierOffer;
use App\Models\CurrentAccount;
use App\Models\PurchaseRequest;
use App\Models\Location;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PurchasingOfferController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = SupplierOffer::with(['supplier', 'location', 'requestedBy'])
            ->orderBy('offer_date', 'desc');

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by supplier
        if ($request->has('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        // Filter by location
        if ($request->has('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('offer_number', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function($sq) use ($search) {
                      $sq->where('title', 'like', "%{$search}%");
                  });
            });
        }

        $offers = $query->paginate(15);

        // Get suppliers (type = supplier)
        $suppliers = CurrentAccount::where('account_type', 'supplier')
            ->where('is_active', true)
            ->orderBy('title')
            ->get(['id', 'title as account_name']);

        // Get locations
        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Purchasing/Offers/Index', [
            'offers' => $offers,
            'suppliers' => $suppliers,
            'locations' => $locations,
            'filters' => [
                'status' => $request->status ?? 'all',
                'supplier_id' => $request->supplier_id,
                'location_id' => $request->location_id,
                'search' => $request->search,
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        // Get suppliers
        $suppliers = CurrentAccount::where('account_type', 'supplier')
            ->where('is_active', true)
            ->orderBy('title')
            ->get(['id', 'title as account_name', 'contact_person', 'email']);

        // Get locations
        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get purchase request if provided
        $purchaseRequest = null;
        if ($request->has('purchase_request_id')) {
            $purchaseRequest = PurchaseRequest::with(['items.inventoryItem'])
                ->findOrFail($request->purchase_request_id);
        }

        // Get inventory items for selection
        $inventoryItems = InventoryItem::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'sku as item_code', 'name as item_name', 'base_unit as unit']);

        return Inertia::render('Purchasing/Offers/Create', [
            'suppliers' => $suppliers,
            'locations' => $locations,
            'purchaseRequest' => $purchaseRequest,
            'inventoryItems' => $inventoryItems,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:current_accounts,id',
            'purchase_request_id' => 'nullable|exists:purchase_requests,id',
            'location_id' => 'nullable|exists:locations,id',
            'offer_date' => 'required|date',
            'valid_until' => 'required|date|after_or_equal:offer_date',
            'currency' => 'required|string|max:3',
            'exchange_rate' => 'nullable|numeric|min:0',
            'terms_conditions' => 'nullable|string',
            'payment_terms' => 'nullable|string',
            'delivery_terms' => 'nullable|string',
            'notes' => 'nullable|string',
            'contact_person' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'nullable|exists:inventory_items,id',
            'items.*.purchase_request_item_id' => 'nullable|exists:purchase_request_items,id',
            'items.*.item_code' => 'nullable|string|max:255',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.unit' => 'required|string|max:50',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.manufacturer' => 'nullable|string|max:255',
            'items.*.brand' => 'nullable|string|max:255',
            'items.*.model' => 'nullable|string|max:255',
            'items.*.delivery_days' => 'nullable|integer|min:0',
            'items.*.technical_specs' => 'nullable|string',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Calculate totals
            $subtotal = 0;
            $taxTotal = 0;
            $discountTotal = 0;

            $items = [];
            foreach ($validated['items'] as $item) {
                $quantity = $item['quantity'];
                $unitPrice = $item['unit_price'];
                $discountPercentage = $item['discount_percentage'] ?? 0;
                $taxPercentage = $item['tax_percentage'] ?? 0;

                $lineSubtotal = $quantity * $unitPrice;
                $discountAmount = $lineSubtotal * ($discountPercentage / 100);
                $afterDiscount = $lineSubtotal - $discountAmount;
                $taxAmount = $afterDiscount * ($taxPercentage / 100);
                $lineTotal = $afterDiscount + $taxAmount;

                $subtotal += $lineSubtotal;
                $discountTotal += $discountAmount;
                $taxTotal += $taxAmount;

                $items[] = array_merge($item, [
                    'discount_amount' => round($discountAmount, 2),
                    'tax_amount' => round($taxAmount, 2),
                    'line_total' => round($lineTotal, 2),
                ]);
            }

            $totalAmount = $subtotal - $discountTotal + $taxTotal;

            // Create offer
            $offer = SupplierOffer::create([
                'supplier_id' => $validated['supplier_id'],
                'purchase_request_id' => $validated['purchase_request_id'] ?? null,
                'location_id' => $validated['location_id'] ?? null,
                'offer_date' => $validated['offer_date'],
                'valid_until' => $validated['valid_until'],
                'currency' => $validated['currency'],
                'exchange_rate' => $validated['exchange_rate'] ?? 1,
                'subtotal' => round($subtotal, 2),
                'tax_total' => round($taxTotal, 2),
                'discount_total' => round($discountTotal, 2),
                'total_amount' => round($totalAmount, 2),
                'terms_conditions' => $validated['terms_conditions'] ?? null,
                'payment_terms' => $validated['payment_terms'] ?? null,
                'delivery_terms' => $validated['delivery_terms'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'contact_person' => $validated['contact_person'] ?? null,
                'contact_email' => $validated['contact_email'] ?? null,
                'contact_phone' => $validated['contact_phone'] ?? null,
                'requested_by' => Auth::id(),
                'created_by' => Auth::id(),
                'status' => 'pending',
            ]);

            // Create offer items
            foreach ($items as $item) {
                $offer->items()->create($item);
            }

            DB::commit();

            return redirect()->route('purchasing.offers.show', $offer->id)
                ->with('success', 'Tedarikçi teklifi başarıyla oluşturuldu.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()
                ->withErrors(['error' => 'Teklif oluşturulurken bir hata oluştu: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $offer = SupplierOffer::with([
            'supplier',
            'location',
            'purchaseRequest',
            'items.inventoryItem',
            'items.purchaseRequestItem',
            'requestedBy',
            'approvedBy',
            'creator'
        ])->findOrFail($id);

        return Inertia::render('Purchasing/Offers/Show', [
            'offer' => $offer
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $offer = SupplierOffer::with(['items'])->findOrFail($id);

        // Only allow editing pending offers
        if ($offer->status !== 'pending') {
            return redirect()->route('purchasing.offers.show', $id)
                ->with('error', 'Sadece beklemedeki teklifler düzenlenebilir.');
        }

        // Get suppliers
        $suppliers = CurrentAccount::where('account_type', 'supplier')
            ->where('is_active', true)
            ->orderBy('title')
            ->get(['id', 'title as account_name', 'contact_person', 'email']);

        // Get locations
        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get inventory items
        $inventoryItems = InventoryItem::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'sku as item_code', 'name as item_name', 'base_unit as unit']);

        return Inertia::render('Purchasing/Offers/Edit', [
            'offer' => $offer,
            'suppliers' => $suppliers,
            'locations' => $locations,
            'inventoryItems' => $inventoryItems,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $offer = SupplierOffer::findOrFail($id);

        // Only allow updating pending offers
        if ($offer->status !== 'pending') {
            return back()->with('error', 'Sadece beklemedeki teklifler düzenlenebilir.');
        }

        $validated = $request->validate([
            'supplier_id' => 'required|exists:current_accounts,id',
            'location_id' => 'nullable|exists:locations,id',
            'offer_date' => 'required|date',
            'valid_until' => 'required|date|after_or_equal:offer_date',
            'currency' => 'required|string|max:3',
            'exchange_rate' => 'nullable|numeric|min:0',
            'terms_conditions' => 'nullable|string',
            'payment_terms' => 'nullable|string',
            'delivery_terms' => 'nullable|string',
            'notes' => 'nullable|string',
            'contact_person' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'nullable|exists:inventory_items,id',
            'items.*.purchase_request_item_id' => 'nullable|exists:purchase_request_items,id',
            'items.*.item_code' => 'nullable|string|max:255',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.unit' => 'required|string|max:50',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.manufacturer' => 'nullable|string|max:255',
            'items.*.brand' => 'nullable|string|max:255',
            'items.*.model' => 'nullable|string|max:255',
            'items.*.delivery_days' => 'nullable|integer|min:0',
            'items.*.technical_specs' => 'nullable|string',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Calculate totals
            $subtotal = 0;
            $taxTotal = 0;
            $discountTotal = 0;

            $items = [];
            foreach ($validated['items'] as $item) {
                $quantity = $item['quantity'];
                $unitPrice = $item['unit_price'];
                $discountPercentage = $item['discount_percentage'] ?? 0;
                $taxPercentage = $item['tax_percentage'] ?? 0;

                $lineSubtotal = $quantity * $unitPrice;
                $discountAmount = $lineSubtotal * ($discountPercentage / 100);
                $afterDiscount = $lineSubtotal - $discountAmount;
                $taxAmount = $afterDiscount * ($taxPercentage / 100);
                $lineTotal = $afterDiscount + $taxAmount;

                $subtotal += $lineSubtotal;
                $discountTotal += $discountAmount;
                $taxTotal += $taxAmount;

                $items[] = array_merge($item, [
                    'discount_amount' => round($discountAmount, 2),
                    'tax_amount' => round($taxAmount, 2),
                    'line_total' => round($lineTotal, 2),
                ]);
            }

            $totalAmount = $subtotal - $discountTotal + $taxTotal;

            // Update offer
            $offer->update([
                'supplier_id' => $validated['supplier_id'],
                'location_id' => $validated['location_id'] ?? null,
                'offer_date' => $validated['offer_date'],
                'valid_until' => $validated['valid_until'],
                'currency' => $validated['currency'],
                'exchange_rate' => $validated['exchange_rate'] ?? 1,
                'subtotal' => round($subtotal, 2),
                'tax_total' => round($taxTotal, 2),
                'discount_total' => round($discountTotal, 2),
                'total_amount' => round($totalAmount, 2),
                'terms_conditions' => $validated['terms_conditions'] ?? null,
                'payment_terms' => $validated['payment_terms'] ?? null,
                'delivery_terms' => $validated['delivery_terms'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'contact_person' => $validated['contact_person'] ?? null,
                'contact_email' => $validated['contact_email'] ?? null,
                'contact_phone' => $validated['contact_phone'] ?? null,
                'updated_by' => Auth::id(),
            ]);

            // Delete existing items and recreate
            $offer->items()->delete();
            foreach ($items as $item) {
                $offer->items()->create($item);
            }

            DB::commit();

            return redirect()->route('purchasing.offers.show', $offer->id)
                ->with('success', 'Tedarikçi teklifi başarıyla güncellendi.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()
                ->withErrors(['error' => 'Teklif güncellenirken bir hata oluştu: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $offer = SupplierOffer::findOrFail($id);

        // Only allow deleting pending offers
        if ($offer->status !== 'pending') {
            return back()->with('error', 'Sadece beklemedeki teklifler silinebilir.');
        }

        $offer->delete();

        return redirect()->route('purchasing.offers.index')
            ->with('success', 'Tedarikçi teklifi başarıyla silindi.');
    }

    /**
     * Approve the offer
     */
    public function approve(string $id)
    {
        $offer = SupplierOffer::findOrFail($id);

        if ($offer->status !== 'pending') {
            return back()->with('error', 'Sadece beklemedeki teklifler onaylanabilir.');
        }

        $offer->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Teklif başarıyla onaylandı.');
    }

    /**
     * Reject the offer
     */
    public function reject(Request $request, string $id)
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:500'
        ]);

        $offer = SupplierOffer::findOrFail($id);

        if ($offer->status !== 'pending') {
            return back()->with('error', 'Sadece beklemedeki teklifler reddedilebilir.');
        }

        $offer->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Teklif reddedildi.');
    }
}
