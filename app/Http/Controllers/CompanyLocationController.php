<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CompanyLocationController extends Controller
{
    /**
     * Display a listing of the locations.
     */
    public function index()
    {
        $locations = Location::with(['creator', 'parent'])
            ->orderBy('name')
            ->get();

        return Inertia::render('CompanyLocation/Index', [
            'locations' => $locations
        ]);
    }

    /**
     * Show the form for creating a new location.
     */
    public function create()
    {
        $parentLocations = Location::active()->orderBy('name')->get();
        $locationTypes = \App\Models\LocationType::orderBy('name')->get();

        return Inertia::render('CompanyLocation/Create', [
            'parentLocations' => $parentLocations,
            'locationTypes' => $locationTypes
        ]);
    }

    /**
     * Store a newly created location in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|string|max:50',
            'location_type_id' => 'nullable|exists:location_types,id',
            'is_active' => 'boolean',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'meta_data' => 'nullable|array',
            'parent_id' => 'nullable|exists:locations,id',
        ]);

        $validated['created_by'] = Auth::id();

        Location::create($validated);

        return redirect()->route('company-locations.index')
            ->with('success', 'Location created successfully.');
    }

    /**
     * Display the specified location.
     */
    public function show(Location $companyLocation)
    {
        return Inertia::render('CompanyLocation/Show', [
            'location' => $companyLocation->load(['creator', 'parent', 'children'])
        ]);
    }

    /**
     * Show the form for editing the specified location.
     */
    public function edit(Location $companyLocation)
    {
        $parentLocations = Location::active()
            ->where('id', '!=', $companyLocation->id)
            ->orderBy('name')
            ->get();

        $locationTypes = \App\Models\LocationType::orderBy('name')
            ->get();

        return Inertia::render('CompanyLocation/Edit', [
            'location' => $companyLocation->load('locationType'),
            'parentLocations' => $parentLocations,
            'locationTypes' => $locationTypes
        ]);
    }

    /**
     * Update the specified location in storage.
     */
    public function update(Request $request, Location $companyLocation)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'description' => 'nullable|string',
            'location_type_id' => 'nullable|exists:location_types,id',
            'is_active' => 'boolean',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',

            'parent_id' => 'nullable|exists:locations,id',
        ]);

        // Validate that parent is not itself
        if (isset($validated['parent_id']) && $validated['parent_id'] == $companyLocation->id) {
            return redirect()->back()
                ->withErrors(['parent_id' => 'A location cannot be its own parent.'])
                ->withInput();
        }

        $companyLocation->update($validated);

        return redirect()->route('company-locations.index')
            ->with('success', 'Location updated successfully.');
    }

    /**
     * Remove the specified location from storage.
     */
    public function destroy(Location $companyLocation)
    {
        // Check if there are any child locations
        if ($companyLocation->children()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete location with child locations.');
        }

        $companyLocation->delete();

        return redirect()->route('company-locations.index')
            ->with('success', 'Location deleted successfully.');
    }

    /**
     * Get locations for API
     */
    public function getLocations()
    {
        $locations = Location::active()
            ->with('locationType')
            ->orderBy('name')
            ->get(['id', 'name', 'address', 'city', 'type', 'location_type_id']);

        return response()->json($locations);
    }

    /**
     * Get location types for API
     */
    public function getLocationTypes()
    {
        $locationTypes = \App\Models\LocationType::orderBy('name')
            ->get(['id', 'name', 'description']);

        return response()->json($locationTypes);
    }
}
