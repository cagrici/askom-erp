<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DriverController extends Controller
{
    /**
     * List all drivers
     */
    public function index(Request $request): Response
    {
        $query = User::where('is_driver', true);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('mobile_phone', 'like', "%{$search}%")
                    ->orWhere('license_number', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active_driver', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active_driver', false);
            }
        }

        $drivers = $query->orderBy('name')->paginate(20)->withQueryString();

        // Stats
        $stats = [
            'total' => User::where('is_driver', true)->count(),
            'active' => User::where('is_driver', true)->where('is_active_driver', true)->count(),
            'inactive' => User::where('is_driver', true)->where('is_active_driver', false)->count(),
            'license_expiring' => User::where('is_driver', true)
                ->whereNotNull('license_expiry_date')
                ->whereDate('license_expiry_date', '<=', now()->addDays(30))
                ->count(),
        ];

        return Inertia::render('Warehouse/Drivers/Index', [
            'drivers' => $drivers,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show create driver form
     */
    public function create(): Response
    {
        return Inertia::render('Warehouse/Drivers/Edit', [
            'driver' => null,
            'isEdit' => false,
        ]);
    }

    /**
     * Normalize phone number - remove spaces, dashes, parentheses
     */
    private function normalizePhone(?string $phone): ?string
    {
        if (empty($phone)) {
            return null;
        }
        return preg_replace('/[\s\-\(\)]+/', '', $phone);
    }

    /**
     * Store a new driver (quick add from shipping order create form)
     * Creates a user with is_driver = true
     */
    public function store(Request $request)
    {
        // Normalize phone number
        $phone = $this->normalizePhone($request->phone);

        // Check if driver with same phone already exists
        if ($phone) {
            $existingDriver = User::where('is_driver', true)
                ->where(function ($q) use ($phone) {
                    $q->where('phone', $phone)
                        ->orWhere('mobile_phone', $phone);
                })
                ->first();

            if ($existingDriver) {
                $errorMessage = "Bu telefon numarası ({$phone}) zaten {$existingDriver->name} adlı şoföre kayıtlı.";

                if ($request->wantsJson() || $request->ajax()) {
                    return response()->json([
                        'success' => false,
                        'message' => $errorMessage,
                    ], 422);
                }

                return back()->withErrors(['phone' => $errorMessage])->withInput();
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'license_number' => 'nullable|string|max:50',
            'license_expiry' => 'nullable|date',
            'license_type' => 'nullable|string|max:20',
            'driver_notes' => 'nullable|string|max:1000',
        ], [
            'phone.required' => 'Telefon numarası zorunludur.',
        ]);

        // Generate a unique username for the driver
        $baseUsername = Str::slug($validated['name'], '_');
        $username = $baseUsername;
        $counter = 1;
        while (User::where('username', $username)->exists()) {
            $username = $baseUsername . '_' . $counter;
            $counter++;
        }

        // Generate a random email if not provided (drivers might not have emails)
        $email = 'driver_' . Str::random(8) . '@internal.local';

        $driver = User::create([
            'name' => $validated['name'],
            'username' => $username,
            'email' => $email,
            'password' => Hash::make(Str::random(16)), // Random password, they won't login
            'phone' => $phone,
            'mobile_phone' => $phone,
            'is_driver' => true,
            'is_active_driver' => true,
            'license_number' => $validated['license_number'] ?? null,
            'license_type' => $validated['license_type'] ?? null,
            'license_expiry_date' => $validated['license_expiry'] ?? null,
            'driver_notes' => $validated['driver_notes'] ?? null,
            'status' => 1, // 1 = active (tinyint column)
            'location_id' => Auth::user()->location_id,
        ]);

        // Check if this is an AJAX request (from modal)
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Sofor basariyla eklendi.',
                'driver' => [
                    'id' => $driver->id,
                    'name' => $driver->name,
                ],
            ]);
        }

        return redirect()
            ->route('warehouse.drivers.index')
            ->with('success', 'Sofor basariyla eklendi.');
    }

    /**
     * Show edit driver form
     */
    public function edit(User $driver): Response
    {
        if (!$driver->is_driver) {
            abort(404);
        }

        return Inertia::render('Warehouse/Drivers/Edit', [
            'driver' => [
                'id' => $driver->id,
                'name' => $driver->name,
                'phone' => $driver->phone ?? $driver->mobile_phone,
                'license_number' => $driver->license_number,
                'license_type' => $driver->license_type,
                'license_expiry' => $driver->license_expiry_date?->format('Y-m-d'),
                'is_active_driver' => $driver->is_active_driver,
                'driver_notes' => $driver->driver_notes,
            ],
            'isEdit' => true,
        ]);
    }

    /**
     * Update driver
     */
    public function update(Request $request, User $driver)
    {
        if (!$driver->is_driver) {
            abort(404);
        }

        // Normalize phone number
        $phone = $this->normalizePhone($request->phone);

        // Check if driver with same phone already exists (excluding current driver)
        if ($phone) {
            $existingDriver = User::where('is_driver', true)
                ->where('id', '!=', $driver->id)
                ->where(function ($q) use ($phone) {
                    $q->where('phone', $phone)
                        ->orWhere('mobile_phone', $phone);
                })
                ->first();

            if ($existingDriver) {
                return back()->withErrors([
                    'phone' => "Bu telefon numarası ({$phone}) zaten {$existingDriver->name} adlı şoföre kayıtlı."
                ])->withInput();
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'license_number' => 'nullable|string|max:50',
            'license_type' => 'nullable|string|max:20',
            'license_expiry' => 'nullable|date',
            'is_active_driver' => 'boolean',
            'driver_notes' => 'nullable|string|max:1000',
        ], [
            'phone.required' => 'Telefon numarası zorunludur.',
        ]);

        $driver->update([
            'name' => $validated['name'],
            'phone' => $phone,
            'mobile_phone' => $phone,
            'license_number' => $validated['license_number'] ?? null,
            'license_type' => $validated['license_type'] ?? null,
            'license_expiry_date' => $validated['license_expiry'] ?? null,
            'is_active_driver' => $validated['is_active_driver'] ?? true,
            'driver_notes' => $validated['driver_notes'] ?? null,
        ]);

        return redirect()
            ->route('warehouse.drivers.index')
            ->with('success', 'Sofor bilgileri guncellendi.');
    }

    /**
     * Toggle driver active status
     */
    public function toggleActive(User $driver)
    {
        if (!$driver->is_driver) {
            abort(404);
        }

        $driver->is_active_driver = !$driver->is_active_driver;
        $driver->save();

        $status = $driver->is_active_driver ? 'aktif' : 'pasif';

        return back()->with('success', "Sofor {$status} yapildi.");
    }

    /**
     * Delete driver
     */
    public function destroy(User $driver)
    {
        if (!$driver->is_driver) {
            abort(404);
        }

        // Don't actually delete, just mark as inactive and remove driver flag
        $driver->is_driver = false;
        $driver->is_active_driver = false;
        $driver->save();

        return redirect()
            ->route('warehouse.drivers.index')
            ->with('success', 'Sofor silindi.');
    }
}
