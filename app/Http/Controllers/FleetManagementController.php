<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Models\Location;
use App\Models\Expense;
use App\Models\Category;
use App\Models\VehicleReservation;
use App\Models\Driver;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FleetManagementController extends Controller
{
    public function index()
    {
        return Inertia::render('FleetManagement/VehicleList');
    }

    public function dashboard()
    {
        // Araç istatistikleri
        $totalVehicles = Vehicle::where('is_active', true)->whereNull('sold_at')->count();
        $activeVehicles = Vehicle::where('is_active', true)->whereNull('sold_at')->count();
        $inMaintenanceVehicles = Vehicle::where('is_active', true)
            ->whereNull('sold_at')
            ->where('is_available', false)
            ->count();
        $soldVehicles = Vehicle::whereNotNull('sold_at')->count();

        // Yaklaşan muayeneler (30 gün içinde)
        $upcomingInspections = Vehicle::where('is_active', true)
            ->whereNull('sold_at')
            ->whereNotNull('inspection_date')
            ->whereRaw('DATEDIFF(inspection_date, CURDATE()) BETWEEN 0 AND 30')
            ->orderBy('inspection_date')
            ->take(5)
            ->get();

        // Yaklaşan sigortalar (30 gün içinde)
        $upcomingInsurances = Vehicle::where('is_active', true)
            ->whereNull('sold_at')
            ->whereNotNull('insurance_expiry_date')
            ->whereRaw('DATEDIFF(insurance_expiry_date, CURDATE()) BETWEEN 0 AND 30')
            ->orderBy('insurance_expiry_date')
            ->take(5)
            ->get();

        // Son 30 günün yakıt giderleri
        $fuelExpenses = Expense::where('category_id', function($query) {
                $query->select('id')->from('categories')
                    ->where('slug', 'fuel')
                    ->where('type', 'expense')
                    ->first();
            })
            ->whereNull('deleted_at')
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('amount');

        // Son 30 günün bakım giderleri
        $maintenanceExpenses = Expense::where('category_id', function($query) {
                $query->select('id')->from('categories')
                    ->where('slug', 'maintenance')
                    ->where('type', 'expense')
                    ->first();
            })
            ->whereNull('deleted_at')
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('amount');

        // Son eklenen araçlar
        $recentVehicles = Vehicle::where('is_active', true)
            ->whereNull('sold_at')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Son trafik cezaları
        $recentFines = Expense::where('category_id', function($query) {
                $query->select('id')->from('categories')
                    ->where('slug', 'traffic-fines')
                    ->where('type', 'expense')
                    ->first();
            })
            ->whereNotNull('vehicle_id')
            ->with('vehicle')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return Inertia::render('FleetManagement/Dashboard', [
            'statistics' => [
                'totalVehicles' => $totalVehicles,
                'activeVehicles' => $activeVehicles,
                'inMaintenanceVehicles' => $inMaintenanceVehicles,
                'soldVehicles' => $soldVehicles,
            ],
            'upcomingInspections' => $upcomingInspections,
            'upcomingInsurances' => $upcomingInsurances,
            'expenses' => [
                'fuel' => $fuelExpenses,
                'maintenance' => $maintenanceExpenses,
                'total' => $fuelExpenses + $maintenanceExpenses,
            ],
            'recentVehicles' => $recentVehicles,
            'recentFines' => $recentFines,
        ]);
    }

    public function inspectionDates()
    {
        return Inertia::render('FleetManagement/InspectionDates');
    }

    public function insuranceDates()
    {
        return Inertia::render('FleetManagement/InsuranceDates');
    }

    public function hgsInfo()
    {
        return Inertia::render('FleetManagement/HgsInfo');
    }

    public function soldVehicles()
    {
        return Inertia::render('FleetManagement/SoldVehicles');
    }

    public function maintenance()
    {
        return Inertia::render('FleetManagement/Maintenance');
    }

    public function fuelTracking()
    {
        return Inertia::render('FleetManagement/FuelTracking');
    }

    public function reservations()
    {
        return Inertia::render('FleetManagement/Reservations', [
            'vehicles' => Vehicle::where('is_active', true)
                ->whereNull('sold_at')
                ->select('id', 'plate_number', 'make', 'model', 'is_available')
                ->orderBy('plate_number')
                ->get(),
        ]);
    }

    public function tireInfo()
    {
        return Inertia::render('FleetManagement/TireInfo');
    }

    public function trafficFines()
    {
        return Inertia::render('FleetManagement/TrafficFines');
    }

    public function expenses()
    {
        return Inertia::render('FleetManagement/Expenses');
    }

    public function costAnalysis()
    {
        return Inertia::render('FleetManagement/CostAnalysis');
    }

    public function gpsTracking()
    {
        return Inertia::render('FleetManagement/GpsTracking');
    }

    public function vehiclesApi(Request $request)
    {
        $query = Vehicle::with(['location', 'user']);

        if ($request->has('active_only')) {
            $query->where('is_active', true)->whereNull('sold_at');
        }

        if ($request->has('sold_only')) {
            $query->whereNotNull('sold_at');
        }

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('plate_number', 'like', "%{$search}%")
                    ->orWhere('make', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%");
            });
        }

        if ($request->has('location_id')) {
            $query->where('location_id', $request->get('location_id'));
        }

        $vehicles = $query->orderBy('plate_number')->get();

        return response()->json($vehicles);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'plate_number' => 'required|string|unique:vehicles,plate_number',
                'make' => 'required|string',
                'model' => 'required|string',
                'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
                'color' => 'nullable|string',
                'vehicle_type' => 'required|string',
                'capacity' => 'required|integer|min:1',
                'fuel_type' => 'required|string',
                'mileage' => 'required|integer|min:0',
                'location_id' => 'required|exists:locations,id',
                'registration_number' => 'nullable|string',
                'insurance_expiry_date' => 'nullable|date',
                'traffic_insurance_expiry' => 'nullable|date',
                'inspection_date' => 'nullable|date',
                'exhaust_inspection_date' => 'nullable|date',
                'hgs_label_number' => 'nullable|string',
                'license_serial_number' => 'nullable|string',
                'have_winter_tires' => 'nullable|in:0,1,true,false',
                'have_summer_tires' => 'nullable|in:0,1,true,false',
                'tire_type' => 'nullable|in:summer,winter,all_season',
                'status' => 'required|in:available,in_use,maintenance,retired',
                'notes' => 'nullable|string',
                'image' => 'nullable|image|max:5120', // 5MB max
            ]);

            $validated['user_id'] = Auth::id();
            $validated['is_active'] = true;
            $validated['name'] = $validated['make'] . ' ' . $validated['model'] . ' (' . $validated['plate_number'] . ')';

            // Convert string boolean values to actual booleans
            $validated['have_winter_tires'] = in_array($validated['have_winter_tires'], ['1', 'true', true], true);
            $validated['have_summer_tires'] = in_array($validated['have_summer_tires'], ['1', 'true', true], true);

            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('vehicles', 'public');
                $validated['image_path'] = $path;
            }

            $vehicle = Vehicle::create($validated);

            return response()->json([
                'success' => true,
                'vehicle' => $vehicle->load(['location', 'user']),
                'message' => 'Araç başarıyla eklendi.'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Doğrulama hatası',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Vehicle creation error: ' . $e->getMessage(), [
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Araç kaydı sırasında bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        try {
            $validated = $request->validate([
                'plate_number' => 'required|string|unique:vehicles,plate_number,' . $vehicle->id,
                'make' => 'required|string',
                'model' => 'required|string',
                'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
                'color' => 'nullable|string',
                'vehicle_type' => 'required|string',
                'capacity' => 'required|integer|min:1',
                'fuel_type' => 'required|string',
                'mileage' => 'required|integer|min:0',
                'location_id' => 'required|exists:locations,id',
                'registration_number' => 'nullable|string',
                'insurance_expiry_date' => 'nullable|date',
                'traffic_insurance_expiry' => 'nullable|date',
                'inspection_date' => 'nullable|date',
                'exhaust_inspection_date' => 'nullable|date',
                'hgs_label_number' => 'nullable|string',
                'license_serial_number' => 'nullable|string',
                'have_winter_tires' => 'nullable|in:0,1,true,false',
                'have_summer_tires' => 'nullable|in:0,1,true,false',
                'tire_type' => 'nullable|in:summer,winter,all_season',
                'status' => 'required|in:available,in_use,maintenance,retired',
                'notes' => 'nullable|string',
                'image' => 'nullable|image|max:5120',
            ]);

            $validated['name'] = $validated['make'] . ' ' . $validated['model'] . ' (' . $validated['plate_number'] . ')';

            // Convert string boolean values to actual booleans
            $validated['have_winter_tires'] = in_array($validated['have_winter_tires'], ['1', 'true', true], true);
            $validated['have_summer_tires'] = in_array($validated['have_summer_tires'], ['1', 'true', true], true);

            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($vehicle->image_path) {
                    Storage::disk('public')->delete($vehicle->image_path);
                }
                $path = $request->file('image')->store('vehicles', 'public');
                $validated['image_path'] = $path;
            }

            $vehicle->update($validated);

            return response()->json([
                'success' => true,
                'vehicle' => $vehicle->load(['location', 'user']),
                'message' => 'Araç bilgileri güncellendi.'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Doğrulama hatası',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Vehicle update error: ' . $e->getMessage(), [
                'vehicle_id' => $vehicle->id,
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Araç güncelleme sırasında bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Vehicle $vehicle)
    {
        if ($vehicle->image_path) {
            Storage::disk('public')->delete($vehicle->image_path);
        }

        $vehicle->delete();

        return response()->json([
            'success' => true,
            'message' => 'Araç silindi.'
        ]);
    }

    public function markAsSold(Request $request, Vehicle $vehicle)
    {
        $validated = $request->validate([
            'sold_at' => 'required|date',
            'sold_notes' => 'nullable|string'
        ]);

        $vehicle->update([
            'sold_at' => $validated['sold_at'],
            'sold_notes' => $validated['sold_notes'],
            'is_active' => false,
            'status' => 'retired'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Araç satıldı olarak işaretlendi.'
        ]);
    }

    public function inspectionDatesApi(Request $request)
    {
        $vehicles = Vehicle::with(['location'])
            ->where('is_active', true)
            ->whereNull('sold_at')
            ->orderBy('inspection_date')
            ->get()
            ->map(function ($vehicle) {
                $daysUntilInspection = $vehicle->inspection_date
                    ? now()->diffInDays($vehicle->inspection_date, false)
                    : null;

                return [
                    'id' => $vehicle->id,
                    'plate_number' => $vehicle->plate_number,
                    'make' => $vehicle->make,
                    'model' => $vehicle->model,
                    'inspection_date' => $vehicle->inspection_date,
                    'exhaust_inspection_date' => $vehicle->exhaust_inspection_date,
                    'location' => $vehicle->location,
                    'days_until_inspection' => $daysUntilInspection,
                    'status' => $this->getInspectionStatus($daysUntilInspection),
                ];
            });

        return response()->json($vehicles);
    }

    public function insuranceDatesApi(Request $request)
    {
        $vehicles = Vehicle::with(['location'])
            ->where('is_active', true)
            ->whereNull('sold_at')
            ->orderBy('insurance_expiry_date')
            ->get()
            ->map(function ($vehicle) {
                $daysUntilInsurance = $vehicle->insurance_expiry_date
                    ? now()->diffInDays($vehicle->insurance_expiry_date, false)
                    : null;

                $daysUntilTrafficInsurance = $vehicle->traffic_insurance_expiry
                    ? now()->diffInDays($vehicle->traffic_insurance_expiry, false)
                    : null;

                return [
                    'id' => $vehicle->id,
                    'plate_number' => $vehicle->plate_number,
                    'make' => $vehicle->make,
                    'model' => $vehicle->model,
                    'insurance_expiry_date' => $vehicle->insurance_expiry_date,
                    'traffic_insurance_expiry' => $vehicle->traffic_insurance_expiry,
                    'location' => $vehicle->location,
                    'days_until_insurance' => $daysUntilInsurance,
                    'days_until_traffic_insurance' => $daysUntilTrafficInsurance,
                    'insurance_status' => $this->getInsuranceStatus($daysUntilInsurance),
                    'traffic_insurance_status' => $this->getInsuranceStatus($daysUntilTrafficInsurance),
                ];
            });

        return response()->json($vehicles);
    }

    public function hgsInfoApi(Request $request)
    {
        $vehicles = Vehicle::with(['location'])
            ->where('is_active', true)
            ->whereNull('sold_at')
            ->whereNotNull('hgs_label_number')
            ->orderBy('plate_number')
            ->get();

        return response()->json($vehicles);
    }

    private function getInspectionStatus($days)
    {
        if ($days === null) {
            return 'no_date';
        } elseif ($days < 0) {
            return 'expired';
        } elseif ($days <= 30) {
            return 'warning';
        } else {
            return 'ok';
        }
    }

    private function getInsuranceStatus($days)
    {
        if ($days === null) {
            return 'no_date';
        } elseif ($days < 0) {
            return 'expired';
        } elseif ($days <= 30) {
            return 'warning';
        } else {
            return 'ok';
        }
    }

    public function locationsApi()
    {
        $locations = Location::orderBy('name')->get();
        return response()->json($locations);
    }

    public function expenseCategoriesApi()
    {
        $categories = Category::where('is_active', true)
            ->where('type', 'expense')
            ->orderBy('name')
            ->get();
        return response()->json($categories);
    }

    public function storeExpenseCategory(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
            ]);

            // Check if category name already exists for expense type
            $existingCategory = Category::where('name', $validated['name'])
                ->where('type', 'expense')
                ->first();

            if ($existingCategory) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bu isimde bir kategori zaten mevcut.',
                    'errors' => ['name' => ['Bu isimde bir kategori zaten mevcut.']]
                ], 422);
            }

            // Generate slug from name
            $validated['slug'] = Str::slug($validated['name']);
            $validated['is_active'] = true;
            $validated['type'] = 'expense';

            // Ensure slug is unique for expense categories
            $originalSlug = $validated['slug'];
            $counter = 1;
            while (Category::where('slug', $validated['slug'])->where('type', 'expense')->exists()) {
                $validated['slug'] = $originalSlug . '-' . $counter;
                $counter++;
            }

            $category = Category::create($validated);

            return response()->json([
                'success' => true,
                'category' => $category,
                'message' => 'Kategori başarıyla eklendi.'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Doğrulama hatası',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori oluşturulurken bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    public function tireInfoApi(Request $request)
    {
        $vehicles = Vehicle::with(['location'])
            ->where('is_active', true)
            ->whereNull('sold_at')
            ->orderBy('plate_number')
            ->get()
            ->map(function ($vehicle) {
                return [
                    'id' => $vehicle->id,
                    'plate_number' => $vehicle->plate_number,
                    'make' => $vehicle->make,
                    'model' => $vehicle->model,
                    'year' => $vehicle->year,
                    'location' => $vehicle->location,
                    'have_winter_tires' => $vehicle->have_winter_tires,
                    'have_summer_tires' => $vehicle->have_summer_tires,
                    'tire_type' => $vehicle->tire_type,
                    'status' => $vehicle->status,
                ];
            });

        return response()->json($vehicles);
    }

    // Traffic Fines API Methods
    public function trafficFinesApi(Request $request)
    {
        $query = Expense::with(['vehicle.location', 'user', 'category'])
            ->where('expense_type', 'traffic_fine')
            ->whereNotNull('vehicle_id');

        if ($request->has('vehicle_id')) {
            $query->where('vehicle_id', $request->get('vehicle_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('vehicle', function ($vq) use ($search) {
                        $vq->where('plate_number', 'like', "%{$search}%");
                    });
            });
        }

        $fines = $query->orderBy('expense_date', 'desc')->get();

        return response()->json($fines);
    }

    public function storeTrafficFine(Request $request)
    {
        try {
            $validated = $request->validate([
                'vehicle_id' => 'required|exists:vehicles,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'expense_date' => 'required|date',
                'fine_number' => 'nullable|string',
                'violation_type' => 'nullable|string',
                'location' => 'nullable|string',
                'notes' => 'nullable|string',
                'receipt' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);

            $validated['user_id'] = Auth::id();
            $validated['expense_type'] = 'traffic_fine';
            $validated['status'] = 'pending';
            $validated['currency'] = 'TRY';

            // Find or create traffic fine category
            $category = Category::firstOrCreate(
                ['slug' => 'traffic-fines', 'type' => 'expense'],
                ['name' => 'Trafik Cezaları', 'description' => 'Araç trafik cezaları', 'is_active' => true, 'type' => 'expense']
            );
            $validated['category_id'] = $category->id;

            if ($request->hasFile('receipt')) {
                $path = $request->file('receipt')->store('traffic-fines', 'public');
                $validated['receipt_path'] = $path;
            }

            $fine = Expense::create($validated);

            return response()->json([
                'success' => true,
                'expense' => $fine->load(['vehicle.location', 'user', 'category']),
                'message' => 'Trafik cezası kaydedildi.'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Doğrulama hatası',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kayıt sırasında bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateTrafficFine(Request $request, Expense $expense)
    {
        try {
            $validated = $request->validate([
                'vehicle_id' => 'required|exists:vehicles,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'expense_date' => 'required|date',
                'fine_number' => 'nullable|string',
                'violation_type' => 'nullable|string',
                'location' => 'nullable|string',
                'notes' => 'nullable|string',
                'receipt' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);

            if ($request->hasFile('receipt')) {
                if ($expense->receipt_path) {
                    Storage::disk('public')->delete($expense->receipt_path);
                }
                $path = $request->file('receipt')->store('traffic-fines', 'public');
                $validated['receipt_path'] = $path;
            }

            $expense->update($validated);

            return response()->json([
                'success' => true,
                'expense' => $expense->load(['vehicle.location', 'user', 'category']),
                'message' => 'Trafik cezası güncellendi.'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Doğrulama hatası',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Güncelleme sırasında bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroyTrafficFine(Expense $expense)
    {
        if ($expense->receipt_path) {
            Storage::disk('public')->delete($expense->receipt_path);
        }

        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Trafik cezası silindi.'
        ]);
    }

    // General Expenses API Methods
    public function expensesApi(Request $request)
    {
        $query = Expense::with(['vehicle.location', 'user', 'category'])
            ->where('expense_type', '!=', 'traffic_fine')
            ->whereNotNull('vehicle_id');

        if ($request->has('vehicle_id')) {
            $query->where('vehicle_id', $request->get('vehicle_id'));
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->get('category_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('vehicle', function ($vq) use ($search) {
                        $vq->where('plate_number', 'like', "%{$search}%");
                    });
            });
        }

        $expenses = $query->orderBy('expense_date', 'desc')->get();

        return response()->json($expenses);
    }

    public function storeExpense(Request $request)
    {
        try {
            $validated = $request->validate([
                'vehicle_id' => 'required|exists:vehicles,id',
                'category_id' => 'required|exists:categories,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'expense_date' => 'required|date',
                'expense_type' => 'required|in:fuel,maintenance,insurance,other',
                'payment_method' => 'nullable|in:cash,credit_card,bank_transfer,check',
                'payment_reference' => 'nullable|string',
                'notes' => 'nullable|string',
                'receipt' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);

            $validated['user_id'] = Auth::id();
            $validated['status'] = 'pending';
            $validated['currency'] = 'TRY';

            if ($request->hasFile('receipt')) {
                $path = $request->file('receipt')->store('expenses', 'public');
                $validated['receipt_path'] = $path;
            }

            $expense = Expense::create($validated);

            return response()->json([
                'success' => true,
                'expense' => $expense->load(['vehicle.location', 'user', 'category']),
                'message' => 'Harcama kaydedildi.'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Doğrulama hatası',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kayıt sırasında bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateExpense(Request $request, Expense $expense)
    {
        try {
            $validated = $request->validate([
                'vehicle_id' => 'required|exists:vehicles,id',
                'category_id' => 'required|exists:categories,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'expense_date' => 'required|date',
                'expense_type' => 'required|in:fuel,maintenance,insurance,other',
                'payment_method' => 'nullable|in:cash,credit_card,bank_transfer,check',
                'payment_reference' => 'nullable|string',
                'notes' => 'nullable|string',
                'receipt' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);

            if ($request->hasFile('receipt')) {
                if ($expense->receipt_path) {
                    Storage::disk('public')->delete($expense->receipt_path);
                }
                $path = $request->file('receipt')->store('expenses', 'public');
                $validated['receipt_path'] = $path;
            }

            $expense->update($validated);

            return response()->json([
                'success' => true,
                'expense' => $expense->load(['vehicle.location', 'user', 'category']),
                'message' => 'Harcama güncellendi.'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Doğrulama hatası',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Güncelleme sırasında bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroyExpense(Expense $expense)
    {
        if ($expense->receipt_path) {
            Storage::disk('public')->delete($expense->receipt_path);
        }

        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Harcama silindi.'
        ]);
    }

    // Reservation API Methods
    public function reservationsApi(Request $request)
    {
        $query = VehicleReservation::with(['vehicle', 'user', 'reservedBy']);

        if ($request->has('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from')) {
            $query->where('start_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('end_date', '<=', $request->date_to);
        }

        $reservations = $query->orderBy('start_date', 'desc')
                              ->orderBy('start_time', 'desc')
                              ->get();

        return response()->json($reservations);
    }

    public function storeReservation(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'user_id' => 'required|exists:users,id',
            'purpose' => 'required|string|max:255',
            'destination' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'notes' => 'nullable|string',
        ]);

        // Check for conflicts
        $conflicts = VehicleReservation::where('vehicle_id', $validated['vehicle_id'])
            ->whereIn('status', ['approved', 'active'])
            ->where(function ($query) use ($validated) {
                $query->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                    ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                    ->orWhere(function ($q) use ($validated) {
                        $q->where('start_date', '<=', $validated['start_date'])
                          ->where('end_date', '>=', $validated['end_date']);
                    });
            })
            ->exists();

        if ($conflicts) {
            return response()->json([
                'success' => false,
                'message' => 'Bu tarihler arasında araç zaten rezerve edilmiş.'
            ], 422);
        }

        $validated['reserved_by'] = Auth::id();
        $validated['status'] = 'pending';

        $reservation = VehicleReservation::create($validated);
        $reservation->load(['vehicle', 'user', 'reservedBy']);

        return response()->json([
            'success' => true,
            'reservation' => $reservation,
            'message' => 'Rezervasyon başarıyla oluşturuldu.'
        ]);
    }

    public function updateReservation(Request $request, VehicleReservation $reservation)
    {
        $validated = $request->validate([
            'purpose' => 'required|string|max:255',
            'destination' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'notes' => 'nullable|string',
        ]);

        // Check for conflicts if dates changed
        if ($reservation->start_date != $validated['start_date'] ||
            $reservation->end_date != $validated['end_date']) {

            $conflicts = VehicleReservation::where('vehicle_id', $reservation->vehicle_id)
                ->where('id', '!=', $reservation->id)
                ->whereIn('status', ['approved', 'active'])
                ->where(function ($query) use ($validated) {
                    $query->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                        ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                        ->orWhere(function ($q) use ($validated) {
                            $q->where('start_date', '<=', $validated['start_date'])
                              ->where('end_date', '>=', $validated['end_date']);
                        });
                })
                ->exists();

            if ($conflicts) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bu tarihler arasında araç zaten rezerve edilmiş.'
                ], 422);
            }
        }

        $reservation->update($validated);
        $reservation->load(['vehicle', 'user', 'reservedBy']);

        return response()->json([
            'success' => true,
            'reservation' => $reservation,
            'message' => 'Rezervasyon güncellendi.'
        ]);
    }

    public function destroyReservation(VehicleReservation $reservation)
    {
        if (!in_array($reservation->status, ['pending', 'rejected'])) {
            return response()->json([
                'success' => false,
                'message' => 'Sadece bekleyen veya reddedilen rezervasyonlar silinebilir.'
            ], 422);
        }

        $reservation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rezervasyon silindi.'
        ]);
    }

    public function approveReservation(VehicleReservation $reservation)
    {
        $reservation->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rezervasyon onaylandı.'
        ]);
    }

    public function rejectReservation(Request $request, VehicleReservation $reservation)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $reservation->update([
            'status' => 'rejected',
            'rejected_by' => Auth::id(),
            'rejected_at' => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rezervasyon reddedildi.'
        ]);
    }

    public function startReservation(VehicleReservation $reservation)
    {
        if ($reservation->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Sadece onaylanmış rezervasyonlar başlatılabilir.'
            ], 422);
        }

        $reservation->update([
            'status' => 'active',
            'actual_start_time' => now(),
        ]);

        // Update vehicle availability
        $reservation->vehicle->update(['is_available' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Rezervasyon başlatıldı.'
        ]);
    }

    public function completeReservation(Request $request, VehicleReservation $reservation)
    {
        $validated = $request->validate([
            'end_kilometer' => 'nullable|integer|min:0',
        ]);

        $reservation->update([
            'status' => 'completed',
            'actual_end_time' => now(),
            'end_kilometer' => $validated['end_kilometer'] ?? null,
        ]);

        // Update vehicle availability
        $reservation->vehicle->update(['is_available' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Rezervasyon tamamlandı.'
        ]);
    }

    // Driver Management Methods
    public function drivers()
    {
        return Inertia::render('FleetManagement/Drivers');
    }

    public function driversApi(Request $request)
    {
        $query = \App\Models\Driver::with(['location', 'department', 'vehicleReservations', 'assignedVehicles']);

        if ($request->has('active_only')) {
            $query->active();
        }

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('license_number', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->has('license_type')) {
            $query->where('license_type', $request->get('license_type'));
        }

        if ($request->has('expiring_licenses')) {
            $days = $request->get('expiring_licenses', 30);
            $query->withExpiringLicense($days);
        }

        if ($request->has('expiring_medical')) {
            $days = $request->get('expiring_medical', 30);
            $query->withExpiringMedicalReport($days);
        }

        if ($request->has('expiring_psikoteknik')) {
            $days = $request->get('expiring_psikoteknik', 30);
            $query->withExpiringPsikoteknik($days);
        }

        $drivers = $query->orderBy('first_name')
            ->get()
            ->map(function ($driver) {
                return [
                    'id' => $driver->id,
                    'first_name' => $driver->first_name,
                    'last_name' => $driver->last_name,
                    'email' => $driver->email,
                    'phone' => $driver->phone,
                    'license_number' => $driver->license_number,
                    'license_type' => $driver->license_type,
                    'license_expiry_date' => $driver->license_expiry_date,
                    'medical_report_status' => $driver->medical_report_status,
                    'medical_report_expiry_date' => $driver->medical_report_expiry_date,
                    'psikoteknik_report_status' => $driver->psikoteknik_report_status,
                    'psikoteknik_report_expiry_date' => $driver->psikoteknik_report_expiry_date,
                    'driver_notes' => $driver->driver_notes,
                    'is_active_driver' => $driver->is_active_driver,
                    'location' => $driver->location,
                    'department' => $driver->department,
                    'driver_status' => $driver->driver_status,
                    'assigned_vehicles' => $driver->assignedVehicles,
                    'active_reservations_count' => $driver->vehicleReservations()
                        ->whereIn('status', ['approved', 'active'])
                        ->count(),
                    'total_reservations_count' => $driver->vehicleReservations()->count(),
                ];
            });

        return response()->json($drivers);
    }

    public function storeDriver(Request $request)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'phone' => 'nullable|string|max:20',
                'license_number' => 'required|string|max:50',
                'license_type' => 'required|string|in:B,C,D,E,C1,D1,BE,CE,DE,C1E,D1E',
                'license_expiry_date' => 'required|date|after:today',
                'medical_report_status' => 'nullable|string|in:valid,expired,not_provided',
                'medical_report_expiry_date' => 'nullable|date',
                'psikoteknik_report_status' => 'nullable|string|in:valid,expired,not_provided',
                'psikoteknik_report_expiry_date' => 'nullable|date',
                'location_id' => 'required|exists:locations,id',
                'department_id' => 'nullable|exists:departments,id',
                'driver_notes' => 'nullable|string',
                'is_active_driver' => 'boolean',
            ]);

            $validated['is_driver'] = true;
            $validated['password'] = bcrypt('123456'); // Default password
            $validated['username'] = strtolower($validated['first_name'] . '.' . $validated['last_name']);

            // Ensure unique username
            $baseUsername = $validated['username'];
            $counter = 1;
            while (\App\Models\User::where('username', $validated['username'])->exists()) {
                $validated['username'] = $baseUsername . $counter;
                $counter++;
            }

            $driver = \App\Models\Driver::create($validated);

            return response()->json([
                'success' => true,
                'driver' => $driver->load(['location', 'department']),
                'message' => 'Sürücü başarıyla eklendi.'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Doğrulama hatası',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sürücü kaydı sırasında bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateDriver(Request $request, \App\Models\Driver $driver)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $driver->id,
                'phone' => 'nullable|string|max:20',
                'license_number' => 'required|string|max:50',
                'license_type' => 'required|string|in:B,C,D,E,C1,D1,BE,CE,DE,C1E,D1E',
                'license_expiry_date' => 'required|date',
                'medical_report_status' => 'nullable|string|in:valid,expired,not_provided',
                'medical_report_expiry_date' => 'nullable|date',
                'psikoteknik_report_status' => 'nullable|string|in:valid,expired,not_provided',
                'psikoteknik_report_expiry_date' => 'nullable|date',
                'location_id' => 'required|exists:locations,id',
                'department_id' => 'nullable|exists:departments,id',
                'driver_notes' => 'nullable|string',
                'is_active_driver' => 'boolean',
            ]);

            $driver->update($validated);

            return response()->json([
                'success' => true,
                'driver' => $driver->load(['location', 'department']),
                'message' => 'Sürücü bilgileri güncellendi.'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Doğrulama hatası',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Güncelleme sırasında bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroyDriver(\App\Models\Driver $driver)
    {
        // Check if driver has active reservations
        $activeReservations = $driver->vehicleReservations()
            ->whereIn('status', ['approved', 'active'])
            ->count();

        if ($activeReservations > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Sürücünün aktif rezervasyonları olduğu için silinemez.'
            ], 422);
        }

        // Check if driver has assigned vehicles
        if ($driver->assignedVehicles()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Sürücünün atanmış araçları olduğu için silinemez.'
            ], 422);
        }

        $driver->update(['is_driver' => false, 'is_active_driver' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Sürücü listeden çıkarıldı.'
        ]);
    }

    public function toggleDriverStatus(\App\Models\Driver $driver)
    {
        $driver->update(['is_active_driver' => !$driver->is_active_driver]);

        $status = $driver->is_active_driver ? 'aktif' : 'pasif';

        return response()->json([
            'success' => true,
            'message' => "Sürücü durumu {$status} olarak güncellendi."
        ]);
    }

    public function getDriverStatistics()
    {
        $totalDrivers = \App\Models\Driver::count();
        $activeDrivers = \App\Models\Driver::active()->count();
        $inactiveDrivers = $totalDrivers - $activeDrivers;

        $expiredLicenses = \App\Models\Driver::withExpiredLicense()->count();
        $expiringLicenses = \App\Models\Driver::withExpiringLicense(30)->count();

        $expiredMedical = \App\Models\Driver::withExpiredMedicalReport()->count();
        $expiringMedical = \App\Models\Driver::withExpiringMedicalReport(30)->count();

        $expiredPsikoteknik = \App\Models\Driver::withExpiredPsikoteknik()->count();
        $expiringPsikoteknik = \App\Models\Driver::withExpiringPsikoteknik(30)->count();

        return response()->json([
            'total_drivers' => $totalDrivers,
            'active_drivers' => $activeDrivers,
            'inactive_drivers' => $inactiveDrivers,
            'expired_licenses' => $expiredLicenses,
            'expiring_licenses' => $expiringLicenses,
            'expired_medical' => $expiredMedical,
            'expiring_medical' => $expiringMedical,
            'expired_psikoteknik' => $expiredPsikoteknik,
            'expiring_psikoteknik' => $expiringPsikoteknik,
        ]);
    }

    // Cost Analysis Methods
    public function costAnalysisApi(Request $request)
    {
        $startDate = $request->get('start_date', now()->subYear()->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());
        $vehicleId = $request->get('vehicle_id');
        $groupBy = $request->get('group_by', 'month'); // month, quarter, year

        // Get all expense categories
        $expenseCategories = Category::where('type', 'expense')->get();

        // Base query
        $query = Expense::with(['vehicle', 'category'])
            ->whereBetween('expense_date', [$startDate, $endDate]);

        if ($vehicleId) {
            $query->where('vehicle_id', $vehicleId);
        }

        $expenses = $query->get();

        // Group expenses by category
        $expensesByCategory = $expenses->groupBy('category.slug')->map(function ($categoryExpenses) {
            return [
                'name' => $categoryExpenses->first()->category->name ?? 'Kategori Yok',
                'total' => $categoryExpenses->sum('amount'),
                'count' => $categoryExpenses->count(),
                'average' => $categoryExpenses->avg('amount'),
            ];
        });

        // Group expenses by vehicle
        $expensesByVehicle = $expenses->groupBy('vehicle_id')->map(function ($vehicleExpenses) {
            $vehicle = $vehicleExpenses->first()->vehicle;
            return [
                'vehicle_id' => $vehicleExpenses->first()->vehicle_id,
                'vehicle_name' => $vehicle ? "{$vehicle->plate_number} ({$vehicle->make} {$vehicle->model})" : 'Araç Yok',
                'total' => $vehicleExpenses->sum('amount'),
                'count' => $vehicleExpenses->count(),
                'categories' => $vehicleExpenses->groupBy('category.slug')->map(function ($catExpenses) {
                    return [
                        'name' => $catExpenses->first()->category->name ?? 'Kategori Yok',
                        'total' => $catExpenses->sum('amount'),
                        'count' => $catExpenses->count(),
                    ];
                })->values(),
            ];
        })->values();

        // Group expenses by time period
        $expensesByPeriod = $expenses->groupBy(function ($expense) use ($groupBy) {
            $date = \Carbon\Carbon::parse($expense->expense_date);
            switch ($groupBy) {
                case 'year':
                    return $date->year;
                case 'quarter':
                    return $date->year . '-Q' . $date->quarter;
                case 'month':
                default:
                    return $date->format('Y-m');
            }
        })->map(function ($periodExpenses, $period) {
            return [
                'period' => $period,
                'total' => $periodExpenses->sum('amount'),
                'count' => $periodExpenses->count(),
                'categories' => $periodExpenses->groupBy('category.slug')->map(function ($catExpenses) {
                    return [
                        'name' => $catExpenses->first()->category->name ?? 'Kategori Yok',
                        'total' => $catExpenses->sum('amount'),
                    ];
                })->values(),
            ];
        })->sortKeys()->values();

        // Calculate totals and averages
        $totalExpenses = $expenses->sum('amount');
        $totalCount = $expenses->count();
        $averageExpense = $totalCount > 0 ? $totalExpenses / $totalCount : 0;

        // Cost per vehicle per month
        $vehicles = Vehicle::where('is_active', true)->whereNull('sold_at')->get();
        $costPerVehicle = $totalExpenses / max($vehicles->count(), 1);

        // Most expensive categories
        $topCategories = $expensesByCategory->sortByDesc('total')->take(5);

        // Most expensive vehicles
        $topVehicles = $expensesByVehicle->sortByDesc('total')->take(5);

        return response()->json([
            'summary' => [
                'total_expenses' => $totalExpenses,
                'total_count' => $totalCount,
                'average_expense' => $averageExpense,
                'cost_per_vehicle' => $costPerVehicle,
                'period' => "{$startDate} - {$endDate}",
            ],
            'expenses_by_category' => $expensesByCategory->values(),
            'expenses_by_vehicle' => $expensesByVehicle,
            'expenses_by_period' => $expensesByPeriod,
            'top_categories' => $topCategories->values(),
            'top_vehicles' => $topVehicles,
            'expense_categories' => $expenseCategories,
        ]);
    }

    public function vehicleCostComparisonApi(Request $request)
    {
        $startDate = $request->get('start_date', now()->subYear()->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        $vehicles = Vehicle::with(['expenses' => function ($query) use ($startDate, $endDate) {
            $query->whereBetween('expense_date', [$startDate, $endDate]);
        }])->where('is_active', true)->whereNull('sold_at')->get();

        $vehicleComparison = $vehicles->map(function ($vehicle) {
            $totalExpenses = $vehicle->expenses->sum('amount');
            $expenseCount = $vehicle->expenses->count();
            $fuelExpenses = $vehicle->expenses->where('category.slug', 'fuel')->sum('amount');
            $maintenanceExpenses = $vehicle->expenses->where('category.slug', 'maintenance')->sum('amount');
            $insuranceExpenses = $vehicle->expenses->where('category.slug', 'insurance')->sum('amount');

            return [
                'id' => $vehicle->id,
                'plate_number' => $vehicle->plate_number,
                'make' => $vehicle->make,
                'model' => $vehicle->model,
                'year' => $vehicle->year,
                'mileage' => $vehicle->mileage,
                'total_expenses' => $totalExpenses,
                'expense_count' => $expenseCount,
                'fuel_expenses' => $fuelExpenses,
                'maintenance_expenses' => $maintenanceExpenses,
                'insurance_expenses' => $insuranceExpenses,
                'cost_per_km' => $vehicle->mileage > 0 ? $totalExpenses / $vehicle->mileage : 0,
                'average_expense' => $expenseCount > 0 ? $totalExpenses / $expenseCount : 0,
            ];
        })->sortByDesc('total_expenses')->values();

        return response()->json($vehicleComparison);
    }

    public function monthlyTrendApi(Request $request)
    {
        $months = $request->get('months', 12);
        $vehicleId = $request->get('vehicle_id');

        $startDate = now()->subMonths($months)->startOfMonth();
        $endDate = now()->endOfMonth();

        $query = Expense::with(['category'])
            ->whereBetween('expense_date', [$startDate, $endDate]);

        if ($vehicleId) {
            $query->where('vehicle_id', $vehicleId);
        }

        $expenses = $query->get();

        $monthlyData = [];
        for ($i = 0; $i < $months; $i++) {
            $month = now()->subMonths($i)->format('Y-m');
            $monthName = now()->subMonths($i)->locale('tr')->translatedFormat('F Y');

            $monthExpenses = $expenses->filter(function ($expense) use ($month) {
                return \Carbon\Carbon::parse($expense->expense_date)->format('Y-m') === $month;
            });

            $monthlyData[] = [
                'month' => $month,
                'month_name' => $monthName,
                'total' => $monthExpenses->sum('amount'),
                'count' => $monthExpenses->count(),
                'fuel' => $monthExpenses->where('category.slug', 'fuel')->sum('amount'),
                'maintenance' => $monthExpenses->where('category.slug', 'maintenance')->sum('amount'),
                'insurance' => $monthExpenses->where('category.slug', 'insurance')->sum('amount'),
                'traffic_fines' => $monthExpenses->where('category.slug', 'traffic-fines')->sum('amount'),
                'other' => $monthExpenses->whereNotIn('category.slug', ['fuel', 'maintenance', 'insurance', 'traffic-fines'])->sum('amount'),
            ];
        }

        return response()->json(array_reverse($monthlyData));
    }

    // GPS Tracking Methods with Arvento Integration
    public function gpsTrackingApi(Request $request)
    {
        try {
            $arventoService = new \App\Services\ArventoService();

            $vehicles = $arventoService->getVehicles();
            $locations = $arventoService->getVehicleLocations();
            $geofences = $arventoService->getGeofences();

            // Merge local vehicle data with Arvento data
            $localVehicles = Vehicle::where('is_active', true)
                ->whereNull('sold_at')
                ->select('id', 'plate_number', 'make', 'model', 'gps_device_id')
                ->get();

            $mergedVehicles = $localVehicles->map(function ($vehicle) use ($vehicles, $locations) {
                // Find matching Arvento vehicle by plate number or device ID
                $arventoVehicle = collect($vehicles)->firstWhere('plate_number', $vehicle->plate_number);
                $arventoLocation = collect($locations)->firstWhere('vehicle_id', $arventoVehicle['id'] ?? null);

                return [
                    'id' => $vehicle->id,
                    'local_id' => $vehicle->id,
                    'arvento_id' => $arventoVehicle['id'] ?? null,
                    'plate_number' => $vehicle->plate_number,
                    'vehicle_name' => "{$vehicle->make} {$vehicle->model}",
                    'device_id' => $vehicle->gps_device_id ?? $arventoVehicle['device_id'] ?? null,
                    'status' => $arventoVehicle['status'] ?? 'unknown',
                    'last_update' => $arventoVehicle['last_update'] ?? null,
                    'location' => $arventoLocation ? [
                        'latitude' => $arventoLocation['latitude'],
                        'longitude' => $arventoLocation['longitude'],
                        'address' => $arventoLocation['address'],
                        'speed' => $arventoLocation['speed'],
                        'direction' => $arventoLocation['direction'],
                        'fuel_level' => $arventoLocation['fuel_level'],
                        'engine_status' => $arventoLocation['engine_status'],
                        'odometer' => $arventoLocation['odometer'],
                        'timestamp' => $arventoLocation['timestamp'],
                    ] : null,
                ];
            });

            return response()->json([
                'vehicles' => $mergedVehicles,
                'geofences' => $geofences,
                'summary' => [
                    'total_vehicles' => $mergedVehicles->count(),
                    'online_vehicles' => $mergedVehicles->where('status', 'online')->count(),
                    'moving_vehicles' => $mergedVehicles->where('status', 'moving')->count(),
                    'stopped_vehicles' => $mergedVehicles->where('status', 'stopped')->count(),
                    'offline_vehicles' => $mergedVehicles->where('status', 'offline')->count(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('GPS Tracking API Error: ' . $e->getMessage());

            return response()->json([
                'error' => true,
                'message' => 'GPS tracking service is temporarily unavailable',
                'vehicles' => [],
                'geofences' => [],
                'summary' => [
                    'total_vehicles' => 0,
                    'online_vehicles' => 0,
                    'moving_vehicles' => 0,
                    'stopped_vehicles' => 0,
                    'offline_vehicles' => 0,
                ]
            ], 503);
        }
    }

    public function getVehicleRouteApi(Request $request, $vehicleId)
    {
        try {
            $startDate = $request->get('start_date', now()->subDay()->toDateString());
            $endDate = $request->get('end_date', now()->toDateString());

            $arventoService = new \App\Services\ArventoService();

            // Get vehicle info
            $vehicle = Vehicle::find($vehicleId);
            if (!$vehicle) {
                return response()->json(['error' => 'Vehicle not found'], 404);
            }

            // Get Arvento vehicle ID (this would need to be mapped in your database)
            $arventoVehicleId = $vehicle->arvento_vehicle_id ?? '1001'; // Default for demo

            $routeHistory = $arventoService->getVehicleHistory($arventoVehicleId, $startDate, $endDate);
            $reports = $arventoService->getVehicleReports($arventoVehicleId, 'general', $startDate, $endDate);

            return response()->json([
                'vehicle' => [
                    'id' => $vehicle->id,
                    'plate_number' => $vehicle->plate_number,
                    'make' => $vehicle->make,
                    'model' => $vehicle->model,
                ],
                'route_history' => $routeHistory,
                'reports' => $reports,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get Vehicle Route API Error: ' . $e->getMessage());

            return response()->json([
                'error' => true,
                'message' => 'Unable to fetch vehicle route data'
            ], 503);
        }
    }

    public function testArventoConnectionApi()
    {
        try {
            $arventoService = new \App\Services\ArventoService();
            $result = $arventoService->testConnection();

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Service initialization failed: ' . $e->getMessage()
            ], 503);
        }
    }
}
