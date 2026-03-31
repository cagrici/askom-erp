<?php

namespace App\Http\Controllers\Logistics;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\Vehicle;
use App\Models\User;
use App\Models\Location;
use App\Models\CurrentAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class PlanningController extends Controller
{
    /**
     * Display planning dashboard with shipments
     */
    public function index(Request $request)
    {
        $query = Shipment::with(['vehicle', 'driver', 'location', 'currentAccount']);

        // Date range filter (default: next 7 days)
        $startDate = $request->get('start_date', now()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->addDays(7)->format('Y-m-d'));

        $query->whereBetween('shipment_date', [$startDate, $endDate]);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

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

        $shipments = $query->orderBy('shipment_date')->orderBy('priority', 'desc')->paginate(20)->withQueryString();

        // Get available vehicles (not assigned or available)
        $availableVehicles = Vehicle::where('is_active', true)
            ->whereNotIn('id', function($subquery) use ($startDate, $endDate) {
                $subquery->select('vehicle_id')
                    ->from('shipments')
                    ->whereNotNull('vehicle_id')
                    ->whereBetween('shipment_date', [$startDate, $endDate])
                    ->whereIn('status', ['planned', 'in_transit']);
            })
            ->get(['id', 'plate_number', 'make', 'model', 'vehicle_type']);

        // Get available drivers
        $availableDrivers = User::where('status', 'active')
            ->where('is_driver', true)
            ->get(['id', 'name']);

        // Get locations
        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get statistics
        $stats = $this->getPlanningStatistics($startDate, $endDate);

        return Inertia::render('Logistics/Planning/Index', [
            'shipments' => $shipments,
            'availableVehicles' => $availableVehicles,
            'availableDrivers' => $availableDrivers,
            'locations' => $locations,
            'stats' => $stats,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $request->status,
                'vehicle_id' => $request->vehicle_id,
                'driver_id' => $request->driver_id,
                'priority' => $request->priority,
                'search' => $request->search,
            ]
        ]);
    }

    /**
     * Assign vehicle and driver to shipment
     */
    public function assignResources(Request $request, Shipment $shipment)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'driver_id' => 'required|exists:users,id',
        ]);

        DB::beginTransaction();
        try {
            $shipment->update([
                'vehicle_id' => $validated['vehicle_id'],
                'driver_id' => $validated['driver_id'],
                'status' => 'planned',
            ]);

            DB::commit();

            return back()->with('success', 'Araç ve sürücü başarıyla atandı.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Atama sırasında bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Update shipment status
     */
    public function updateStatus(Request $request, Shipment $shipment)
    {
        $validated = $request->validate([
            'status' => 'required|in:draft,planned,in_transit,delivered,cancelled,delayed',
        ]);

        try {
            $shipment->update(['status' => $validated['status']]);

            // If status is delivered, set actual delivery date
            if ($validated['status'] === 'delivered' && !$shipment->actual_delivery_date) {
                $shipment->update(['actual_delivery_date' => now()]);
            }

            return back()->with('success', 'Durum başarıyla güncellendi.');
        } catch (\Exception $e) {
            return back()->with('error', 'Durum güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Optimize route for multiple shipments
     */
    public function optimizeRoute(Request $request)
    {
        $validated = $request->validate([
            'shipment_ids' => 'required|array',
            'shipment_ids.*' => 'exists:shipments,id',
        ]);

        // TODO: Implement route optimization algorithm
        // This would use a route optimization service or algorithm
        // to find the most efficient route through multiple destinations

        return back()->with('info', 'Rota optimizasyonu özelliği yakında eklenecek.');
    }

    /**
     * Get planning statistics
     */
    private function getPlanningStatistics(string $startDate, string $endDate): array
    {
        return [
            'total_shipments' => Shipment::whereBetween('shipment_date', [$startDate, $endDate])->count(),
            'planned_shipments' => Shipment::whereBetween('shipment_date', [$startDate, $endDate])->where('status', 'planned')->count(),
            'in_transit_shipments' => Shipment::whereBetween('shipment_date', [$startDate, $endDate])->where('status', 'in_transit')->count(),
            'delivered_shipments' => Shipment::whereBetween('shipment_date', [$startDate, $endDate])->where('status', 'delivered')->count(),
            'unassigned_shipments' => Shipment::whereBetween('shipment_date', [$startDate, $endDate])
                ->where(function($q) {
                    $q->whereNull('vehicle_id')->orWhereNull('driver_id');
                })->count(),
            'delayed_shipments' => Shipment::whereBetween('shipment_date', [$startDate, $endDate])
                ->where('status', 'delayed')
                ->count(),
            'high_priority_shipments' => Shipment::whereBetween('shipment_date', [$startDate, $endDate])
                ->whereIn('priority', ['high', 'urgent'])
                ->whereNotIn('status', ['delivered', 'cancelled'])
                ->count(),
        ];
    }
}
