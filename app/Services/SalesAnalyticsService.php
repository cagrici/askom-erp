<?php

namespace App\Services;

use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\CurrentAccount;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SalesAnalyticsService
{
    /**
     * Get sales overview statistics
     */
    public function getSalesOverview(array $filters = []): array
    {
        $dateFrom = $filters['date_from'] ?? Carbon::now()->startOfMonth();
        $dateTo = $filters['date_to'] ?? Carbon::now()->endOfMonth();
        
        // Previous period for comparison
        $previousDateFrom = Carbon::parse($dateFrom)->subDays(Carbon::parse($dateTo)->diffInDays(Carbon::parse($dateFrom)));
        $previousDateTo = Carbon::parse($dateFrom)->subDay();

        // Current period stats
        $currentStats = $this->getBasicStats($dateFrom, $dateTo, $filters);
        
        // Previous period stats
        $previousStats = $this->getBasicStats($previousDateFrom, $previousDateTo, $filters);

        return [
            'current_period' => $currentStats,
            'previous_period' => $previousStats,
            'growth' => $this->calculateGrowth($currentStats, $previousStats),
            'period_info' => [
                'current' => [
                    'from' => Carbon::parse($dateFrom)->format('Y-m-d'),
                    'to' => Carbon::parse($dateTo)->format('Y-m-d'),
                    'days' => Carbon::parse($dateTo)->diffInDays(Carbon::parse($dateFrom)) + 1
                ],
                'previous' => [
                    'from' => $previousDateFrom->format('Y-m-d'),
                    'to' => $previousDateTo->format('Y-m-d'),
                    'days' => $previousDateTo->diffInDays($previousDateFrom) + 1
                ]
            ]
        ];
    }

    /**
     * Get basic sales statistics for a period
     */
    private function getBasicStats($dateFrom, $dateTo, array $filters = []): array
    {
        $query = SalesOrder::whereBetween('order_date', [$dateFrom, $dateTo]);
        
        // Apply additional filters
        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }
        
        if (!empty($filters['salesperson_id'])) {
            $query->where('salesperson_id', $filters['salesperson_id']);
        }
        
        if (!empty($filters['status'])) {
            $query->whereIn('status', (array) $filters['status']);
        }

        $orders = $query->get();

        return [
            'total_orders' => $orders->count(),
            'total_revenue' => $orders->sum('total_amount'),
            'total_items' => $orders->sum(function($order) { 
                return $order->items()->sum('quantity'); 
            }),
            'average_order_value' => $orders->count() > 0 ? $orders->sum('total_amount') / $orders->count() : 0,
            'confirmed_orders' => $orders->where('status', 'confirmed')->count(),
            'shipped_orders' => $orders->where('status', 'shipped')->count(),
            'delivered_orders' => $orders->where('status', 'delivered')->count(),
            'cancelled_orders' => $orders->where('status', 'cancelled')->count(),
        ];
    }

    /**
     * Calculate growth percentages
     */
    private function calculateGrowth(array $current, array $previous): array
    {
        $growth = [];
        
        foreach ($current as $key => $value) {
            if (isset($previous[$key]) && $previous[$key] > 0) {
                $growth[$key] = (($value - $previous[$key]) / $previous[$key]) * 100;
            } else {
                $growth[$key] = $value > 0 ? 100 : 0;
            }
        }

        return $growth;
    }

    /**
     * Get sales trend data for charts
     */
    public function getSalesTrend(array $filters = []): array
    {
        $dateFrom = $filters['date_from'] ?? Carbon::now()->subDays(30);
        $dateTo = $filters['date_to'] ?? Carbon::now();
        $groupBy = $filters['group_by'] ?? 'day'; // day, week, month

        $query = SalesOrder::whereBetween('order_date', [$dateFrom, $dateTo]);
        
        // Apply filters
        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }
        
        if (!empty($filters['salesperson_id'])) {
            $query->where('salesperson_id', $filters['salesperson_id']);
        }

        $dateFormat = match($groupBy) {
            'week' => '%Y-%u',
            'month' => '%Y-%m',
            default => '%Y-%m-%d'
        };

        $results = $query->select(
            DB::raw("DATE_FORMAT(order_date, '{$dateFormat}') as period"),
            DB::raw('COUNT(*) as order_count'),
            DB::raw('SUM(total_amount) as total_revenue'),
            DB::raw('AVG(total_amount) as avg_order_value')
        )
        ->groupBy('period')
        ->orderBy('period')
        ->get();

        return $results->map(function ($item) use ($groupBy) {
            return [
                'period' => $item->period,
                'period_label' => $this->formatPeriodLabel($item->period, $groupBy),
                'order_count' => (int) $item->order_count,
                'total_revenue' => (float) $item->total_revenue,
                'avg_order_value' => (float) $item->avg_order_value,
            ];
        })->toArray();
    }

    /**
     * Format period label for display
     */
    private function formatPeriodLabel(string $period, string $groupBy): string
    {
        switch ($groupBy) {
            case 'week':
                [$year, $week] = explode('-', $period);
                return "Hafta {$week}, {$year}";
            case 'month':
                [$year, $month] = explode('-', $period);
                return Carbon::createFromFormat('Y-m', $period)->format('F Y');
            default:
                return Carbon::createFromFormat('Y-m-d', $period)->format('d M Y');
        }
    }

    /**
     * Get top customers analysis
     */
    public function getTopCustomers(array $filters = []): array
    {
        $dateFrom = $filters['date_from'] ?? Carbon::now()->startOfMonth();
        $dateTo = $filters['date_to'] ?? Carbon::now()->endOfMonth();
        $limit = $filters['limit'] ?? 10;

        $results = CurrentAccount::select([
            'current_accounts.id',
            'current_accounts.title',
            'current_accounts.account_code',
            DB::raw('COUNT(sales_orders.id) as order_count'),
            DB::raw('SUM(sales_orders.total_amount) as total_revenue'),
            DB::raw('AVG(sales_orders.total_amount) as avg_order_value'),
            DB::raw('MAX(sales_orders.order_date) as last_order_date')
        ])
        ->join('sales_orders', 'current_accounts.id', '=', 'sales_orders.customer_id')
        ->whereBetween('sales_orders.order_date', [$dateFrom, $dateTo])
        ->where('current_accounts.account_type', 'customer')
        ->groupBy('current_accounts.id', 'current_accounts.title', 'current_accounts.account_code')
        ->orderBy('total_revenue', 'desc')
        ->limit($limit)
        ->get();

        return $results->map(function ($customer) {
            return [
                'id' => $customer->id,
                'title' => $customer->title,
                'account_code' => $customer->account_code,
                'order_count' => (int) $customer->order_count,
                'total_revenue' => (float) $customer->total_revenue,
                'avg_order_value' => (float) $customer->avg_order_value,
                'last_order_date' => $customer->last_order_date,
            ];
        })->toArray();
    }

    /**
     * Get top products analysis
     */
    public function getTopProducts(array $filters = []): array
    {
        $dateFrom = $filters['date_from'] ?? Carbon::now()->startOfMonth();
        $dateTo = $filters['date_to'] ?? Carbon::now()->endOfMonth();
        $limit = $filters['limit'] ?? 10;

        $query = Product::select([
            'products.id',
            'products.code',
            'products.name',
            'categories.name as category_name',
            'brands.name as brand_name',
            DB::raw('SUM(sales_order_items.quantity) as total_quantity'),
            DB::raw('SUM(sales_order_items.line_total) as total_revenue'),
            DB::raw('COUNT(DISTINCT sales_order_items.sales_order_id) as order_count'),
            DB::raw('AVG(sales_order_items.unit_price) as avg_unit_price')
        ])
        ->join('sales_order_items', 'products.id', '=', 'sales_order_items.product_id')
        ->join('sales_orders', 'sales_order_items.sales_order_id', '=', 'sales_orders.id')
        ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
        ->leftJoin('brands', 'products.brand_id', '=', 'brands.id')
        ->whereBetween('sales_orders.order_date', [$dateFrom, $dateTo]);

        // Add customer filter if specified
        if (!empty($filters['customer_id'])) {
            $query->where('sales_orders.customer_id', $filters['customer_id']);
        }

        $results = $query->groupBy([
            'products.id', 'products.code', 'products.name', 
            'categories.name', 'brands.name'
        ])
        ->orderBy('order_count', 'desc') // Order by frequency for frequent products
        ->limit($limit)
        ->get();

        return $results->map(function ($product) {
            return [
                'id' => $product->id,
                'code' => $product->code,
                'name' => $product->name,
                'category_name' => $product->category_name,
                'brand_name' => $product->brand_name,
                'total_quantity' => (float) $product->total_quantity,
                'total_revenue' => (float) $product->total_revenue,
                'order_count' => (int) $product->order_count,
                'avg_unit_price' => (float) $product->avg_unit_price,
            ];
        })->toArray();
    }

    /**
     * Get sales performance by salesperson
     */
    public function getSalespersonPerformance(array $filters = []): array
    {
        $dateFrom = $filters['date_from'] ?? Carbon::now()->startOfMonth();
        $dateTo = $filters['date_to'] ?? Carbon::now()->endOfMonth();

        $results = User::select([
            'users.id',
            'users.name',
            'users.email',
            DB::raw('COUNT(sales_orders.id) as order_count'),
            DB::raw('SUM(sales_orders.total_amount) as total_revenue'),
            DB::raw('AVG(sales_orders.total_amount) as avg_order_value'),
            DB::raw('COUNT(DISTINCT sales_orders.customer_id) as unique_customers')
        ])
        ->join('sales_orders', 'users.id', '=', 'sales_orders.salesperson_id')
        ->whereBetween('sales_orders.order_date', [$dateFrom, $dateTo])
        ->groupBy('users.id', 'users.name', 'users.email')
        ->orderBy('total_revenue', 'desc')
        ->get();

        return $results->map(function ($salesperson) {
            return [
                'id' => $salesperson->id,
                'name' => $salesperson->name,
                'email' => $salesperson->email,
                'order_count' => (int) $salesperson->order_count,
                'total_revenue' => (float) $salesperson->total_revenue,
                'avg_order_value' => (float) $salesperson->avg_order_value,
                'unique_customers' => (int) $salesperson->unique_customers,
            ];
        })->toArray();
    }

    /**
     * Get order status distribution
     */
    public function getOrderStatusDistribution(array $filters = []): array
    {
        $dateFrom = $filters['date_from'] ?? Carbon::now()->startOfMonth();
        $dateTo = $filters['date_to'] ?? Carbon::now()->endOfMonth();

        $query = SalesOrder::whereBetween('order_date', [$dateFrom, $dateTo]);
        
        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        $results = $query->select([
            'status',
            DB::raw('COUNT(*) as count'),
            DB::raw('SUM(total_amount) as total_amount')
        ])
        ->groupBy('status')
        ->get();

        $statuses = SalesOrder::getStatuses();

        return $results->map(function ($item) use ($statuses) {
            return [
                'status' => $item->status,
                'status_label' => $statuses[$item->status] ?? $item->status,
                'count' => (int) $item->count,
                'total_amount' => (float) $item->total_amount,
                'percentage' => 0, // Will be calculated in controller
            ];
        })->toArray();
    }

    /**
     * Get revenue by currency
     */
    public function getRevenueByCurrency(array $filters = []): array
    {
        $dateFrom = $filters['date_from'] ?? Carbon::now()->startOfMonth();
        $dateTo = $filters['date_to'] ?? Carbon::now()->endOfMonth();

        $results = SalesOrder::select([
            'currency',
            DB::raw('COUNT(*) as order_count'),
            DB::raw('SUM(total_amount) as total_amount'),
            DB::raw('AVG(exchange_rate) as avg_exchange_rate')
        ])
        ->whereBetween('order_date', [$dateFrom, $dateTo])
        ->groupBy('currency')
        ->orderBy('total_amount', 'desc')
        ->get();

        return $results->map(function ($item) {
            return [
                'currency' => $item->currency,
                'order_count' => (int) $item->order_count,
                'total_amount' => (float) $item->total_amount,
                'avg_exchange_rate' => (float) $item->avg_exchange_rate,
            ];
        })->toArray();
    }

    /**
     * Get monthly sales comparison
     */
    public function getMonthlySalesComparison(int $year = null): array
    {
        $year = $year ?? Carbon::now()->year;
        $previousYear = $year - 1;

        $currentYearData = SalesOrder::select([
            DB::raw('MONTH(order_date) as month'),
            DB::raw('COUNT(*) as order_count'),
            DB::raw('SUM(total_amount) as total_revenue')
        ])
        ->whereYear('order_date', $year)
        ->groupBy(DB::raw('MONTH(order_date)'))
        ->get()
        ->keyBy('month');

        $previousYearData = SalesOrder::select([
            DB::raw('MONTH(order_date) as month'),
            DB::raw('COUNT(*) as order_count'),
            DB::raw('SUM(total_amount) as total_revenue')
        ])
        ->whereYear('order_date', $previousYear)
        ->groupBy(DB::raw('MONTH(order_date)'))
        ->get()
        ->keyBy('month');

        $comparison = [];
        for ($month = 1; $month <= 12; $month++) {
            $current = $currentYearData->get($month);
            $previous = $previousYearData->get($month);

            $comparison[] = [
                'month' => $month,
                'month_name' => Carbon::create($year, $month, 1)->format('F'),
                'current_year' => [
                    'order_count' => $current ? (int) $current->order_count : 0,
                    'total_revenue' => $current ? (float) $current->total_revenue : 0,
                ],
                'previous_year' => [
                    'order_count' => $previous ? (int) $previous->order_count : 0,
                    'total_revenue' => $previous ? (float) $previous->total_revenue : 0,
                ],
            ];
        }

        return $comparison;
    }

    /**
     * Get export data for reports
     */
    public function getExportData(string $type, array $filters = []): array
    {
        switch ($type) {
            case 'sales_summary':
                return $this->getSalesSummaryExport($filters);
            case 'customer_analysis':
                return $this->getCustomerAnalysisExport($filters);
            case 'product_analysis':
                return $this->getProductAnalysisExport($filters);
            case 'salesperson_performance':
                return $this->getSalespersonPerformanceExport($filters);
            default:
                throw new \InvalidArgumentException("Unknown export type: {$type}");
        }
    }

    /**
     * Get sales summary export data
     */
    private function getSalesSummaryExport(array $filters = []): array
    {
        $dateFrom = $filters['date_from'] ?? Carbon::now()->startOfMonth();
        $dateTo = $filters['date_to'] ?? Carbon::now()->endOfMonth();

        return SalesOrder::with(['customer', 'salesperson'])
            ->whereBetween('order_date', [$dateFrom, $dateTo])
            ->get()
            ->map(function ($order) {
                return [
                    'Sipariş No' => $order->order_number,
                    'Tarih' => $order->order_date->format('d.m.Y'),
                    'Müşteri' => $order->customer->title,
                    'Satış Temsilcisi' => $order->salesperson->name ?? '-',
                    'Durum' => $order->status_label,
                    'Para Birimi' => $order->currency,
                    'Toplam Tutar' => $order->total_amount,
                    'Öncelik' => $order->priority_label,
                ];
            })
            ->toArray();
    }

    /**
     * Get customer analysis export data
     */
    private function getCustomerAnalysisExport(array $filters = []): array
    {
        return $this->getTopCustomers(array_merge($filters, ['limit' => 1000]));
    }

    /**
     * Get product analysis export data
     */
    private function getProductAnalysisExport(array $filters = []): array
    {
        return $this->getTopProducts(array_merge($filters, ['limit' => 1000]));
    }

    /**
     * Get salesperson performance export data
     */
    private function getSalespersonPerformanceExport(array $filters = []): array
    {
        return $this->getSalespersonPerformance($filters);
    }
}