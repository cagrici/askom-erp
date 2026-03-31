<?php

namespace App\Http\Controllers;

use App\Models\WarehouseLocation;
use App\Models\Warehouse;
use App\Models\WarehouseZone;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseLocationController extends Controller
{
    public function index(): Response
    {
        $locations = WarehouseLocation::with(['warehouse', 'zone', 'inventoryStocks.inventoryItem'])
            ->get()
            ->map(function ($location) {
                $location->utilization_percentage = $this->calculateUtilization($location);
                $location->stock_count = $location->inventoryStocks->count();
                return $location;
            });

        $warehouses = Warehouse::where('status', 'active')->get(['id', 'name', 'code']);
        $zones = WarehouseZone::where('status', 'active')->get(['id', 'warehouse_id', 'name', 'code']);

        return Inertia::render('Warehouses/Locations/Index', [
            'locations' => $locations,
            'warehouses' => $warehouses,
            'zones' => $zones
        ]);
    }

    public function create(): Response
    {
        $warehouses = Warehouse::where('status', 'active')->with('zones')->get(['id', 'name', 'code']);

        return Inertia::render('Warehouses/Locations/Create', [
            'warehouses' => $warehouses
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'zone_id' => 'required|exists:warehouse_zones,id',
            'aisle' => 'required|string|max:10',
            'rack' => 'required|string|max:10',
            'shelf' => 'required|string|max:10',
            'position' => 'nullable|string|max:10',
            'location_type' => 'required|in:floor,rack,shelf,bin,pallet,bulk,special',
            'max_weight' => 'nullable|numeric|min:0',
            'max_volume' => 'nullable|numeric|min:0',
            'length' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'status' => 'required|in:available,occupied,reserved,blocked,maintenance',
            'is_pickable' => 'boolean',
            'is_bulk_location' => 'boolean',
            'temperature_controlled' => 'boolean',
        ]);

        // Generate location code automatically
        $locationCode = $request->aisle . '-' . $request->rack . '-' . $request->shelf;
        if ($request->position) {
            $locationCode .= '-' . $request->position;
        }

        $data = $request->all();
        $data['location_code'] = $locationCode;
        $data['code'] = $locationCode; // Add this line for the required 'code' field

        WarehouseLocation::create($data);

        return redirect()->route('warehouses.locations.index')
            ->with('success', 'Depolama lokasyonu başarıyla oluşturuldu.');
    }

    public function show(WarehouseLocation $warehouseLocation): Response
    {
        $warehouseLocation->load(['warehouse', 'zone', 'inventoryStocks.inventoryItem']);
        
        return Inertia::render('Warehouses/Locations/Show', [
            'location' => $warehouseLocation
        ]);
    }

    public function edit(WarehouseLocation $warehouseLocation): Response
    {
        $warehouses = Warehouse::where('status', 'active')->with('zones')->get(['id', 'name', 'code']);

        return Inertia::render('Warehouses/Locations/Edit', [
            'location' => $warehouseLocation,
            'warehouses' => $warehouses
        ]);
    }

    public function update(Request $request, WarehouseLocation $warehouseLocation)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'zone_id' => 'required|exists:warehouse_zones,id',
            'aisle' => 'required|string|max:10',
            'rack' => 'required|string|max:10',
            'shelf' => 'required|string|max:10',
            'position' => 'nullable|string|max:10',
            'location_type' => 'required|in:floor,rack,shelf,bin,pallet,bulk,special',
            'max_weight' => 'nullable|numeric|min:0',
            'max_volume' => 'nullable|numeric|min:0',
            'length' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'status' => 'required|in:available,occupied,reserved,blocked,maintenance',
            'is_pickable' => 'boolean',
            'is_bulk_location' => 'boolean',
            'temperature_controlled' => 'boolean',
        ]);

        // Update location code if dimensions changed
        $locationCode = $request->aisle . '-' . $request->rack . '-' . $request->shelf;
        if ($request->position) {
            $locationCode .= '-' . $request->position;
        }

        $data = $request->all();
        $data['location_code'] = $locationCode;
        $data['code'] = $locationCode; // Add this line for the required 'code' field

        $warehouseLocation->update($data);

        return redirect()->route('warehouses.locations.index')
            ->with('success', 'Depolama lokasyonu başarıyla güncellendi.');
    }

    public function destroy(WarehouseLocation $warehouseLocation)
    {
        $warehouseLocation->delete();

        return redirect()->route('warehouses.locations.index')
            ->with('success', 'Depolama lokasyonu başarıyla silindi.');
    }

    private function calculateUtilization(WarehouseLocation $location): float
    {
        if (!$location->max_volume || $location->max_volume <= 0) {
            return 0;
        }

        $usedVolume = $location->inventoryStocks->sum(function ($stock) {
            return $stock->quantity_on_hand * ($stock->inventoryItem->volume ?? 0);
        });

        return round(($usedVolume / $location->max_volume) * 100, 1);
    }
}