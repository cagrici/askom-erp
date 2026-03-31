<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ProductReportController extends Controller
{
    /**
     * Display the product reports dashboard
     */
    public function index(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        $summary = $this->getSummaryStats();
        $salesByCategory = $this->getSalesByCategory($startDate, $endDate);
        $performanceTrend = $this->getPerformanceTrend($startDate, $endDate);
        $salesByBrand = $this->getSalesByBrand($startDate, $endDate);
        $lowPerformingProducts = $this->getLowPerformingProducts($startDate, $endDate);

        return Inertia::render('Reports/Products/Index', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'summary' => $summary,
            'salesByCategory' => $salesByCategory,
            'performanceTrend' => $performanceTrend,
            'salesByBrand' => $salesByBrand,
            'lowPerformingProducts' => $lowPerformingProducts,
        ]);
    }

    /**
     * Product performance report
     */
    public function performance(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'category_id' => 'nullable|integer',
            'brand_id' => 'nullable|integer',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        $query = SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->leftJoin('brands', 'products.brand_id', '=', 'brands.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft']);

        if ($request->category_id) {
            $query->where('products.category_id', $request->category_id);
        }

        if ($request->brand_id) {
            $query->where('products.brand_id', $request->brand_id);
        }

        $products = $query->select(
                'products.id',
                'products.code',
                'products.name',
                'categories.name as category_name',
                'brands.name as brand_name',
                DB::raw('SUM(sales_order_items.quantity) as total_quantity'),
                DB::raw('SUM(sales_order_items.line_total) as total_revenue'),
                DB::raw('COUNT(DISTINCT sales_orders.id) as order_count'),
                DB::raw('COUNT(DISTINCT sales_orders.customer_id) as customer_count'),
                DB::raw('AVG(sales_order_items.unit_price) as avg_price')
            )
            ->groupBy('products.id', 'products.code', 'products.name', 'categories.name', 'brands.name')
            ->orderByDesc('total_revenue')
            ->paginate(50);

        $topPerformers = $this->getTopPerformers($startDate, $endDate, 10);
        $worstPerformers = $this->getWorstPerformers($startDate, $endDate, 10);

        $categories = Category::orderBy('name')->get(['id', 'name']);
        $brands = Brand::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Reports/Products/ProductPerformance', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'category_id' => $request->category_id,
                'brand_id' => $request->brand_id,
            ],
            'products' => $products,
            'topPerformers' => $topPerformers,
            'worstPerformers' => $worstPerformers,
            'categories' => $categories,
            'brands' => $brands,
        ]);
    }

    /**
     * Product profitability report
     */
    public function profitability(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        $products = SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                'products.id',
                'products.code',
                'products.name',
                'products.cost_price',
                'categories.name as category_name',
                DB::raw('SUM(sales_order_items.quantity) as total_quantity'),
                DB::raw('SUM(sales_order_items.line_total) as total_revenue'),
                DB::raw('AVG(sales_order_items.unit_price) as avg_selling_price')
            )
            ->groupBy('products.id', 'products.code', 'products.name', 'products.cost_price', 'categories.name')
            ->orderByDesc('total_revenue')
            ->get()
            ->map(function ($product) {
                $cost = $product->cost_price ?? ($product->avg_selling_price * 0.7);
                $totalCost = $cost * $product->total_quantity;
                $profit = $product->total_revenue - $totalCost;
                $margin = $product->total_revenue > 0 ? ($profit / $product->total_revenue) * 100 : 0;

                return [
                    'id' => $product->id,
                    'code' => $product->code,
                    'name' => $product->name,
                    'category_name' => $product->category_name,
                    'total_quantity' => $product->total_quantity,
                    'total_revenue' => $product->total_revenue,
                    'total_cost' => $totalCost,
                    'profit' => $profit,
                    'margin' => round($margin, 2),
                    'avg_selling_price' => $product->avg_selling_price,
                    'cost_price' => $cost,
                ];
            });

        $marginDistribution = [
            ['range' => '< 0%', 'count' => $products->where('margin', '<', 0)->count()],
            ['range' => '0-10%', 'count' => $products->whereBetween('margin', [0, 10])->count()],
            ['range' => '10-20%', 'count' => $products->whereBetween('margin', [10, 20])->count()],
            ['range' => '20-30%', 'count' => $products->whereBetween('margin', [20, 30])->count()],
            ['range' => '30%+', 'count' => $products->where('margin', '>', 30)->count()],
        ];

        return Inertia::render('Reports/Products/ProductProfitability', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'products' => $products->take(100)->values(),
            'marginDistribution' => $marginDistribution,
            'summary' => [
                'total_revenue' => $products->sum('total_revenue') ?? 0,
                'total_cost' => $products->sum('total_cost') ?? 0,
                'total_profit' => $products->sum('profit') ?? 0,
                'avg_margin' => round($products->avg('margin') ?? 0, 2),
            ],
        ]);
    }

    /**
     * Product trends report
     */
    public function trends(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subMonths(6);

        $categoryTrends = SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                DB::raw("DATE_FORMAT(sales_orders.order_date, '%Y-%m') as month"),
                DB::raw('COALESCE(categories.name, "Kategorisiz") as category_name'),
                DB::raw('SUM(sales_order_items.line_total) as total_sales')
            )
            ->groupBy('month', 'category_name')
            ->orderBy('month')
            ->get()
            ->groupBy('category_name');

        $growingProducts = $this->getGrowingProducts($startDate, $endDate);
        $decliningProducts = $this->getDecliningProducts($startDate, $endDate);

        $newProducts = Product::query()
            ->leftJoin('sales_order_items', 'products.id', '=', 'sales_order_items.product_id')
            ->leftJoin('sales_orders', function ($join) use ($startDate, $endDate) {
                $join->on('sales_order_items.sales_order_id', '=', 'sales_orders.id')
                    ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
                    ->whereNotIn('sales_orders.status', ['cancelled', 'draft']);
            })
            ->where('products.created_at', '>=', $startDate)
            ->select(
                'products.id',
                'products.code',
                'products.name',
                'products.created_at',
                DB::raw('COALESCE(SUM(sales_order_items.line_total), 0) as total_sales'),
                DB::raw('COALESCE(SUM(sales_order_items.quantity), 0) as total_quantity')
            )
            ->groupBy('products.id', 'products.code', 'products.name', 'products.created_at')
            ->orderByDesc('total_sales')
            ->limit(20)
            ->get();

        return Inertia::render('Reports/Products/ProductTrends', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'categoryTrends' => $categoryTrends,
            'growingProducts' => $growingProducts,
            'decliningProducts' => $decliningProducts,
            'newProducts' => $newProducts,
        ]);
    }

    /**
     * Slow moving products report
     */
    public function slowMoving(Request $request)
    {
        $request->validate([
            'days' => 'nullable|integer|min:30|max:365',
        ]);

        $days = $request->days ?? 90;
        $cutoffDate = Carbon::now()->subDays($days);

        $noSalesProducts = Product::query()
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->leftJoin('brands', 'products.brand_id', '=', 'brands.id')
            ->where('products.is_active', true)
            ->whereNotExists(function ($query) use ($cutoffDate) {
                $query->select(DB::raw(1))
                    ->from('sales_order_items')
                    ->join('sales_orders', 'sales_order_items.sales_order_id', '=', 'sales_orders.id')
                    ->whereColumn('sales_order_items.product_id', 'products.id')
                    ->where('sales_orders.order_date', '>=', $cutoffDate)
                    ->whereNotIn('sales_orders.status', ['cancelled', 'draft']);
            })
            ->select(
                'products.id',
                'products.code',
                'products.name',
                'categories.name as category_name',
                'brands.name as brand_name',
                'products.cost_price',
                'products.sale_price',
                'products.stock_quantity'
            )
            ->limit(100)
            ->get();

        $lowTurnoverProducts = SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->where('sales_orders.order_date', '>=', $cutoffDate)
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                'products.id',
                'products.code',
                'products.name',
                'categories.name as category_name',
                DB::raw('SUM(sales_order_items.quantity) as total_quantity'),
                DB::raw('SUM(sales_order_items.line_total) as total_sales'),
                DB::raw('COUNT(DISTINCT sales_orders.id) as order_count')
            )
            ->groupBy('products.id', 'products.code', 'products.name', 'categories.name')
            ->having('order_count', '<=', 3)
            ->orderBy('total_sales')
            ->limit(50)
            ->get();

        $slowMovingValue = 0;
        foreach ($noSalesProducts as $product) {
            $stock = $product->stock_quantity ?? 0;
            $slowMovingValue += $stock * ($product->cost_price ?? 0);
        }

        return Inertia::render('Reports/Products/SlowMoving', [
            'filters' => ['days' => $days],
            'noSalesProducts' => $noSalesProducts,
            'lowTurnoverProducts' => $lowTurnoverProducts,
            'summary' => [
                'no_sales_count' => $noSalesProducts->count(),
                'low_turnover_count' => $lowTurnoverProducts->count(),
                'slow_moving_value' => $slowMovingValue,
            ],
        ]);
    }

    // Helper methods
    private function getSummaryStats()
    {
        $totalProducts = Product::count();
        $activeProducts = Product::where('is_active', true)->count();

        // Low stock: products where stock_quantity <= min_stock_level and stock > 0
        $lowStockCount = Product::where('is_active', true)
            ->whereNotNull('min_stock_level')
            ->where('min_stock_level', '>', 0)
            ->whereColumn('stock_quantity', '<=', 'min_stock_level')
            ->where('stock_quantity', '>', 0)
            ->count();

        // Out of stock: active products with zero or null stock
        $outOfStockCount = Product::where('is_active', true)
            ->where(function ($query) {
                $query->where('stock_quantity', '<=', 0)
                    ->orWhereNull('stock_quantity');
            })
            ->count();

        return [
            'total_products' => $totalProducts,
            'active_products' => $activeProducts,
            'low_stock' => $lowStockCount,
            'out_of_stock' => $outOfStockCount,
        ];
    }

    private function getSalesByCategory($startDate, $endDate)
    {
        return SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                DB::raw('COALESCE(categories.name, "Kategorisiz") as name'),
                DB::raw('SUM(sales_order_items.line_total) as value')
            )
            ->groupBy('name')
            ->orderByDesc('value')
            ->limit(8)
            ->get();
    }

    private function getPerformanceTrend($startDate, $endDate)
    {
        return SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                DB::raw("DATE_FORMAT(sales_orders.order_date, '%Y-%m') as month"),
                DB::raw('SUM(sales_order_items.line_total) as total_sales'),
                DB::raw('COUNT(DISTINCT sales_order_items.product_id) as product_count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();
    }

    private function getSalesByBrand($startDate, $endDate)
    {
        return SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->leftJoin('brands', 'products.brand_id', '=', 'brands.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                DB::raw('COALESCE(brands.name, "Markasız") as name'),
                DB::raw('SUM(sales_order_items.line_total) as value')
            )
            ->groupBy('name')
            ->orderByDesc('value')
            ->limit(10)
            ->get();
    }

    private function getLowPerformingProducts($startDate, $endDate, $limit = 10)
    {
        return SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                'products.code',
                'products.name',
                DB::raw('SUM(sales_order_items.line_total) as total_sales'),
                DB::raw('SUM(sales_order_items.quantity) as total_quantity')
            )
            ->groupBy('products.id', 'products.code', 'products.name')
            ->orderBy('total_sales')
            ->limit($limit)
            ->get();
    }

    private function getTopPerformers($startDate, $endDate, $limit)
    {
        return SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                'products.name',
                DB::raw('SUM(sales_order_items.line_total) as total_sales')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sales')
            ->limit($limit)
            ->get();
    }

    private function getWorstPerformers($startDate, $endDate, $limit)
    {
        return SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                'products.name',
                DB::raw('SUM(sales_order_items.line_total) as total_sales')
            )
            ->groupBy('products.id', 'products.name')
            ->orderBy('total_sales')
            ->limit($limit)
            ->get();
    }

    private function getGrowingProducts($startDate, $endDate)
    {
        $midDate = $startDate->copy()->addDays($startDate->diffInDays($endDate) / 2);

        $firstHalf = SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->whereBetween('sales_orders.order_date', [$startDate, $midDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select('sales_order_items.product_id', DB::raw('SUM(sales_order_items.line_total) as sales'))
            ->groupBy('sales_order_items.product_id')
            ->pluck('sales', 'product_id');

        $secondHalf = SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->whereBetween('sales_orders.order_date', [$midDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(sales_order_items.line_total) as second_half_sales')
            )
            ->groupBy('products.id', 'products.name')
            ->get()
            ->map(function ($product) use ($firstHalf) {
                $firstHalfSales = $firstHalf[$product->id] ?? 0;
                $growth = $firstHalfSales > 0
                    ? (($product->second_half_sales - $firstHalfSales) / $firstHalfSales) * 100
                    : ($product->second_half_sales > 0 ? 100 : 0);

                return [
                    'name' => $product->name,
                    'first_half_sales' => $firstHalfSales,
                    'second_half_sales' => $product->second_half_sales,
                    'growth' => round($growth, 2),
                ];
            })
            ->filter(fn($p) => $p['growth'] > 0)
            ->sortByDesc('growth')
            ->take(10)
            ->values();

        return $secondHalf;
    }

    private function getDecliningProducts($startDate, $endDate)
    {
        $midDate = $startDate->copy()->addDays($startDate->diffInDays($endDate) / 2);

        $firstHalf = SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $midDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(sales_order_items.line_total) as first_half_sales')
            )
            ->groupBy('products.id', 'products.name')
            ->get();

        $secondHalf = SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->whereBetween('sales_orders.order_date', [$midDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select('sales_order_items.product_id', DB::raw('SUM(sales_order_items.line_total) as sales'))
            ->groupBy('sales_order_items.product_id')
            ->pluck('sales', 'product_id');

        return $firstHalf->map(function ($product) use ($secondHalf) {
            $secondHalfSales = $secondHalf[$product->id] ?? 0;
            $decline = $product->first_half_sales > 0
                ? (($secondHalfSales - $product->first_half_sales) / $product->first_half_sales) * 100
                : 0;

            return [
                'name' => $product->name,
                'first_half_sales' => $product->first_half_sales,
                'second_half_sales' => $secondHalfSales,
                'decline' => round($decline, 2),
            ];
        })
        ->filter(fn($p) => $p['decline'] < 0)
        ->sortBy('decline')
        ->take(10)
        ->values();
    }
}
