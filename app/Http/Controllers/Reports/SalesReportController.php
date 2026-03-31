<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\SalesOrder;
use App\Models\SalesReturn;
use App\Models\CurrentAccount;
use App\Models\SalesRepresentative;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class SalesReportController extends Controller
{
    /**
     * Display the sales reports dashboard
     */
    public function index(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        // Summary statistics
        $summary = $this->getSummaryStats($startDate, $endDate);

        // Monthly trend data
        $monthlyTrend = $this->getMonthlyTrend($startDate, $endDate);

        // Top 10 products
        $topProducts = $this->getTopProducts($startDate, $endDate);

        // Sales by channel/category
        $salesByCategory = $this->getSalesByCategory($startDate, $endDate);

        // Recent orders
        $recentOrders = $this->getRecentOrders(10);

        return Inertia::render('Reports/Sales/Index', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'summary' => $summary,
            'monthlyTrend' => $monthlyTrend,
            'topProducts' => $topProducts,
            'salesByCategory' => $salesByCategory,
            'recentOrders' => $recentOrders,
        ]);
    }

    /**
     * Sales by product report
     */
    public function byProduct(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'category_id' => 'nullable|integer',
            'brand_id' => 'nullable|integer',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        // Get products from sales orders instead of invoice details for now
        $products = SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->leftJoin('brands', 'products.brand_id', '=', 'brands.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft']);

        if ($request->category_id) {
            $products->where('products.category_id', $request->category_id);
        }

        if ($request->brand_id) {
            $products->where('products.brand_id', $request->brand_id);
        }

        $products = $products->select(
                'products.id',
                'products.code',
                'products.name',
                'categories.name as category_name',
                'brands.name as brand_name',
                DB::raw('SUM(sales_order_items.quantity) as total_quantity'),
                DB::raw('SUM(sales_order_items.line_total) as total_amount'),
                DB::raw('COUNT(DISTINCT sales_orders.id) as order_count'),
                DB::raw('AVG(sales_order_items.unit_price) as avg_price')
            )
            ->groupBy('products.id', 'products.code', 'products.name', 'categories.name', 'brands.name')
            ->orderByDesc('total_amount')
            ->paginate(50);

        // Category breakdown for chart
        $categoryBreakdown = SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                DB::raw('COALESCE(categories.name, "Kategorisiz") as category_name'),
                DB::raw('SUM(sales_order_items.line_total) as total_amount')
            )
            ->groupBy('category_name')
            ->orderByDesc('total_amount')
            ->limit(10)
            ->get();

        return Inertia::render('Reports/Sales/SalesByProduct', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'category_id' => $request->category_id,
                'brand_id' => $request->brand_id,
            ],
            'products' => $products,
            'categoryBreakdown' => $categoryBreakdown,
        ]);
    }

    /**
     * Sales by customer report
     */
    public function byCustomer(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        $customers = SalesOrder::query()
            ->join('current_accounts', 'sales_orders.customer_id', '=', 'current_accounts.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                'current_accounts.id',
                'current_accounts.title',
                'current_accounts.account_code',
                DB::raw('SUM(sales_orders.total_amount) as total_sales'),
                DB::raw('COUNT(sales_orders.id) as order_count'),
                DB::raw('AVG(sales_orders.total_amount) as avg_order_value'),
                DB::raw('MAX(sales_orders.order_date) as last_order_date')
            )
            ->groupBy('current_accounts.id', 'current_accounts.title', 'current_accounts.account_code')
            ->orderByDesc('total_sales')
            ->paginate(50);

        // Top 10 customers for chart
        $topCustomers = SalesOrder::query()
            ->join('current_accounts', 'sales_orders.customer_id', '=', 'current_accounts.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                'current_accounts.title',
                DB::raw('SUM(sales_orders.total_amount) as total_sales')
            )
            ->groupBy('current_accounts.id', 'current_accounts.title')
            ->orderByDesc('total_sales')
            ->limit(10)
            ->get();

        return Inertia::render('Reports/Sales/SalesByCustomer', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'customers' => $customers,
            'topCustomers' => $topCustomers,
        ]);
    }

    /**
     * Sales by salesperson report
     */
    public function bySalesperson(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        $salespeople = SalesOrder::query()
            ->leftJoin('sales_representatives', 'sales_orders.salesperson_id', '=', 'sales_representatives.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                'sales_representatives.id',
                DB::raw("CONCAT(COALESCE(sales_representatives.first_name, ''), ' ', COALESCE(sales_representatives.last_name, '')) as name"),
                DB::raw('SUM(sales_orders.total_amount) as total_sales'),
                DB::raw('COUNT(sales_orders.id) as order_count'),
                DB::raw('COUNT(DISTINCT sales_orders.customer_id) as customer_count'),
                DB::raw('AVG(sales_orders.total_amount) as avg_order_value')
            )
            ->groupBy('sales_representatives.id', 'sales_representatives.first_name', 'sales_representatives.last_name')
            ->orderByDesc('total_sales')
            ->get();

        // Monthly performance
        $monthlyPerformance = SalesOrder::query()
            ->leftJoin('sales_representatives', 'sales_orders.salesperson_id', '=', 'sales_representatives.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                DB::raw("CONCAT(COALESCE(sales_representatives.first_name, ''), ' ', COALESCE(sales_representatives.last_name, '')) as name"),
                DB::raw("DATE_FORMAT(sales_orders.order_date, '%Y-%m') as month"),
                DB::raw('SUM(sales_orders.total_amount) as total_sales')
            )
            ->groupBy('sales_representatives.id', 'sales_representatives.first_name', 'sales_representatives.last_name', 'month')
            ->orderBy('month')
            ->get()
            ->groupBy('name');

        return Inertia::render('Reports/Sales/SalesBySalesperson', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'salespeople' => $salespeople,
            'monthlyPerformance' => $monthlyPerformance,
        ]);
    }

    /**
     * Sales by region report
     */
    public function byRegion(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        $regions = SalesOrder::query()
            ->join('current_accounts', 'sales_orders.customer_id', '=', 'current_accounts.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                DB::raw('COALESCE(current_accounts.city, "Belirtilmemiş") as region'),
                DB::raw('SUM(sales_orders.total_amount) as total_sales'),
                DB::raw('COUNT(sales_orders.id) as order_count'),
                DB::raw('COUNT(DISTINCT sales_orders.customer_id) as customer_count')
            )
            ->groupBy('current_accounts.city')
            ->orderByDesc('total_sales')
            ->get();

        return Inertia::render('Reports/Sales/SalesByRegion', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'regions' => $regions,
        ]);
    }

    // Helper methods
    private function getSummaryStats($startDate, $endDate)
    {
        $totalSales = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->sum('total_amount');

        $orderCount = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->count();

        $avgOrderValue = $orderCount > 0 ? $totalSales / $orderCount : 0;

        $returnAmount = SalesReturn::whereBetween('return_date', [$startDate, $endDate])
            ->sum('total_amount') ?? 0;

        $returnRate = $totalSales > 0 ? ($returnAmount / $totalSales) * 100 : 0;

        return [
            'total_sales' => $totalSales ?? 0,
            'order_count' => $orderCount ?? 0,
            'avg_order_value' => $avgOrderValue ?? 0,
            'return_rate' => round($returnRate, 2),
        ];
    }

    private function getMonthlyTrend($startDate, $endDate)
    {
        return SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->select(
                DB::raw("DATE_FORMAT(order_date, '%Y-%m') as month"),
                DB::raw('SUM(total_amount) as total_sales'),
                DB::raw('COUNT(id) as order_count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();
    }

    private function getTopProducts($startDate, $endDate, $limit = 10)
    {
        return SalesOrder::query()
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                'products.name',
                DB::raw('SUM(sales_order_items.line_total) as total_amount')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_amount')
            ->limit($limit)
            ->get();
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
                DB::raw('COALESCE(categories.name, "Kategorisiz") as category_name'),
                DB::raw('SUM(sales_order_items.line_total) as total_amount')
            )
            ->groupBy('category_name')
            ->orderByDesc('total_amount')
            ->limit(8)
            ->get();
    }

    private function getRecentOrders($limit = 10)
    {
        return SalesOrder::with(['customer:id,title,account_code'])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->orderByDesc('order_date')
            ->limit($limit)
            ->select('id', 'order_number', 'order_date', 'customer_id', 'total_amount', 'status')
            ->get();
    }
}
