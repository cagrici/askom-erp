<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\Company;
use App\Models\LocationType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LocationController extends Controller
{
    public function index(Request $request)
    {
        $query = Location::query()
            ->leftJoin('companies', 'locations.company_id', '=', 'companies.id')
            ->select('locations.*', 'companies.name as company_name', 'companies.id as company_id_joined')
            ->with(['locationType', 'parent'])
            ->orderBy('locations.name');

        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('code', 'like', "%{$searchTerm}%")
                    ->orWhere('city', 'like', "%{$searchTerm}%")
                    ->orWhere('address', 'like', "%{$searchTerm}%");
            });
        }

        if ($request->has('company_id') && $request->company_id) {
            $query->where('company_id', $request->company_id);
        }

        if ($request->has('is_active') && $request->is_active !== '') {
            $query->where('is_active', $request->is_active);
        }

        $locations = $query->paginate(15)->withQueryString();

        // Transform data to ensure company is always present
        $locations->getCollection()->transform(function ($location) {
            $location->company = (object) [
                'id' => $location->company_id_joined,
                'name' => $location->company_name ?? 'Tanımsız Şirket'
            ];
            // Remove extra attributes
            unset($location->company_name, $location->company_id_joined);
            return $location;
        });

        return Inertia::render('Admin/Locations/Index', [
            'locations' => $locations,
            'companies' => Company::active()->orderBy('name')->get(),
            'locationTypes' => LocationType::orderBy('name')->get(),
            'filters' => $request->only(['search', 'company_id', 'is_active']),
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:locations,code',
            'company_id' => 'required|exists:companies,id',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'timezone' => 'nullable|string|max:50',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_headquarters' => 'boolean',
            'is_active' => 'boolean',
            'parent_id' => 'nullable|exists:locations,id',
            'location_type_id' => 'nullable|exists:location_types,id',
        ]);

        $location = Location::create($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Location created successfully',
            'location' => $location->load(['company', 'locationType', 'parent'])
        ]);
    }

    public function update(Request $request, Location $location)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:locations,code,' . $location->id,
            'company_id' => 'required|exists:companies,id',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'timezone' => 'nullable|string|max:50',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_headquarters' => 'boolean',
            'is_active' => 'boolean',
            'parent_id' => 'nullable|exists:locations,id',
            'location_type_id' => 'nullable|exists:location_types,id',
        ]);

        $location->update($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Location updated successfully',
            'location' => $location->fresh(['company', 'locationType', 'parent'])
        ]);
    }

    public function destroy(Location $location)
    {
        $location->delete();

        return response()->json([
            'success' => true,
            'message' => 'Location deleted successfully'
        ]);
    }
}