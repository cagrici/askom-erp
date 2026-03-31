<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\WarehouseOperation;
use App\Models\WarehouseOperationItem;
use App\Models\User;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class WarehouseOperationController extends Controller
{
    /**
     * Display operations for a warehouse
     */
    public function index(Request $request, Warehouse $warehouse)
    {
        $query = $warehouse->operations()->with(['assignedTo', 'fromLocation', 'toLocation']);

        // Search filter
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('operation_number', 'like', '%' . $request->search . '%')
                  ->orWhere('reference_number', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        // Operation type filter
        if ($request->filled('operation_type')) {
            $query->where('operation_type', $request->operation_type);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Priority filter
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        // Assigned user filter
        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Overdue filter
        if ($request->filled('overdue') && $request->overdue === 'yes') {
            $query->overdue();
        }

        // Sorting
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $operations = $query->paginate(20)->withQueryString();

        // Get available staff for assignment
        $availableStaff = $warehouse->staff()
            ->with('user')
            ->where('status', 'active')
            ->where('is_available', true)
            ->get();

        // Operation statistics
        $operationStats = $this->getOperationStatistics($warehouse);

        return Inertia::render('Warehouse/Operations/Index', [
            'warehouse' => $warehouse,
            'operations' => $operations,
            'filters' => $request->all(['search', 'operation_type', 'status', 'priority', 'assigned_to', 'date_from', 'date_to', 'overdue', 'sort_field', 'sort_direction']),
            'availableStaff' => $availableStaff,
            'operationStats' => $operationStats,
        ]);
    }

    /**
     * Show the form for creating a new operation
     */
    public function create(Request $request, Warehouse $warehouse)
    {
        $operationType = $request->get('type', 'receiving');
        
        return Inertia::render('Warehouse/Operations/Create', [
            'warehouse' => $warehouse,
            'operationType' => $operationType,
            'availableStaff' => $warehouse->staff()->with('user')->where('status', 'active')->get(),
            'locations' => $warehouse->locations()->where('status', 'active')->get(),
            'products' => Product::select('id', 'name', 'code', 'sku')->orderBy('name')->get(),
        ]);
    }

    /**
     * Store a newly created operation
     */
    public function store(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'operation_type' => 'required|in:receiving,putaway,picking,packing,shipping,cycle_count,replenishment,returns,transfer,adjustment',
            'priority' => 'required|in:low,normal,high,urgent',
            'description' => 'nullable|string',
            'reference_type' => 'nullable|string|max:50',
            'reference_id' => 'nullable|integer',
            'reference_number' => 'nullable|string|max:100',
            'assigned_to' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date|after:now',
            'estimated_duration' => 'nullable|integer|min:1',
            'instructions' => 'nullable|array',
            'requirements' => 'nullable|array',
            'from_location_id' => 'nullable|exists:warehouse_locations,id',
            'to_location_id' => 'nullable|exists:warehouse_locations,id',
            'quality_check_required' => 'boolean',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.location_id' => 'nullable|exists:warehouse_locations,id',
            'items.*.quantity_expected' => 'required|numeric|min:0.01',
            'items.*.lot_number' => 'nullable|string|max:50',
            'items.*.serial_number' => 'nullable|string|max:50',
            'items.*.expiry_date' => 'nullable|date',
            'items.*.batch_code' => 'nullable|string|max:50',
            'items.*.sequence_number' => 'nullable|integer|min:1',
            'items.*.condition' => 'nullable|in:good,damaged,expired,quarantine',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Generate operation number
            $operationNumber = WarehouseOperation::generateOperationNumber($validated['operation_type']);

            // Create operation
            $operation = $warehouse->operations()->create([
                'operation_number' => $operationNumber,
                'operation_type' => $validated['operation_type'],
                'priority' => $validated['priority'],
                'status' => $validated['assigned_to'] ? 'assigned' : 'created',
                'description' => $validated['description'],
                'reference_type' => $validated['reference_type'],
                'reference_id' => $validated['reference_id'],
                'reference_number' => $validated['reference_number'],
                'assigned_to' => $validated['assigned_to'],
                'assigned_at' => $validated['assigned_to'] ? now() : null,
                'due_date' => $validated['due_date'],
                'estimated_duration' => $validated['estimated_duration'],
                'instructions' => $validated['instructions'],
                'requirements' => $validated['requirements'],
                'from_location_id' => $validated['from_location_id'],
                'to_location_id' => $validated['to_location_id'],
                'quality_check_required' => $validated['quality_check_required'] ?? false,
                'notes' => $validated['notes'],
                'items_total' => count($validated['items']),
                'created_by' => auth()->id(),
            ]);

            // Create operation items
            foreach ($validated['items'] as $itemData) {
                WarehouseOperationItem::create([
                    'operation_id' => $operation->id,
                    'product_id' => $itemData['product_id'],
                    'location_id' => $itemData['location_id'],
                    'quantity_expected' => $itemData['quantity_expected'],
                    'quantity_remaining' => $itemData['quantity_expected'],
                    'lot_number' => $itemData['lot_number'],
                    'serial_number' => $itemData['serial_number'],
                    'expiry_date' => $itemData['expiry_date'],
                    'batch_code' => $itemData['batch_code'],
                    'sequence_number' => $itemData['sequence_number'],
                    'condition' => $itemData['condition'] ?? 'good',
                    'notes' => $itemData['notes'],
                ]);
            }

            DB::commit();

            return redirect()->route('warehouses.operations.show', [$warehouse, $operation])
                ->with('success', 'Depo operasyonu başarıyla oluşturuldu.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Operasyon oluşturulurken hata oluştu: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Display the specified operation
     */
    public function show(Warehouse $warehouse, WarehouseOperation $operation)
    {
        $operation->load([
            'assignedTo', 'fromLocation', 'toLocation', 'qualityChecker', 'creator',
            'items.product', 'items.location', 'items.fromLocation', 'items.toLocation', 'items.processedBy'
        ]);

        return Inertia::render('Warehouse/Operations/Show', [
            'warehouse' => $warehouse,
            'operation' => $operation,
        ]);
    }

    /**
     * Assign operation to user
     */
    public function assign(Request $request, Warehouse $warehouse, WarehouseOperation $operation)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'notes' => 'nullable|string|max:255',
        ]);

        // Check if user is available warehouse staff
        $staff = $warehouse->staff()
            ->where('user_id', $validated['user_id'])
            ->where('status', 'active')
            ->first();

        if (!$staff) {
            return back()->with('error', 'Seçilen kullanıcı bu depoda aktif personel değil.');
        }

        $operation->assignTo($validated['user_id']);

        if ($validated['notes']) {
            $operation->update(['notes' => $validated['notes']]);
        }

        return back()->with('success', 'Operasyon başarıyla atandı.');
    }

    /**
     * Start operation
     */
    public function start(Warehouse $warehouse, WarehouseOperation $operation)
    {
        if ($operation->status !== 'assigned' && $operation->status !== 'created') {
            return back()->with('error', 'Bu operasyon başlatılamaz.');
        }

        $operation->start(auth()->id());

        return back()->with('success', 'Operasyon başlatıldı.');
    }

    /**
     * Complete operation
     */
    public function complete(Request $request, Warehouse $warehouse, WarehouseOperation $operation)
    {
        $validated = $request->validate([
            'completion_notes' => 'nullable|string',
            'quality_check_passed' => 'nullable|boolean',
            'quality_notes' => 'nullable|string',
        ]);

        if ($operation->status !== 'in_progress') {
            return back()->with('error', 'Bu operasyon tamamlanamaz.');
        }

        // Check if all items are processed
        $unprocessedItems = $operation->items()->where('status', '!=', 'completed')->count();
        if ($unprocessedItems > 0) {
            return back()->with('error', 'Tüm kalemler işlenmeden operasyon tamamlanamaz.');
        }

        $operation->complete($validated['completion_notes']);

        // Update quality check if required
        if ($operation->quality_check_required && isset($validated['quality_check_passed'])) {
            $operation->update([
                'quality_checked_by' => auth()->id(),
                'quality_checked_at' => now(),
                'quality_issues' => $validated['quality_check_passed'] ? null : ['failed' => $validated['quality_notes']],
            ]);
        }

        return back()->with('success', 'Operasyon tamamlandı.');
    }

    /**
     * Cancel operation
     */
    public function cancel(Request $request, Warehouse $warehouse, WarehouseOperation $operation)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        if (in_array($operation->status, ['completed', 'cancelled'])) {
            return back()->with('error', 'Bu operasyon iptal edilemez.');
        }

        $operation->cancel($validated['reason']);

        return back()->with('success', 'Operasyon iptal edildi.');
    }

    /**
     * Put operation on hold
     */
    public function hold(Request $request, Warehouse $warehouse, WarehouseOperation $operation)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        if (in_array($operation->status, ['completed', 'cancelled'])) {
            return back()->with('error', 'Bu operasyon bekletme alınamaz.');
        }

        $operation->putOnHold($validated['reason']);

        return back()->with('success', 'Operasyon beklemeye alındı.');
    }

    /**
     * Resume operation from hold
     */
    public function resume(Warehouse $warehouse, WarehouseOperation $operation)
    {
        if ($operation->status !== 'on_hold') {
            return back()->with('error', 'Bu operasyon beklemede değil.');
        }

        $status = $operation->assigned_to ? 'assigned' : 'created';
        $operation->update(['status' => $status]);

        return back()->with('success', 'Operasyon devam ettirildi.');
    }

    /**
     * Process operation item
     */
    public function processItem(Request $request, Warehouse $warehouse, WarehouseOperation $operation, WarehouseOperationItem $item)
    {
        $validated = $request->validate([
            'quantity_processed' => 'required|numeric|min:0|max:' . $item->quantity_remaining,
            'condition' => 'required|in:good,damaged,expired,quarantine',
            'condition_notes' => 'nullable|string',
            'to_location_id' => 'nullable|exists:warehouse_locations,id',
            'package_type' => 'nullable|string|max:50',
            'package_id' => 'nullable|string|max:100',
            'package_weight' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($item->status === 'completed') {
            return back()->with('error', 'Bu kalem zaten işlenmiş.');
        }

        DB::beginTransaction();
        try {
            // Process the item
            $item->process($validated['quantity_processed'], auth()->id(), $validated['notes']);

            // Update condition if different
            if ($validated['condition'] !== $item->condition) {
                $item->update([
                    'condition' => $validated['condition'],
                    'condition_notes' => $validated['condition_notes'],
                ]);
            }

            // Update location if provided
            if ($validated['to_location_id']) {
                $item->update(['to_location_id' => $validated['to_location_id']]);
            }

            // Update package information if provided
            if ($validated['package_type']) {
                $item->updatePackage(
                    $validated['package_type'],
                    $validated['package_id'],
                    $validated['package_weight']
                );
            }

            // Update operation progress
            $operation->update([
                'items_processed' => $operation->items()->where('status', 'completed')->count(),
            ]);

            DB::commit();

            return back()->with('success', 'Kalem başarıyla işlendi.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Kalem işlenirken hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Get operation statistics
     */
    private function getOperationStatistics(Warehouse $warehouse)
    {
        $today = today();
        
        return [
            'total_operations' => $warehouse->operations()->count(),
            'today_operations' => $warehouse->operations()->whereDate('created_at', $today)->count(),
            'pending_operations' => $warehouse->operations()->where('status', 'created')->count(),
            'in_progress_operations' => $warehouse->operations()->where('status', 'in_progress')->count(),
            'completed_operations' => $warehouse->operations()->where('status', 'completed')->count(),
            'overdue_operations' => $warehouse->operations()->overdue()->count(),
            'today_completed' => $warehouse->operations()
                ->whereDate('completed_at', $today)
                ->where('status', 'completed')
                ->count(),
        ];
    }
}