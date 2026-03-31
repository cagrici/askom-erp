<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Models\CurrentAccount;
use App\Models\Lead;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class CustomerReportController extends Controller
{
    /**
     * Display the customer reports dashboard
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

        // Customer segmentation
        $segmentation = $this->getCustomerSegmentation();

        // Customer growth trend
        $growthTrend = $this->getCustomerGrowthTrend($startDate, $endDate);

        // Top 10 customers
        $topCustomers = $this->getTopCustomers($startDate, $endDate);

        // At-risk customers
        $atRiskCustomers = $this->getAtRiskCustomers(10);

        return Inertia::render('Reports/Customers/Index', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'summary' => $summary,
            'segmentation' => $segmentation,
            'growthTrend' => $growthTrend,
            'topCustomers' => $topCustomers,
            'atRiskCustomers' => $atRiskCustomers,
        ]);
    }

    /**
     * Customer segmentation report (ABC Analysis)
     */
    public function segmentation(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        // Get all customers with sales data
        $customers = SalesOrder::query()
            ->join('current_accounts', 'sales_orders.customer_id', '=', 'current_accounts.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                'current_accounts.id',
                'current_accounts.account_code',
                'current_accounts.title',
                DB::raw('SUM(sales_orders.total_amount) as total_sales'),
                DB::raw('COUNT(sales_orders.id) as order_count')
            )
            ->groupBy('current_accounts.id', 'current_accounts.account_code', 'current_accounts.title')
            ->orderByDesc('total_sales')
            ->get();

        // Calculate ABC segments
        $totalSales = $customers->sum('total_sales');
        $runningTotal = 0;

        $segmentedCustomers = $customers->map(function ($customer) use ($totalSales, &$runningTotal) {
            if ($totalSales == 0) {
                return [
                    'id' => $customer->id,
                    'account_code' => $customer->account_code,
                    'title' => $customer->title,
                    'total_sales' => 0,
                    'order_count' => $customer->order_count,
                    'percentage' => 0,
                    'cumulative_percentage' => 0,
                    'segment' => 'C',
                ];
            }

            $runningTotal += $customer->total_sales;
            $cumulativePercentage = ($runningTotal / $totalSales) * 100;

            if ($cumulativePercentage <= 80) {
                $segment = 'A';
            } elseif ($cumulativePercentage <= 95) {
                $segment = 'B';
            } else {
                $segment = 'C';
            }

            return [
                'id' => $customer->id,
                'account_code' => $customer->account_code,
                'title' => $customer->title,
                'total_sales' => $customer->total_sales,
                'order_count' => $customer->order_count,
                'percentage' => round(($customer->total_sales / $totalSales) * 100, 2),
                'cumulative_percentage' => round($cumulativePercentage, 2),
                'segment' => $segment,
            ];
        });

        // Segment summary
        $segmentSummary = [
            'A' => [
                'count' => $segmentedCustomers->where('segment', 'A')->count(),
                'total_sales' => $segmentedCustomers->where('segment', 'A')->sum('total_sales'),
            ],
            'B' => [
                'count' => $segmentedCustomers->where('segment', 'B')->count(),
                'total_sales' => $segmentedCustomers->where('segment', 'B')->sum('total_sales'),
            ],
            'C' => [
                'count' => $segmentedCustomers->where('segment', 'C')->count(),
                'total_sales' => $segmentedCustomers->where('segment', 'C')->sum('total_sales'),
            ],
        ];

        return Inertia::render('Reports/Customers/CustomerSegmentation', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'customers' => $segmentedCustomers,
            'segmentSummary' => $segmentSummary,
            'totalSales' => $totalSales ?? 0,
        ]);
    }

    /**
     * Customer lifetime value report
     */
    public function lifetimeValue(Request $request)
    {
        $customers = CurrentAccount::where('account_type', 'customer')
            ->where('is_active', true)
            ->select(
                'id',
                'account_code',
                'title',
                'created_at',
                'current_balance',
                'total_receivables'
            )
            ->get()
            ->map(function ($customer) {
                // Calculate total sales from sales orders
                $totalSales = SalesOrder::where('customer_id', $customer->id)
                    ->whereNotIn('status', ['cancelled', 'draft'])
                    ->sum('total_amount') ?? 0;

                // Calculate order count
                $orderCount = SalesOrder::where('customer_id', $customer->id)
                    ->whereNotIn('status', ['cancelled', 'draft'])
                    ->count();

                // Calculate customer age in months
                $customerAge = $customer->created_at ? Carbon::parse($customer->created_at)->diffInMonths(Carbon::now()) : 1;
                if ($customerAge == 0) $customerAge = 1;

                // Calculate monthly average
                $monthlyAverage = $totalSales / $customerAge;

                // Estimate lifetime value (assuming 5 year average customer life)
                $estimatedLifetimeValue = $monthlyAverage * 60;

                return [
                    'id' => $customer->id,
                    'code' => $customer->account_code,
                    'name' => $customer->title,
                    'customer_since' => $customer->created_at?->format('Y-m-d'),
                    'customer_age_months' => $customerAge,
                    'total_sales' => $totalSales,
                    'order_count' => $orderCount,
                    'monthly_average' => round($monthlyAverage, 2),
                    'lifetime_value' => round($estimatedLifetimeValue, 2),
                ];
            })
            ->sortByDesc('lifetime_value')
            ->values();

        return Inertia::render('Reports/Customers/CustomerLifetimeValue', [
            'customers' => $customers->take(100),
            'summary' => [
                'total_customers' => $customers->count(),
                'avg_lifetime_value' => round($customers->avg('lifetime_value') ?? 0, 2),
                'total_lifetime_value' => round($customers->sum('lifetime_value') ?? 0, 2),
            ],
        ]);
    }

    /**
     * Customer retention report
     */
    public function retention(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subYear();

        // Monthly retention cohort
        $monthlyRetention = $this->calculateMonthlyRetention($startDate, $endDate);

        // Churn analysis
        $churnAnalysis = $this->calculateChurnAnalysis();

        // Repeat customer rate
        $repeatCustomerRate = $this->calculateRepeatCustomerRate($startDate, $endDate);

        return Inertia::render('Reports/Customers/CustomerRetention', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'monthlyRetention' => $monthlyRetention,
            'churnAnalysis' => $churnAnalysis,
            'repeatCustomerRate' => $repeatCustomerRate,
        ]);
    }

    /**
     * Customer growth report
     */
    public function growth(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subYear();

        // Monthly new customers
        $monthlyNewCustomers = CurrentAccount::where('account_type', 'customer')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Lead conversion
        $leadConversion = Lead::whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('COUNT(*) as total_leads'),
                DB::raw('SUM(CASE WHEN status = "converted" THEN 1 ELSE 0 END) as converted_leads')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => $item->month,
                    'total_leads' => $item->total_leads,
                    'converted_leads' => $item->converted_leads,
                    'conversion_rate' => $item->total_leads > 0
                        ? round(($item->converted_leads / $item->total_leads) * 100, 2)
                        : 0,
                ];
            });

        // Customer source breakdown
        $customerSources = Lead::whereNotNull('source')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select('source', DB::raw('COUNT(*) as count'))
            ->groupBy('source')
            ->orderByDesc('count')
            ->get();

        return Inertia::render('Reports/Customers/CustomerGrowth', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'monthlyNewCustomers' => $monthlyNewCustomers,
            'leadConversion' => $leadConversion,
            'customerSources' => $customerSources,
        ]);
    }

    // Helper methods
    private function getSummaryStats($startDate, $endDate)
    {
        $totalCustomers = CurrentAccount::where('account_type', 'customer')->count();

        $activeCustomers = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->distinct('customer_id')
            ->count('customer_id');

        $newCustomers = CurrentAccount::where('account_type', 'customer')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        $avgSalesPerCustomer = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->avg('total_amount') ?? 0;

        return [
            'total_customers' => $totalCustomers,
            'active_customers' => $activeCustomers,
            'new_customers' => $newCustomers,
            'avg_sales_per_customer' => round($avgSalesPerCustomer, 2),
        ];
    }

    private function getCustomerSegmentation()
    {
        $totalCustomers = CurrentAccount::where('account_type', 'customer')->count();

        if ($totalCustomers == 0) {
            return [
                ['name' => 'A Sınıfı', 'value' => 0],
                ['name' => 'B Sınıfı', 'value' => 0],
                ['name' => 'C Sınıfı', 'value' => 0],
            ];
        }

        // Simple segmentation based on balance
        $highValue = CurrentAccount::where('account_type', 'customer')
            ->where('current_balance', '>', 100000)
            ->count();

        $mediumValue = CurrentAccount::where('account_type', 'customer')
            ->whereBetween('current_balance', [10000, 100000])
            ->count();

        $lowValue = CurrentAccount::where('account_type', 'customer')
            ->where('current_balance', '<', 10000)
            ->count();

        return [
            ['name' => 'A Sınıfı (Yüksek)', 'value' => $highValue],
            ['name' => 'B Sınıfı (Orta)', 'value' => $mediumValue],
            ['name' => 'C Sınıfı (Düşük)', 'value' => $lowValue],
        ];
    }

    private function getCustomerGrowthTrend($startDate, $endDate)
    {
        return CurrentAccount::where('account_type', 'customer')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();
    }

    private function getTopCustomers($startDate, $endDate, $limit = 10)
    {
        return SalesOrder::query()
            ->join('current_accounts', 'sales_orders.customer_id', '=', 'current_accounts.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                'current_accounts.title',
                DB::raw('SUM(sales_orders.total_amount) as total_sales')
            )
            ->groupBy('current_accounts.id', 'current_accounts.title')
            ->orderByDesc('total_sales')
            ->limit($limit)
            ->get();
    }

    private function getAtRiskCustomers($limit)
    {
        // Customers with no orders in last 90 days but had orders before
        $ninetyDaysAgo = Carbon::now()->subDays(90);

        return CurrentAccount::where('account_type', 'customer')
            ->where('is_active', true)
            ->whereExists(function ($query) use ($ninetyDaysAgo) {
                $query->select(DB::raw(1))
                    ->from('sales_orders')
                    ->whereColumn('sales_orders.customer_id', 'current_accounts.id')
                    ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
                    ->where('sales_orders.order_date', '<', $ninetyDaysAgo);
            })
            ->whereNotExists(function ($query) use ($ninetyDaysAgo) {
                $query->select(DB::raw(1))
                    ->from('sales_orders')
                    ->whereColumn('sales_orders.customer_id', 'current_accounts.id')
                    ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
                    ->where('sales_orders.order_date', '>=', $ninetyDaysAgo);
            })
            ->select('id', 'account_code', 'title', 'current_balance')
            ->limit($limit)
            ->get();
    }

    private function calculateMonthlyRetention($startDate, $endDate)
    {
        $months = [];
        $current = $startDate->copy()->startOfMonth();

        while ($current <= $endDate) {
            $monthEnd = $current->copy()->endOfMonth();
            $prevMonthStart = $current->copy()->subMonth()->startOfMonth();
            $prevMonthEnd = $current->copy()->subMonth()->endOfMonth();

            // Customers who ordered in previous month
            $prevMonthCustomers = SalesOrder::whereBetween('order_date', [$prevMonthStart, $prevMonthEnd])
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->distinct()
                ->pluck('customer_id');

            // Of those, how many ordered this month
            $retainedCustomers = SalesOrder::whereBetween('order_date', [$current, $monthEnd])
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->whereIn('customer_id', $prevMonthCustomers)
                ->distinct()
                ->count('customer_id');

            $retentionRate = $prevMonthCustomers->count() > 0
                ? round(($retainedCustomers / $prevMonthCustomers->count()) * 100, 2)
                : 0;

            $months[] = [
                'month' => $current->format('Y-m'),
                'previous_customers' => $prevMonthCustomers->count(),
                'retained_customers' => $retainedCustomers,
                'retention_rate' => $retentionRate,
            ];

            $current->addMonth();
        }

        return $months;
    }

    private function calculateChurnAnalysis()
    {
        $thirtyDaysAgo = Carbon::now()->subDays(30);
        $sixtyDaysAgo = Carbon::now()->subDays(60);
        $ninetyDaysAgo = Carbon::now()->subDays(90);

        return [
            'active_30_days' => SalesOrder::where('order_date', '>=', $thirtyDaysAgo)
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->distinct()
                ->count('customer_id'),
            'inactive_30_60_days' => SalesOrder::whereBetween('order_date', [$sixtyDaysAgo, $thirtyDaysAgo])
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->whereNotExists(function ($query) use ($thirtyDaysAgo) {
                    $query->select(DB::raw(1))
                        ->from('sales_orders as so2')
                        ->whereColumn('so2.customer_id', 'sales_orders.customer_id')
                        ->where('so2.order_date', '>=', $thirtyDaysAgo)
                        ->whereNotIn('so2.status', ['cancelled', 'draft']);
                })
                ->distinct()
                ->count('customer_id'),
            'inactive_60_90_days' => SalesOrder::whereBetween('order_date', [$ninetyDaysAgo, $sixtyDaysAgo])
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->whereNotExists(function ($query) use ($sixtyDaysAgo) {
                    $query->select(DB::raw(1))
                        ->from('sales_orders as so2')
                        ->whereColumn('so2.customer_id', 'sales_orders.customer_id')
                        ->where('so2.order_date', '>=', $sixtyDaysAgo)
                        ->whereNotIn('so2.status', ['cancelled', 'draft']);
                })
                ->distinct()
                ->count('customer_id'),
            'churned_90_plus' => CurrentAccount::where('account_type', 'customer')
                ->whereNotExists(function ($query) use ($ninetyDaysAgo) {
                    $query->select(DB::raw(1))
                        ->from('sales_orders')
                        ->whereColumn('sales_orders.customer_id', 'current_accounts.id')
                        ->where('sales_orders.order_date', '>=', $ninetyDaysAgo)
                        ->whereNotIn('sales_orders.status', ['cancelled', 'draft']);
                })
                ->count(),
        ];
    }

    private function calculateRepeatCustomerRate($startDate, $endDate)
    {
        $totalCustomers = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->distinct()
            ->count('customer_id');

        $repeatCustomers = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->select('customer_id')
            ->groupBy('customer_id')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->count();

        return [
            'total_customers' => $totalCustomers,
            'repeat_customers' => $repeatCustomers,
            'repeat_rate' => $totalCustomers > 0
                ? round(($repeatCustomers / $totalCustomers) * 100, 2)
                : 0,
        ];
    }
}
