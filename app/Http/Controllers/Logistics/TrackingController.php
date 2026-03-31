<?php

namespace App\Http\Controllers\Logistics;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class TrackingController extends Controller
{
    /**
     * Display real-time tracking dashboard
     */
    public function index(Request $request)
    {
        $query = Shipment::with(['vehicle', 'driver', 'location', 'currentAccount']);

        // Only show active shipments (in transit)
        $query->where('status', 'in_transit');

        // Filter by vehicle
        if ($request->filled('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        // Filter by driver
        if ($request->filled('driver_id')) {
            $query->where('driver_id', $request->driver_id);
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('shipment_number', 'like', "%{$search}%")
                  ->orWhere('destination_name', 'like', "%{$search}%")
                  ->orWhere('destination_city', 'like', "%{$search}%")
                  ->orWhere('waybill_number', 'like', "%{$search}%");
            });
        }

        $shipments = $query->orderBy('planned_delivery_date')
            ->orderBy('priority', 'desc')
            ->get();

        // Get all active vehicles with current shipments
        $activeVehicles = Vehicle::with(['currentShipment'])
            ->where('is_active', true)
            ->whereHas('shipments', function($q) {
                $q->where('status', 'in_transit');
            })
            ->get();

        // Get all vehicles for filter
        $vehicles = Vehicle::where('is_active', true)
            ->orderBy('plate_number')
            ->get(['id', 'plate_number', 'make', 'model']);

        // Get statistics
        $stats = $this->getTrackingStatistics();

        return Inertia::render('Logistics/Tracking/Index', [
            'shipments' => $shipments,
            'activeVehicles' => $activeVehicles,
            'vehicles' => $vehicles,
            'stats' => $stats,
            'filters' => [
                'vehicle_id' => $request->vehicle_id,
                'driver_id' => $request->driver_id,
                'priority' => $request->priority,
                'search' => $request->search,
            ]
        ]);
    }

    /**
     * Update shipment location
     */
    public function updateLocation(Request $request, Shipment $shipment)
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'completion_percentage' => 'nullable|integer|between:0,100',
        ]);

        try {
            $shipment->update([
                'current_latitude' => $validated['latitude'],
                'current_longitude' => $validated['longitude'],
                'last_location_update' => now(),
                'completion_percentage' => $validated['completion_percentage'] ?? $shipment->completion_percentage,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Konum güncellendi.',
                'shipment' => $shipment->load(['vehicle', 'driver'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Konum güncellenirken bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get shipment tracking history
     */
    public function show(Shipment $shipment)
    {
        $shipment->load(['vehicle', 'driver', 'location', 'currentAccount']);

        return Inertia::render('Logistics/Tracking/Show', [
            'shipment' => $shipment
        ]);
    }

    /**
     * Get real-time shipment data (API endpoint for live updates)
     */
    public function liveData(Request $request)
    {
        $shipments = Shipment::with(['vehicle', 'driver'])
            ->where('status', 'in_transit')
            ->whereNotNull('current_latitude')
            ->whereNotNull('current_longitude')
            ->get()
            ->map(function($shipment) {
                return [
                    'id' => $shipment->id,
                    'shipment_number' => $shipment->shipment_number,
                    'vehicle' => $shipment->vehicle ? [
                        'id' => $shipment->vehicle->id,
                        'plate_number' => $shipment->vehicle->plate_number,
                        'make' => $shipment->vehicle->make,
                        'model' => $shipment->vehicle->model,
                    ] : null,
                    'driver' => $shipment->driver ? [
                        'id' => $shipment->driver->id,
                        'name' => $shipment->driver->name,
                    ] : null,
                    'current_location' => [
                        'lat' => (float) $shipment->current_latitude,
                        'lng' => (float) $shipment->current_longitude,
                    ],
                    'origin_location' => [
                        'lat' => (float) $shipment->origin_latitude,
                        'lng' => (float) $shipment->origin_longitude,
                    ],
                    'destination_location' => [
                        'lat' => (float) $shipment->destination_latitude,
                        'lng' => (float) $shipment->destination_longitude,
                    ],
                    'destination_name' => $shipment->destination_name,
                    'destination_city' => $shipment->destination_city,
                    'completion_percentage' => $shipment->completion_percentage,
                    'priority' => $shipment->priority,
                    'priority_text' => $shipment->priority_text,
                    'status' => $shipment->status,
                    'status_text' => $shipment->status_text,
                    'last_location_update' => $shipment->last_location_update?->diffForHumans(),
                    'is_delayed' => $shipment->is_delayed,
                ];
            });

        return response()->json($shipments);
    }

    /**
     * Update shipment ETA
     */
    public function updateEta(Request $request, Shipment $shipment)
    {
        $validated = $request->validate([
            'estimated_arrival_time' => 'required|date',
        ]);

        try {
            $shipment->update([
                'arrival_time' => Carbon::parse($validated['estimated_arrival_time'])->format('H:i:s'),
            ]);

            return back()->with('success', 'Tahmini varış zamanı güncellendi.');
        } catch (\Exception $e) {
            return back()->with('error', 'ETA güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Get tracking statistics
     */
    private function getTrackingStatistics(): array
    {
        $today = now()->toDateString();

        return [
            'in_transit' => Shipment::where('status', 'in_transit')->count(),
            'on_time' => Shipment::where('status', 'in_transit')
                ->where(function($q) {
                    $q->whereNull('planned_delivery_date')
                      ->orWhere('planned_delivery_date', '>=', now());
                })->count(),
            'delayed' => Shipment::where('status', 'in_transit')
                ->where('planned_delivery_date', '<', now())
                ->count(),
            'urgent_priority' => Shipment::where('status', 'in_transit')
                ->whereIn('priority', ['high', 'urgent'])
                ->count(),
            'deliveries_today' => Shipment::where('status', 'in_transit')
                ->whereDate('planned_delivery_date', $today)
                ->count(),
            'tracked_vehicles' => Vehicle::whereHas('shipments', function($q) {
                $q->where('status', 'in_transit')
                  ->whereNotNull('current_latitude')
                  ->whereNotNull('current_longitude');
            })->count(),
            'avg_completion' => Shipment::where('status', 'in_transit')
                ->avg('completion_percentage') ?? 0,
        ];
    }
}
