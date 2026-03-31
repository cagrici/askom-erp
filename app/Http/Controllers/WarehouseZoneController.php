<?php

namespace App\Http\Controllers;

use App\Models\WarehouseZone;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseZoneController extends Controller
{
    public function index(): Response
    {
        $zones = WarehouseZone::with(['warehouse', 'locations'])
            ->withCount(['locations'])
            ->get()
            ->map(function ($zone) {
                $zone->location_utilization = $this->calculateLocationUtilization($zone);
                return $zone;
            });

        $warehouses = Warehouse::where('status', 'active')->get(['id', 'name', 'code']);

        return Inertia::render('Warehouses/Zones/Index', [
            'zones' => $zones,
            'warehouses' => $warehouses
        ]);
    }

    public function create(): Response
    {
        $warehouses = Warehouse::where('status', 'active')->get(['id', 'name', 'code']);

        return Inertia::render('Warehouses/Zones/Create', [
            'warehouses' => $warehouses
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:warehouse_zones',
            'zone_type' => 'required|in:receiving,storage,picking,packing,shipping,quarantine,returns',
            'description' => 'nullable|string',
            'max_locations' => 'nullable|integer|min:1',
            'temperature_controlled' => 'boolean',
            'min_temperature' => 'nullable|numeric',
            'max_temperature' => 'nullable|numeric',
            'status' => 'required|in:active,inactive,maintenance',
        ]);

        WarehouseZone::create($request->all());

        return redirect()->route('warehouses.zones.index')
            ->with('success', 'Depo bölgesi başarıyla oluşturuldu.');
    }

    public function show(WarehouseZone $warehouseZone): Response
    {
        $warehouseZone->load(['warehouse', 'locations.inventoryStocks']);
        
        return Inertia::render('Warehouses/Zones/Show', [
            'zone' => $warehouseZone
        ]);
    }

    public function edit(WarehouseZone $warehouseZone): Response
    {
        $warehouses = Warehouse::where('status', 'active')->get(['id', 'name', 'code']);

        return Inertia::render('Warehouses/Zones/Edit', [
            'zone' => $warehouseZone,
            'warehouses' => $warehouses
        ]);
    }

    public function update(Request $request, WarehouseZone $warehouseZone)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:warehouse_zones,code,' . $warehouseZone->id,
            'zone_type' => 'required|in:receiving,storage,picking,packing,shipping,quarantine,returns',
            'description' => 'nullable|string',
            'max_locations' => 'nullable|integer|min:1',
            'temperature_controlled' => 'boolean',
            'min_temperature' => 'nullable|numeric',
            'max_temperature' => 'nullable|numeric',
            'status' => 'required|in:active,inactive,maintenance',
        ]);

        $warehouseZone->update($request->all());

        return redirect()->route('warehouses.zones.index')
            ->with('success', 'Depo bölgesi başarıyla güncellendi.');
    }

    public function destroy(WarehouseZone $warehouseZone)
    {
        $warehouseZone->delete();

        return redirect()->route('warehouses.zones.index')
            ->with('success', 'Depo bölgesi başarıyla silindi.');
    }

    private function calculateLocationUtilization(WarehouseZone $zone): float
    {
        $totalLocations = $zone->locations->count();
        
        if ($totalLocations === 0) {
            return 0;
        }

        $occupiedLocations = $zone->locations->where('status', 'occupied')->count();
        
        return round(($occupiedLocations / $totalLocations) * 100, 1);
    }
}