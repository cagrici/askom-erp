<?php

namespace App\Http\Controllers;

use App\Models\WarehouseOperation;
use App\Models\WarehouseOperationItem;
use App\Models\Warehouse;
use App\Models\WarehouseStaff;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class WarehouseOperationController extends Controller
{
    public function index(): Response
    {
        $operations = WarehouseOperation::with(['warehouse', 'assignedStaff.employee', 'items.inventoryItem'])
            ->withCount(['items'])
            ->latest()
            ->get()
            ->map(function ($operation) {
                $operation->progress_percentage = $this->calculateProgress($operation);
                $operation->items_processed = $operation->items->where('status', 'completed')->count();
                return $operation;
            });

        $warehouses = Warehouse::where('status', 'active')->get(['id', 'name', 'code']);
        $staff = WarehouseStaff::where('status', 'active')->with('employee:id,first_name,last_name,employee_id')->get(['id', 'employee_id', 'warehouse_id']);

        return Inertia::render('Warehouses/Operations/Index', [
            'operations' => $operations,
            'warehouses' => $warehouses,
            'staff' => $staff
        ]);
    }

    public function create(): Response
    {
        $warehouses = Warehouse::where('status', 'active')->get(['id', 'name', 'code']);
        $staff = WarehouseStaff::where('status', 'active')->with('employee:id,first_name,last_name,employee_id')->get(['id', 'employee_id', 'warehouse_id']);

        return Inertia::render('Warehouses/Operations/Create', [
            'warehouses' => $warehouses,
            'staff' => $staff
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'operation_type' => 'required|in:receiving,picking,packing,shipping,counting,relocation,maintenance',
            'priority' => 'required|in:low,normal,high,urgent',
            'assigned_staff_id' => 'nullable|exists:warehouse_staff,id',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'estimated_duration' => 'nullable|integer|min:1',
            'estimated_completion' => 'nullable|date',
        ]);

        // Generate operation number
        $operationNumber = 'WO-' . date('Y') . '-' . str_pad(
            WarehouseOperation::whereYear('created_at', date('Y'))->count() + 1,
            6,
            '0',
            STR_PAD_LEFT
        );

        $data = $request->all();
        $data['operation_number'] = $operationNumber;
        $data['status'] = 'pending';
        
        // Convert assigned_staff_id to assigned_to (user_id)
        if ($request->assigned_staff_id) {
            $staff = WarehouseStaff::find($request->assigned_staff_id);
            $data['assigned_to'] = $staff ? $staff->user_id : null;
        }
        unset($data['assigned_staff_id']); // Remove assigned_staff_id from data

        WarehouseOperation::create($data);

        return redirect()->route('warehouses.operations.index')
            ->with('success', 'Depo operasyonu başarıyla oluşturuldu.');
    }

    public function show(WarehouseOperation $warehouseOperation): Response
    {
        $warehouseOperation->load(['warehouse', 'assignedStaff.employee', 'items.inventoryItem', 'items.location']);
        
        return Inertia::render('Warehouses/Operations/Show', [
            'operation' => $warehouseOperation
        ]);
    }

    public function edit(WarehouseOperation $warehouseOperation): Response
    {
        $warehouses = Warehouse::where('status', 'active')->get(['id', 'name', 'code']);
        $staff = WarehouseStaff::where('status', 'active')->with('employee:id,first_name,last_name,employee_id')->get(['id', 'employee_id', 'warehouse_id']);

        return Inertia::render('Warehouses/Operations/Edit', [
            'operation' => $warehouseOperation,
            'warehouses' => $warehouses,
            'staff' => $staff
        ]);
    }

    public function update(Request $request, WarehouseOperation $warehouseOperation)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'operation_type' => 'required|in:receiving,picking,packing,shipping,counting,relocation,maintenance',
            'priority' => 'required|in:low,normal,high,urgent',
            'assigned_staff_id' => 'nullable|exists:warehouse_staff,id',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'estimated_duration' => 'nullable|integer|min:1',
            'estimated_completion' => 'nullable|date',
            'status' => 'required|in:pending,in_progress,completed,cancelled,on_hold',
        ]);

        $data = $request->all();

        // Convert assigned_staff_id to assigned_to (user_id)
        if ($request->assigned_staff_id) {
            $staff = WarehouseStaff::find($request->assigned_staff_id);
            $data['assigned_to'] = $staff ? $staff->user_id : null;
        } elseif ($request->has('assigned_staff_id') && $request->assigned_staff_id === '') {
            $data['assigned_to'] = null;
        }
        unset($data['assigned_staff_id']); // Remove assigned_staff_id from data

        // Set completion timestamp if status changed to completed
        if ($request->status === 'completed' && $warehouseOperation->status !== 'completed') {
            $data['completed_at'] = now();
        }

        $warehouseOperation->update($data);

        return redirect()->route('warehouses.operations.index')
            ->with('success', 'Depo operasyonu başarıyla güncellendi.');
    }

    public function destroy(WarehouseOperation $warehouseOperation)
    {
        $warehouseOperation->delete();

        return redirect()->route('warehouses.operations.index')
            ->with('success', 'Depo operasyonu başarıyla silindi.');
    }

    public function start(WarehouseOperation $warehouseOperation)
    {
        $warehouseOperation->update([
            'status' => 'in_progress',
            'started_at' => now()
        ]);

        return redirect()->back()
            ->with('success', 'Operasyon başlatıldı.');
    }

    public function complete(WarehouseOperation $warehouseOperation)
    {
        $warehouseOperation->update([
            'status' => 'completed',
            'completed_at' => now()
        ]);

        return redirect()->back()
            ->with('success', 'Operasyon tamamlandı.');
    }

    public function cancel(WarehouseOperation $warehouseOperation)
    {
        $warehouseOperation->update([
            'status' => 'cancelled',
            'cancelled_at' => now()
        ]);

        return redirect()->back()
            ->with('success', 'Operasyon iptal edildi.');
    }

    private function calculateProgress(WarehouseOperation $operation): int
    {
        if ($operation->status === 'completed') {
            return 100;
        }

        if ($operation->status === 'pending') {
            return 0;
        }

        $totalItems = $operation->items->count();
        if ($totalItems === 0) {
            return $operation->status === 'in_progress' ? 50 : 0;
        }

        $completedItems = $operation->items->where('status', 'completed')->count();
        return round(($completedItems / $totalItems) * 100);
    }
}