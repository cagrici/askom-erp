<?php

namespace App\Http\Controllers\Logistics;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\Vehicle;
use App\Models\Carrier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class CostController extends Controller
{
    /**
     * Display cost analytics dashboard
     */
    public function index(Request $request)
    {
        // Date range filter (default: current month)
        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->endOfMonth()->format('Y-m-d'));

        // Get shipments within date range
        $shipmentsQuery = Shipment::with(['vehicle', 'driver', 'currentAccount'])
            ->whereBetween('shipment_date', [$startDate, $endDate]);

        // Filter by vehicle
        if ($request->filled('vehicle_id')) {
            $shipmentsQuery->where('vehicle_id', $request->vehicle_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $shipmentsQuery->where('status', $request->status);
        }

        $shipments = $shipmentsQuery->orderBy('shipment_date', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Get vehicles for filter
        $vehicles = Vehicle::where('is_active', true)
            ->orderBy('plate_number')
            ->get(['id', 'plate_number', 'make', 'model']);

        // Calculate statistics
        $stats = $this->getCostStatistics($startDate, $endDate, $request);

        // Get cost breakdown by category
        $costBreakdown = $this->getCostBreakdown($startDate, $endDate, $request);

        // Get cost trends (last 6 months)
        $costTrends = $this->getCostTrends($request);

        // Get top vehicles by cost
        $topVehiclesCosts = $this->getTopVehiclesCosts($startDate, $endDate, $request);

        return Inertia::render('Logistics/Costs/Index', [
            'shipments' => $shipments,
            'vehicles' => $vehicles,
            'stats' => $stats,
            'costBreakdown' => $costBreakdown,
            'costTrends' => $costTrends,
            'topVehiclesCosts' => $topVehiclesCosts,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'vehicle_id' => $request->vehicle_id,
                'status' => $request->status,
            ]
        ]);
    }

    /**
     * Get cost statistics
     */
    private function getCostStatistics(string $startDate, string $endDate, Request $request): array
    {
        $query = Shipment::whereBetween('shipment_date', [$startDate, $endDate]);

        if ($request->filled('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        $totalFuelCost = $query->sum('fuel_cost') ?? 0;
        $totalTollCost = $query->sum('toll_cost') ?? 0;
        $totalOtherCosts = $query->sum('other_costs') ?? 0;
        $totalCost = $totalFuelCost + $totalTollCost + $totalOtherCosts;

        $totalShipments = $query->count();
        $totalDistance = $query->sum('actual_distance_km') ?? $query->sum('estimated_distance_km') ?? 0;

        $avgCostPerShipment = $totalShipments > 0 ? $totalCost / $totalShipments : 0;
        $avgCostPerKm = $totalDistance > 0 ? $totalCost / $totalDistance : 0;

        // Calculate previous period for comparison
        $periodDays = Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate));
        $prevStartDate = Carbon::parse($startDate)->subDays($periodDays)->format('Y-m-d');
        $prevEndDate = Carbon::parse($startDate)->subDay()->format('Y-m-d');

        $prevQuery = Shipment::whereBetween('shipment_date', [$prevStartDate, $prevEndDate]);
        if ($request->filled('vehicle_id')) {
            $prevQuery->where('vehicle_id', $request->vehicle_id);
        }

        $prevTotalFuel = $prevQuery->sum('fuel_cost') ?? 0;
        $prevTotalToll = $prevQuery->sum('toll_cost') ?? 0;
        $prevTotalOther = $prevQuery->sum('other_costs') ?? 0;
        $prevTotalCost = $prevTotalFuel + $prevTotalToll + $prevTotalOther;

        $costChange = $prevTotalCost > 0 ? (($totalCost - $prevTotalCost) / $prevTotalCost) * 100 : 0;

        return [
            'total_cost' => $totalCost,
            'total_fuel_cost' => $totalFuelCost,
            'total_toll_cost' => $totalTollCost,
            'total_other_costs' => $totalOtherCosts,
            'total_shipments' => $totalShipments,
            'total_distance' => $totalDistance,
            'avg_cost_per_shipment' => $avgCostPerShipment,
            'avg_cost_per_km' => $avgCostPerKm,
            'cost_change_percentage' => $costChange,
            'prev_total_cost' => $prevTotalCost,
        ];
    }

    /**
     * Get cost breakdown by category
     */
    private function getCostBreakdown(string $startDate, string $endDate, Request $request): array
    {
        $query = Shipment::whereBetween('shipment_date', [$startDate, $endDate]);

        if ($request->filled('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        $fuelCost = $query->sum('fuel_cost') ?? 0;
        $tollCost = $query->sum('toll_cost') ?? 0;
        $otherCosts = $query->sum('other_costs') ?? 0;
        $total = $fuelCost + $tollCost + $otherCosts;

        return [
            'fuel' => [
                'amount' => $fuelCost,
                'percentage' => $total > 0 ? ($fuelCost / $total) * 100 : 0,
            ],
            'toll' => [
                'amount' => $tollCost,
                'percentage' => $total > 0 ? ($tollCost / $total) * 100 : 0,
            ],
            'other' => [
                'amount' => $otherCosts,
                'percentage' => $total > 0 ? ($otherCosts / $total) * 100 : 0,
            ],
        ];
    }

    /**
     * Get cost trends for the last 6 months
     */
    private function getCostTrends(Request $request): array
    {
        $trends = [];

        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $startDate = $date->copy()->startOfMonth()->format('Y-m-d');
            $endDate = $date->copy()->endOfMonth()->format('Y-m-d');

            $query = Shipment::whereBetween('shipment_date', [$startDate, $endDate]);

            if ($request->filled('vehicle_id')) {
                $query->where('vehicle_id', $request->vehicle_id);
            }

            $fuelCost = $query->sum('fuel_cost') ?? 0;
            $tollCost = $query->sum('toll_cost') ?? 0;
            $otherCosts = $query->sum('other_costs') ?? 0;

            $trends[] = [
                'month' => $date->format('M Y'),
                'fuel_cost' => $fuelCost,
                'toll_cost' => $tollCost,
                'other_costs' => $otherCosts,
                'total_cost' => $fuelCost + $tollCost + $otherCosts,
            ];
        }

        return $trends;
    }

    /**
     * Get top vehicles by cost
     */
    private function getTopVehiclesCosts(string $startDate, string $endDate, Request $request): array
    {
        $query = Shipment::with('vehicle')
            ->whereBetween('shipment_date', [$startDate, $endDate])
            ->whereNotNull('vehicle_id');

        if ($request->filled('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        $vehicleCosts = $query->get()
            ->groupBy('vehicle_id')
            ->map(function ($shipments) {
                $vehicle = $shipments->first()->vehicle;
                $totalFuel = $shipments->sum('fuel_cost');
                $totalToll = $shipments->sum('toll_cost');
                $totalOther = $shipments->sum('other_costs');
                $totalCost = $totalFuel + $totalToll + $totalOther;
                $totalDistance = $shipments->sum('actual_distance_km') ?: $shipments->sum('estimated_distance_km');
                $shipmentCount = $shipments->count();

                return [
                    'vehicle_id' => $vehicle->id,
                    'plate_number' => $vehicle->plate_number,
                    'make' => $vehicle->make,
                    'model' => $vehicle->model,
                    'total_cost' => $totalCost,
                    'fuel_cost' => $totalFuel,
                    'toll_cost' => $totalToll,
                    'other_costs' => $totalOther,
                    'total_distance' => $totalDistance,
                    'shipment_count' => $shipmentCount,
                    'avg_cost_per_km' => $totalDistance > 0 ? $totalCost / $totalDistance : 0,
                ];
            })
            ->sortByDesc('total_cost')
            ->take(10)
            ->values()
            ->toArray();

        return $vehicleCosts;
    }

    /**
     * Export cost report
     */
    public function export(Request $request)
    {
        // This would typically export to Excel/PDF
        // For now, return JSON data

        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->endOfMonth()->format('Y-m-d'));

        $stats = $this->getCostStatistics($startDate, $endDate, $request);
        $breakdown = $this->getCostBreakdown($startDate, $endDate, $request);

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'statistics' => $stats,
            'breakdown' => $breakdown,
        ]);
    }
}
