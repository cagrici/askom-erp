<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\CurrentAccount;
use App\Models\InventoryMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class AccountingMovementController extends Controller
{
    /**
     * Display accounting movements dashboard
     */
    public function index(Request $request): Response
    {
        $query = InventoryMovement::with([
            'inventoryItem', 
            'warehouse', 
            'creator'
        ]);

        // Filtering
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('movement_number', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%")
                  ->orWhere('document_number', 'like', "%{$search}%")
                  ->orWhere('partner_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }

        if ($request->filled('direction')) {
            $query->where('direction', $request->direction);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('movement_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('movement_date', '<=', $request->date_to);
        }

        // Sorting
        $sortField = $request->get('sort_field', 'movement_date');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $movements = $query->paginate(25)->withQueryString();
        
        // Transform the movements data to include computed attributes
        $movements->getCollection()->transform(function ($movement) {
            $movement->movement_type_text = $movement->getMovementTypeTextAttribute();
            $movement->direction_text = $movement->getDirectionTextAttribute();
            $movement->direction_color = $movement->getDirectionColorAttribute();
            $movement->status_color = $movement->getStatusColorAttribute();
            $movement->formatted_quantity = $movement->getFormattedQuantityAttribute();
            return $movement;
        });

        // Statistics
        $stats = [
            'total_movements' => InventoryMovement::count(),
            'today_movements' => InventoryMovement::whereDate('movement_date', today())->count(),
            'pending_movements' => InventoryMovement::where('status', 'pending')->count(),
            'completed_movements' => InventoryMovement::where('status', 'completed')->count(),
            'total_value' => InventoryMovement::where('status', 'completed')->sum('total_cost'),
            'incoming_movements' => InventoryMovement::where('direction', 'in')->whereDate('movement_date', today())->count(),
            'outgoing_movements' => InventoryMovement::where('direction', 'out')->whereDate('movement_date', today())->count(),
        ];

        // Recent activity
        $recentMovements = InventoryMovement::with(['inventoryItem', 'warehouse', 'creator'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Chart data for movements by direction
        $movementsByDirection = InventoryMovement::selectRaw('direction, COUNT(*) as count')
            ->groupBy('direction')
            ->pluck('count', 'direction')
            ->toArray();

        // Chart data for movements over time (last 30 days)
        $movementsOverTime = InventoryMovement::selectRaw('DATE(movement_date) as date, COUNT(*) as count')
            ->where('movement_date', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->pluck('count', 'date')
            ->toArray();

        // Ensure we have default values for charts
        $charts = [
            'movementsByDirection' => $movementsByDirection ?: [],
            'movementsOverTime' => $movementsOverTime ?: [],
        ];

        return Inertia::render('Accounting/Movements/Index', [
            'movements' => $movements,
            'stats' => $stats,
            'recentMovements' => $recentMovements,
            'charts' => $charts,
            'filters' => $request->all([
                'search', 'movement_type', 'direction', 'status', 
                'warehouse_id', 'date_from', 'date_to', 
                'sort_field', 'sort_direction'
            ]),
        ]);
    }

    /**
     * Display detailed movement view
     */
    public function show($id): Response
    {
        $movement = InventoryMovement::with([
            'inventoryItem', 
            'warehouse', 
            'warehouseLocation',
            'fromWarehouse',
            'toWarehouse',
            'fromLocation',
            'toLocation',
            'creator', 
            'updater',
            'approver'
        ])->findOrFail($id);

        return Inertia::render('Accounting/Movements/Show', [
            'movement' => $movement,
        ]);
    }

    /**
     * Get movement analytics
     */
    public function analytics(Request $request): Response
    {
        $period = $request->get('period', '30'); // days
        $startDate = Carbon::now()->subDays((int)$period);

        // Movement trends
        $movementTrends = InventoryMovement::selectRaw('
                DATE(movement_date) as date,
                SUM(CASE WHEN direction = "in" THEN quantity ELSE 0 END) as incoming,
                SUM(CASE WHEN direction = "out" THEN quantity ELSE 0 END) as outgoing,
                SUM(CASE WHEN direction = "transfer" THEN quantity ELSE 0 END) as transfers
            ')
            ->where('movement_date', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Value analysis
        $valueAnalysis = InventoryMovement::selectRaw('
                movement_type,
                COUNT(*) as count,
                SUM(total_cost) as total_value,
                AVG(total_cost) as avg_value
            ')
            ->where('movement_date', '>=', $startDate)
            ->where('status', 'completed')
            ->groupBy('movement_type')
            ->get();

        // Top warehouses by activity
        $warehouseActivity = InventoryMovement::selectRaw('
                warehouse_id,
                COUNT(*) as movement_count,
                SUM(total_cost) as total_value
            ')
            ->with('warehouse')
            ->where('movement_date', '>=', $startDate)
            ->groupBy('warehouse_id')
            ->orderBy('movement_count', 'desc')
            ->limit(10)
            ->get();

        // Movement status distribution
        $statusDistribution = InventoryMovement::selectRaw('status, COUNT(*) as count')
            ->where('movement_date', '>=', $startDate)
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return Inertia::render('Accounting/Movements/Analytics', [
            'period' => $period,
            'trends' => $movementTrends,
            'valueAnalysis' => $valueAnalysis,
            'warehouseActivity' => $warehouseActivity,
            'statusDistribution' => $statusDistribution,
        ]);
    }

    /**
     * Export movements
     */
    public function export(Request $request)
    {
        // TODO: Implement Excel/CSV export
        return redirect()->route('accounting.movements.index')
            ->with('info', 'Export özelliği yakında eklenecek.');
    }
}