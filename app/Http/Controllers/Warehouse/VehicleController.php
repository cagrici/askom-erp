<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VehicleController extends Controller
{
    /**
     * Store a new vehicle (quick add from shipping order create form)
     */
    public function store(Request $request)
    {
        // Normalize plate number: remove spaces, convert to uppercase
        $plateNumber = preg_replace('/\s+/', '', strtoupper($request->plate_number ?? ''));

        $request->merge(['plate_number' => $plateNumber]);

        $validated = $request->validate([
            'plate_number' => 'required|string|max:20|unique:vehicles,plate_number',
            'make' => 'nullable|string|max:50',
            'model' => 'nullable|string|max:50',
            'year' => 'nullable|integer|min:1990|max:2030',
            'color' => 'nullable|string|max:30',
            'capacity' => 'nullable|string|max:50',
        ], [
            'plate_number.unique' => 'Bu plaka numarası zaten kayıtlı.',
        ]);

        $vehicle = Vehicle::create([
            'plate_number' => $plateNumber,
            'name' => $plateNumber, // name field from plate
            'make' => $validated['make'] ?? null,
            'model' => $validated['model'] ?? null,
            'year' => $validated['year'] ?? null,
            'color' => $validated['color'] ?? null,
            'capacity' => $validated['capacity'] ?? null,
            'vehicle_type' => 'van', // Default: Hafif Ticari (for shipping)
            'status' => 'available',
            'is_active' => true,
            'is_available' => true,
            'user_id' => Auth::id(),
            'location_id' => Auth::user()->location_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Arac basariyla eklendi.',
            'vehicle' => [
                'id' => $vehicle->id,
                'plate_number' => $vehicle->plate_number,
                'make' => $vehicle->make,
                'model' => $vehicle->model,
            ],
        ]);
    }
}
