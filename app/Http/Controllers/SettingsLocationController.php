<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\LocationType;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingsLocationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of locations.
     */
    public function index(Request $request): Response
    {
        $query = Location::with(['locationType']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Type filter
        if ($request->filled('location_type_id')) {
            $query->where('location_type_id', $request->get('location_type_id'));
        }

        // City filter
        if ($request->filled('city')) {
            $query->where('city', 'like', '%' . $request->get('city') . '%');
        }

        // Country filter
        if ($request->filled('country')) {
            $query->where('country', 'like', '%' . $request->get('country') . '%');
        }

        $locations = $query->orderBy('name')
                          ->paginate(20)
                          ->withQueryString();

        // Get location types for filters
        $locationTypes = LocationType::orderBy('name')->get();

        // Get unique cities and countries for filters
        $cities = Location::distinct()
                         ->whereNotNull('city')
                         ->orderBy('city')
                         ->pluck('city');

        $countries = Location::distinct()
                            ->whereNotNull('country')
                            ->orderBy('country')
                            ->pluck('country');

        return Inertia::render('Settings/Location/Index', [
            'locations' => $locations,
            'locationTypes' => $locationTypes,
            'cities' => $cities,
            'countries' => $countries,
            'filters' => $request->only(['search', 'is_active', 'location_type_id', 'city', 'country']),
            'flash' => [
                'success' => session('success'),
                'error' => session('error')
            ]
        ]);
    }

    /**
     * Store a newly created location.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:locations,code',
            'location_type_id' => 'required|exists:location_types,id',
            'description' => 'nullable|string|max:500',
            'address' => 'nullable|string|max:500',
            'city' => 'required|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'required|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'working_hours' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_active' => 'boolean',
            'employee_count' => 'nullable|integer|min:0',
            'opening_date' => 'nullable|date'
        ]);

        Location::create($validated);

        return redirect()->route('settings.locations.index')
            ->with('success', 'Lokasyon başarıyla eklendi.');
    }

    /**
     * Update the specified location.
     */
    public function update(Request $request, Location $location): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:locations,code,' . $location->id,
            'location_type_id' => 'required|exists:location_types,id',
            'description' => 'nullable|string|max:500',
            'address' => 'nullable|string|max:500',
            'city' => 'required|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'required|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'working_hours' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_active' => 'boolean',
            'employee_count' => 'nullable|integer|min:0',
            'opening_date' => 'nullable|date'
        ]);

        $location->update($validated);

        return redirect()->route('settings.locations.index')
            ->with('success', 'Lokasyon başarıyla güncellendi.');
    }

    /**
     * Remove the specified location.
     */
    public function destroy(Location $location): RedirectResponse
    {
        // Check if location is being used
        if ($location->users()->exists() || $location->departments()->exists()) {
            return redirect()->route('settings.locations.index')
                ->with('error', 'Bu lokasyon silinemiyor çünkü kullanıcılar veya departmanlar tarafından kullanılıyor.');
        }

        $location->delete();

        return redirect()->route('settings.locations.index')
            ->with('success', 'Lokasyon başarıyla silindi.');
    }

    /**
     * Toggle location status
     */
    public function toggleStatus(Location $location): RedirectResponse
    {
        $location->update(['is_active' => !$location->is_active]);

        $status = $location->is_active ? 'aktif' : 'pasif';
        return redirect()->route('settings.locations.index')
            ->with('success', "Lokasyon {$status} duruma getirildi.");
    }

    /**
     * Get location types for API
     */
    public function getLocationTypes()
    {
        $locationTypes = LocationType::orderBy('name')->get();
        return response()->json($locationTypes);
    }

    /**
     * Bulk import locations
     */
    public function bulkImport(Request $request): RedirectResponse
    {
        $request->validate([
            'import_file' => 'required|file|mimes:csv,xlsx|max:2048'
        ]);

        // TODO: Implement bulk import logic
        
        return redirect()->route('settings.locations.index')
            ->with('success', 'Lokasyonlar başarıyla içe aktarıldı.');
    }

    /**
     * Export locations
     */
    public function export(Request $request)
    {
        // TODO: Implement export logic
        
        return response()->download('locations.xlsx');
    }
}
