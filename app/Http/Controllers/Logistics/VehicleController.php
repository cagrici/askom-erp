<?php

namespace App\Http\Controllers\Logistics;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\Location;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class VehicleController extends Controller
{
    /**
     * Display a listing of vehicles
     */
    public function index(Request $request)
    {
        $query = Vehicle::with(['location', 'user']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('plate_number', 'like', "%{$search}%")
                  ->orWhere('make', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by location
        if ($request->filled('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        // Filter by vehicle type
        if ($request->filled('vehicle_type')) {
            $query->where('vehicle_type', $request->vehicle_type);
        }

        // Filter by active status
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active === 'true');
        }

        $vehicles = $query->latest()->paginate(15)->withQueryString();

        // Get filter data
        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get statistics
        $stats = $this->getStatistics();

        return Inertia::render('Logistics/Vehicles/Index', [
            'vehicles' => $vehicles,
            'locations' => $locations,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'location_id' => $request->location_id,
                'vehicle_type' => $request->vehicle_type,
                'is_active' => $request->is_active,
            ]
        ]);
    }

    /**
     * Show the form for creating a new vehicle
     */
    public function create()
    {
        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $users = User::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Logistics/Vehicles/Create', [
            'locations' => $locations,
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created vehicle
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'plate_number' => 'required|string|max:255|unique:vehicles,plate_number',
            'make' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'color' => 'nullable|string|max:255',
            'vehicle_type' => 'required|in:car,van,truck,motorcycle,bus,trailer,other',
            'fuel_type' => 'nullable|in:gasoline,diesel,electric,hybrid,lpg,cng',
            'capacity' => 'nullable|numeric|min:0',
            'mileage' => 'nullable|integer|min:0',
            'location_id' => 'nullable|exists:locations,id',
            'user_id' => 'nullable|exists:users,id',
            'registration_number' => 'nullable|string|max:255',
            'license_serial_number' => 'nullable|string|max:255',
            'insurance_expiry_date' => 'nullable|date',
            'traffic_insurance_expiry' => 'nullable|date',
            'inspection_date' => 'nullable|date',
            'exhaust_inspection_date' => 'nullable|date',
            'hgs_label_number' => 'nullable|string|max:255',
            'have_winter_tires' => 'boolean',
            'have_summer_tires' => 'boolean',
            'tire_type' => 'nullable|string|max:255',
            'status' => 'required|in:available,in_use,maintenance,retired',
            'is_active' => 'boolean',
            'is_available' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $vehicle = Vehicle::create($validated);

            DB::commit();

            return redirect()
                ->route('logistics.vehicles.index')
                ->with('success', 'Araç başarıyla oluşturuldu.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()
                ->withInput()
                ->with('error', 'Araç oluşturulurken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified vehicle
     */
    public function show(Vehicle $vehicle)
    {
        $vehicle->load(['location', 'user', 'events']);

        // Get upcoming events/reservations
        $upcomingEvents = $vehicle->events()
            ->where('start_time', '>=', now())
            ->orderBy('start_time')
            ->limit(5)
            ->get();

        return Inertia::render('Logistics/Vehicles/Show', [
            'vehicle' => $vehicle,
            'upcomingEvents' => $upcomingEvents,
        ]);
    }

    /**
     * Show the form for editing the specified vehicle
     */
    public function edit(Vehicle $vehicle)
    {
        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $users = User::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Logistics/Vehicles/Edit', [
            'vehicle' => $vehicle,
            'locations' => $locations,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified vehicle
     */
    public function update(Request $request, Vehicle $vehicle)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'plate_number' => 'required|string|max:255|unique:vehicles,plate_number,' . $vehicle->id,
            'make' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'color' => 'nullable|string|max:255',
            'vehicle_type' => 'required|in:car,van,truck,motorcycle,bus,trailer,other',
            'fuel_type' => 'nullable|in:gasoline,diesel,electric,hybrid,lpg,cng',
            'capacity' => 'nullable|numeric|min:0',
            'mileage' => 'nullable|integer|min:0',
            'location_id' => 'nullable|exists:locations,id',
            'user_id' => 'nullable|exists:users,id',
            'registration_number' => 'nullable|string|max:255',
            'license_serial_number' => 'nullable|string|max:255',
            'insurance_expiry_date' => 'nullable|date',
            'traffic_insurance_expiry' => 'nullable|date',
            'inspection_date' => 'nullable|date',
            'exhaust_inspection_date' => 'nullable|date',
            'hgs_label_number' => 'nullable|string|max:255',
            'have_winter_tires' => 'boolean',
            'have_summer_tires' => 'boolean',
            'tire_type' => 'nullable|string|max:255',
            'status' => 'required|in:available,in_use,maintenance,retired',
            'is_active' => 'boolean',
            'is_available' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $vehicle->update($validated);

            DB::commit();

            return redirect()
                ->route('logistics.vehicles.index')
                ->with('success', 'Araç başarıyla güncellendi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()
                ->withInput()
                ->with('error', 'Araç güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified vehicle
     */
    public function destroy(Vehicle $vehicle)
    {
        try {
            $vehicle->delete();

            return redirect()
                ->route('logistics.vehicles.index')
                ->with('success', 'Araç başarıyla silindi.');
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Araç silinirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Get vehicle statistics
     */
    private function getStatistics(): array
    {
        return [
            'total_vehicles' => Vehicle::count(),
            'active_vehicles' => Vehicle::where('is_active', true)->count(),
            'available_vehicles' => Vehicle::where('status', 'available')->where('is_available', true)->count(),
            'in_use_vehicles' => Vehicle::where('status', 'in_use')->count(),
            'maintenance_vehicles' => Vehicle::where('status', 'maintenance')->count(),
            'retired_vehicles' => Vehicle::where('status', 'retired')->count(),
            'insurance_expiring_soon' => Vehicle::insuranceExpiringSoon()->count(),
            'maintenance_due_soon' => Vehicle::maintenanceDueSoon()->count(),
        ];
    }
}
