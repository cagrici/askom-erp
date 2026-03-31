<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Services\SalesAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class SalesAnalyticsController extends Controller
{
    protected SalesAnalyticsService $analyticsService;

    public function __construct(SalesAnalyticsService $analyticsService)
    {
        $this->middleware('auth');
        $this->analyticsService = $analyticsService;
    }

    /**
     * Display sales analytics dashboard
     */
    public function index(Request $request): Response
    {
        Gate::authorize('view-sales-analytics');

        $filters = $this->validateFilters($request);

        // Get overview data
        $overview = $this->analyticsService->getSalesOverview($filters);
        
        // Get sales trend for charts
        $salesTrend = $this->analyticsService->getSalesTrend($filters);
        
        // Get top customers and products
        $topCustomers = $this->analyticsService->getTopCustomers(array_merge($filters, ['limit' => 5]));
        $topProducts = $this->analyticsService->getTopProducts(array_merge($filters, ['limit' => 5]));
        
        // Get order status distribution
        $statusDistribution = $this->analyticsService->getOrderStatusDistribution($filters);
        
        // Calculate percentages for status distribution
        $totalOrders = collect($statusDistribution)->sum('count');
        $statusDistribution = collect($statusDistribution)->map(function ($item) use ($totalOrders) {
            $item['percentage'] = $totalOrders > 0 ? round(($item['count'] / $totalOrders) * 100, 1) : 0;
            return $item;
        })->toArray();

        return Inertia::render('Sales/Analytics/Index', [
            'overview' => $overview,
            'salesTrend' => $salesTrend,
            'topCustomers' => $topCustomers,
            'topProducts' => $topProducts,
            'statusDistribution' => $statusDistribution,
            'filters' => $filters,
            'userPermissions' => [
                'canExport' => Gate::allows('export-sales-data'),
            ]
        ]);
    }

    /**
     * Get sales overview data (AJAX)
     */
    public function getOverview(Request $request): JsonResponse
    {
        Gate::authorize('view-sales-analytics');

        $filters = $this->validateFilters($request);
        $overview = $this->analyticsService->getSalesOverview($filters);

        return response()->json($overview);
    }

    /**
     * Get sales trend data (AJAX)
     */
    public function getTrend(Request $request): JsonResponse
    {
        Gate::authorize('view-sales-analytics');

        $filters = $this->validateFilters($request);
        $trend = $this->analyticsService->getSalesTrend($filters);

        return response()->json($trend);
    }

    /**
     * Get top customers data (AJAX)
     */
    public function getTopCustomers(Request $request): JsonResponse
    {
        Gate::authorize('view-sales-analytics');

        $filters = $this->validateFilters($request);
        $customers = $this->analyticsService->getTopCustomers($filters);

        return response()->json($customers);
    }

    /**
     * Get top products data (AJAX)
     */
    public function getTopProducts(Request $request): JsonResponse
    {
        Gate::authorize('view-sales-analytics');

        $filters = $this->validateFilters($request);
        $products = $this->analyticsService->getTopProducts($filters);

        return response()->json($products);
    }

    /**
     * Get salesperson performance data (AJAX)
     */
    public function getSalespersonPerformance(Request $request): JsonResponse
    {
        Gate::authorize('view-sales-analytics');

        $filters = $this->validateFilters($request);
        $performance = $this->analyticsService->getSalespersonPerformance($filters);

        return response()->json($performance);
    }

    /**
     * Get order status distribution (AJAX)
     */
    public function getStatusDistribution(Request $request): JsonResponse
    {
        Gate::authorize('view-sales-analytics');

        $filters = $this->validateFilters($request);
        $distribution = $this->analyticsService->getOrderStatusDistribution($filters);

        // Calculate percentages
        $totalOrders = collect($distribution)->sum('count');
        $distribution = collect($distribution)->map(function ($item) use ($totalOrders) {
            $item['percentage'] = $totalOrders > 0 ? round(($item['count'] / $totalOrders) * 100, 1) : 0;
            return $item;
        })->toArray();

        return response()->json($distribution);
    }

    /**
     * Get revenue by currency (AJAX)
     */
    public function getRevenueByCurrency(Request $request): JsonResponse
    {
        Gate::authorize('view-sales-analytics');

        $filters = $this->validateFilters($request);
        $revenue = $this->analyticsService->getRevenueByCurrency($filters);

        return response()->json($revenue);
    }

    /**
     * Get monthly sales comparison (AJAX)
     */
    public function getMonthlySalesComparison(Request $request): JsonResponse
    {
        Gate::authorize('view-sales-analytics');

        $year = $request->get('year', Carbon::now()->year);
        $comparison = $this->analyticsService->getMonthlySalesComparison($year);

        return response()->json($comparison);
    }

    /**
     * Export sales data
     */
    public function export(Request $request): JsonResponse
    {
        Gate::authorize('export-sales-data');

        $validated = $request->validate([
            'type' => 'required|in:sales_summary,customer_analysis,product_analysis,salesperson_performance',
            'format' => 'required|in:csv,excel,pdf',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'customer_id' => 'nullable|exists:current_accounts,id',
            'salesperson_id' => 'nullable|exists:users,id',
        ]);

        try {
            $filters = [
                'date_from' => $validated['date_from'] ?? Carbon::now()->startOfMonth(),
                'date_to' => $validated['date_to'] ?? Carbon::now()->endOfMonth(),
            ];

            if (!empty($validated['customer_id'])) {
                $filters['customer_id'] = $validated['customer_id'];
            }

            if (!empty($validated['salesperson_id'])) {
                $filters['salesperson_id'] = $validated['salesperson_id'];
            }

            $data = $this->analyticsService->getExportData($validated['type'], $filters);

            // For now, return the data as JSON
            // In a real implementation, you would generate actual files
            return response()->json([
                'success' => true,
                'message' => 'Export data generated successfully',
                'data' => $data,
                'type' => $validated['type'],
                'format' => $validated['format'],
                'filters' => $filters
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Export failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate and prepare filters from request
     */
    private function validateFilters(Request $request): array
    {
        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'customer_id' => 'nullable|exists:current_accounts,id',
            'salesperson_id' => 'nullable|exists:users,id',
            'status' => 'nullable|array',
            'status.*' => 'string',
            'group_by' => 'nullable|in:day,week,month',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        // Set default dates if not provided
        if (empty($validated['date_from'])) {
            $validated['date_from'] = Carbon::now()->startOfMonth();
        }

        if (empty($validated['date_to'])) {
            $validated['date_to'] = Carbon::now()->endOfMonth();
        }

        // Remove empty values
        return array_filter($validated, function ($value) {
            return !is_null($value) && $value !== '';
        });
    }
}