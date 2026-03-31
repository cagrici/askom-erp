<?php

namespace App\Http\Controllers\Purchasing;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\Location;
use App\Models\Department;
use App\Models\Product;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseRequest::with([
            'location:id,name',
            'department:id,name', 
            'requestedBy:id,name',
            'approvedBy:id,name'
        ]);

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('request_number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('requested_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('requested_date', '<=', $request->date_to);
        }

        // Sort
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $requests = $query->paginate(20)->withQueryString();

        // Get filter options
        $locations = Location::where('is_active', true)->get(['id', 'name']);
        $departments = Department::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('Purchasing/Requests/Index', [
            'requests' => $requests,
            'locations' => $locations,
            'departments' => $departments,
            'filters' => $request->only([
                'status', 'location_id', 'department_id', 'priority', 
                'search', 'date_from', 'date_to', 'sort_field', 'sort_direction'
            ]),
        ]);
    }

    public function create()
    {
        $locations = Location::where('is_active', true)->get(['id', 'name']);
        $departments = Department::where('is_active', true)->get(['id', 'name']);
        // Remove products - will be loaded via AJAX
        $units = Unit::where('is_active', true)->get(['id', 'name', 'symbol']);

        return Inertia::render('Purchasing/Requests/Create', [
            'locations' => $locations,
            'departments' => $departments,
            'units' => $units,
        ]);
    }

    /**
     * Search products via AJAX
     */
    public function searchProducts(Request $request)
    {
        try {
            $query = $request->get('q', '');
            $limit = $request->get('limit', 20);

            // Simple test first
            if (empty($query)) {
                return response()->json([
                    'products' => [],
                    'total' => 0,
                    'message' => 'No search query provided'
                ]);
            }

            $products = Product::with(['tax:id,name,type,rate,fixed_amount,code', 'primaryImage', 'baseUnit:id,name,symbol', 'activeUnits.unit:id,name,symbol'])
                ->where('is_active', true)
                ->where('can_be_purchased', true)  // Sadece satın alınabilir ürünler
                ->where(function($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                      ->orWhere('code', 'like', "%{$query}%")
                      ->orWhere('sku', 'like', "%{$query}%");
                })
                ->select('id', 'code', 'name', 'sku', 'sale_price', 'currency', 'tax_id', 'unit_id')
                ->orderBy('name')
                ->limit($limit)
                ->get();

            return response()->json([
                'products' => $products,
                'total' => $products->count(),
                'query' => $query
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Search failed: ' . $e->getMessage(),
                'products' => [],
                'total' => 0
            ], 500);
        }
    }

    public function store(Request $request)
    {
        // Log incoming request for debugging
        \Log::info('Purchase Request Store - Incoming Data', [
            'data' => $request->all(),
            'headers' => $request->headers->all()
        ]);

        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'priority' => 'required|in:low,medium,high,urgent',
                'location_id' => 'nullable|exists:locations,id',
                'department_id' => 'nullable|exists:departments,id',
                'required_date' => 'required|date|after_or_equal:today',
                'currency' => 'required|string|in:TRY,USD,EUR,GBP',
                'budget_code' => 'nullable|string|max:50',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'nullable|exists:products,id',
                'items.*.description' => 'required|string|max:255',
                'items.*.specification' => 'nullable|string',
                'items.*.quantity' => 'required|numeric|min:0.0001',
                'items.*.unit' => 'required|string|max:50',
                'items.*.unit_price' => 'nullable|numeric|min:0',
                'items.*.notes' => 'nullable|string',
            ]);

            \Log::info('Purchase Request Store - Validation Passed', [
                'validated' => $validated
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Log validation errors for debugging
            \Log::error('Purchase Request Validation Failed', [
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);
            
            // Return back with detailed error messages for frontend
            return back()
                ->withInput()
                ->withErrors($e->errors())
                ->with('error', 'Doğrulama hatası: ' . implode(', ', array_keys($e->errors())));
        }

        try {
            DB::transaction(function () use ($validated) {
                // Handle empty strings - convert to null
                $locationId = !empty($validated['location_id']) ? $validated['location_id'] : null;
                $departmentId = !empty($validated['department_id']) ? $validated['department_id'] : null;
                
                // Create purchase request with defaults
                $purchaseRequest = PurchaseRequest::create([
                    'title' => $validated['title'],
                    'description' => $validated['description'] ?? null,
                    'priority' => $validated['priority'],
                    'request_type' => 'regular', // Default
                    'location_id' => $locationId,
                    'department_id' => $departmentId,
                    'requested_by' => Auth::id(),
                    'requested_date' => now()->toDateString(), // Default to today
                    'required_date' => $validated['required_date'],
                    'currency' => $validated['currency'],
                    'exchange_rate' => 1.0, // Default
                    'budget_code' => $validated['budget_code'] ?? null,
                    'is_urgent' => $validated['priority'] === 'urgent',
                    'requires_approval' => true, // Default
                    'status' => 'pending', // Default
            ]);

                // Create items
                foreach ($validated['items'] as $index => $itemData) {
                    $quantity = $itemData['quantity'];
                    $unitPrice = $itemData['unit_price'] ?? 0;
                    $estimatedTotal = $quantity * $unitPrice;
                    
                    // Handle empty product_id - convert to null
                    $productId = !empty($itemData['product_id']) ? $itemData['product_id'] : null;

                    PurchaseRequestItem::create([
                        'purchase_request_id' => $purchaseRequest->id,
                        'product_id' => $productId,
                        'item_name' => $itemData['description'], // Using description as item_name
                        'description' => $itemData['description'],
                        'specifications' => $itemData['specification'] ?? null, // Frontend sends 'specification', DB expects 'specifications'
                        'requested_quantity' => $quantity,
                        'unit_id' => null, // Will add unit lookup later
                        'unit_name' => $itemData['unit'],
                        'estimated_unit_price' => $unitPrice,
                        'estimated_total_price' => $estimatedTotal,
                        'currency' => $validated['currency'],
                        'required_date' => $validated['required_date'],
                        'notes' => $itemData['notes'] ?? null,
                        'budget_code' => $validated['budget_code'],
                        'sort_order' => $index + 1,
                        'remaining_quantity' => $quantity,
                    ]);
                }

                // Calculate total amount
                $purchaseRequest->calculateTotalAmount();
            });

            \Log::info('Purchase Request Store - Success', [
                'message' => 'Purchase request created successfully'
            ]);

            return redirect()
                ->route('purchasing.requests.index')
                ->with('success', 'Satın alma talebi başarıyla oluşturuldu.');
                
        } catch (\Exception $e) {
            \Log::error('Purchase Request Creation Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'input' => $request->all()
            ]);
            
            return back()
                ->withInput()
                ->withErrors(['error' => 'Satın alma talebi oluşturulurken bir hata oluştu: ' . $e->getMessage()]);
        }
    }

    public function show(PurchaseRequest $purchaseRequest)
    {
        $purchaseRequest->load([
            'location',
            'department',
            'requestedBy',
            'approvedBy',
            'items.product',
            'items.unit',
            'purchaseOrders.supplier'
        ]);

        return Inertia::render('Purchasing/Requests/Show', [
            'request' => $purchaseRequest,
        ]);
    }

    public function edit(PurchaseRequest $purchaseRequest)
    {
        if (!$purchaseRequest->canBeEdited()) {
            return redirect()
                ->route('purchasing.requests.show', $purchaseRequest)
                ->with('error', 'Bu talep düzenlenemez.');
        }

        $purchaseRequest->load(['items.product', 'items.unit']);
        
        $locations = Location::where('is_active', true)->get(['id', 'name']);
        $departments = Department::where('is_active', true)->get(['id', 'name']);
        $products = Product::where('is_active', true)->with('baseUnit')->get();
        $units = Unit::where('is_active', true)->get(['id', 'name', 'symbol']);

        return Inertia::render('Purchasing/Requests/Edit', [
            'request' => $purchaseRequest,
            'locations' => $locations,
            'departments' => $departments,
            'products' => $products,
            'units' => $units,
        ]);
    }

    public function update(Request $request, PurchaseRequest $purchaseRequest)
    {
        if (!$purchaseRequest->canBeEdited()) {
            return redirect()
                ->route('purchasing.requests.show', $purchaseRequest)
                ->with('error', 'Bu talep düzenlenemez.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high,urgent',
            'request_type' => 'required|in:regular,urgent,maintenance,project',
            'location_id' => 'nullable|exists:locations,id',
            'department_id' => 'nullable|exists:departments,id',
            'requested_date' => 'required|date',
            'required_date' => 'required|date|after_or_equal:requested_date',
            'currency' => 'required|string|in:TRY,USD,EUR,GBP',
            'exchange_rate' => 'required|numeric|min:0',
            'budget_code' => 'nullable|string|max:50',
            'is_urgent' => 'boolean',
            'requires_approval' => 'boolean',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:purchase_request_items,id',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.specifications' => 'nullable|string',
            'items.*.requested_quantity' => 'required|numeric|min:0.0001',
            'items.*.unit_id' => 'nullable|exists:units,id',
            'items.*.unit_name' => 'nullable|string|max:50',
            'items.*.estimated_unit_price' => 'nullable|numeric|min:0',
            'items.*.required_date' => 'nullable|date',
            'items.*.notes' => 'nullable|string',
            'items.*.budget_code' => 'nullable|string|max:50',
        ]);

        DB::transaction(function () use ($validated, $purchaseRequest) {
            // Update purchase request
            $purchaseRequest->update([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'priority' => $validated['priority'],
                'request_type' => $validated['request_type'],
                'location_id' => $validated['location_id'] ?? null,
                'department_id' => $validated['department_id'] ?? null,
                'requested_date' => $validated['requested_date'],
                'required_date' => $validated['required_date'],
                'currency' => $validated['currency'],
                'exchange_rate' => $validated['exchange_rate'],
                'budget_code' => $validated['budget_code'] ?? null,
                'is_urgent' => $validated['is_urgent'] ?? false,
                'requires_approval' => $validated['requires_approval'] ?? true,
            ]);

            // Get existing item IDs
            $existingItemIds = collect($validated['items'])
                ->pluck('id')
                ->filter()
                ->toArray();

            // Delete items not in the update
            $purchaseRequest->items()
                ->whereNotIn('id', $existingItemIds)
                ->delete();

            // Update or create items
            foreach ($validated['items'] as $index => $itemData) {
                $estimatedTotal = $itemData['estimated_unit_price'] ? 
                    $itemData['requested_quantity'] * $itemData['estimated_unit_price'] : 0;

                $itemAttributes = [
                    'product_id' => $itemData['product_id'] ?? null,
                    'item_name' => $itemData['item_name'],
                    'description' => $itemData['description'] ?? null,
                    'specifications' => $itemData['specifications'] ?? null,
                    'requested_quantity' => $itemData['requested_quantity'],
                    'unit_id' => $itemData['unit_id'] ?? null,
                    'unit_name' => $itemData['unit_name'] ?? null,
                    'estimated_unit_price' => $itemData['estimated_unit_price'] ?? null,
                    'estimated_total_price' => $estimatedTotal,
                    'currency' => $validated['currency'],
                    'required_date' => $itemData['required_date'] ?? $validated['required_date'],
                    'notes' => $itemData['notes'] ?? null,
                    'budget_code' => $itemData['budget_code'] ?? $validated['budget_code'],
                    'sort_order' => $index + 1,
                ];

                if (isset($itemData['id']) && $itemData['id']) {
                    // Update existing item
                    PurchaseRequestItem::where('id', $itemData['id'])
                        ->where('purchase_request_id', $purchaseRequest->id)
                        ->update($itemAttributes);
                } else {
                    // Create new item
                    PurchaseRequestItem::create(array_merge($itemAttributes, [
                        'purchase_request_id' => $purchaseRequest->id,
                        'remaining_quantity' => $itemData['requested_quantity'],
                    ]));
                }
            }

            // Recalculate total amount
            $purchaseRequest->calculateTotalAmount();
        });

        return redirect()
            ->route('purchasing.requests.show', $purchaseRequest)
            ->with('success', 'Satın alma talebi başarıyla güncellendi.');
    }

    public function destroy(PurchaseRequest $purchaseRequest)
    {
        if (!$purchaseRequest->canBeDeleted()) {
            return redirect()
                ->route('purchasing.requests.index')
                ->with('error', 'Bu talep silinemez.');
        }

        $purchaseRequest->delete();

        return redirect()
            ->route('purchasing.requests.index')
            ->with('success', 'Satın alma talebi başarıyla silindi.');
    }

    public function approve(Request $request, PurchaseRequest $purchaseRequest)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000'
        ]);

        if ($purchaseRequest->approve(Auth::id(), $validated['notes'] ?? null)) {
            return redirect()
                ->route('purchasing.requests.show', $purchaseRequest)
                ->with('success', 'Satın alma talebi onaylandı.');
        }

        return redirect()
            ->route('purchasing.requests.show', $purchaseRequest)
            ->with('error', 'Talep onaylanamadı.');
    }

    public function reject(Request $request, PurchaseRequest $purchaseRequest)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:1000'
        ]);

        if ($purchaseRequest->reject(Auth::id(), $validated['reason'])) {
            return redirect()
                ->route('purchasing.requests.show', $purchaseRequest)
                ->with('success', 'Satın alma talebi reddedildi.');
        }

        return redirect()
            ->route('purchasing.requests.show', $purchaseRequest)
            ->with('error', 'Talep reddedilemedi.');
    }
}