<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Models\SalesRepresentative;
use App\Models\SalesTarget;
use App\Models\CurrentAccount;
use App\Models\Department;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PerformanceReportController extends Controller
{
    /**
     * Display the performance reports dashboard
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

        // Sales team performance
        $salesTeamPerformance = $this->getSalesTeamPerformance($startDate, $endDate);

        // Target vs Actual
        $targetVsActual = $this->getTargetVsActual($startDate, $endDate);

        // Department performance (radar chart data)
        $departmentPerformance = $this->getDepartmentPerformance($startDate, $endDate);

        // KPI scores
        $kpiScores = $this->getKPIScores($startDate, $endDate);

        return Inertia::render('Reports/Performance/Index', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'summary' => $summary,
            'salesTeamPerformance' => $salesTeamPerformance,
            'targetVsActual' => $targetVsActual,
            'departmentPerformance' => $departmentPerformance,
            'kpiScores' => $kpiScores,
        ]);
    }

    /**
     * Sales team performance report
     */
    public function salesTeam(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        // Individual salesperson performance
        $salespeople = SalesRepresentative::where('is_active', true)
            ->get()
            ->map(function ($salesperson) use ($startDate, $endDate) {
                $salesQuery = SalesOrder::where('salesperson_id', $salesperson->id)
                    ->whereBetween('order_date', [$startDate, $endDate])
                    ->whereNotIn('status', ['cancelled', 'draft']);

                $totalSales = (clone $salesQuery)->sum('total_amount');
                $orderCount = (clone $salesQuery)->count();
                $customerCount = (clone $salesQuery)->distinct()->count('customer_id');

                // Get target
                $target = SalesTarget::where('user_id', $salesperson->id)
                    ->where('year', $startDate->year)
                    ->first();

                $targetAmount = $target ? $target->revenue_target : 0;
                $achievement = $targetAmount > 0 ? ($totalSales / $targetAmount) * 100 : 0;

                return [
                    'id' => $salesperson->id,
                    'name' => $salesperson->name,
                    'total_sales' => $totalSales ?? 0,
                    'order_count' => $orderCount ?? 0,
                    'customer_count' => $customerCount ?? 0,
                    'avg_order_value' => $orderCount > 0 ? $totalSales / $orderCount : 0,
                    'revenue_target' => $targetAmount,
                    'achievement' => round($achievement, 2),
                ];
            })
            ->sortByDesc('total_sales')
            ->values();

        // Monthly trend per salesperson
        $monthlyTrend = SalesOrder::query()
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

        // Team ranking
        $ranking = $salespeople->map(function ($sp, $index) {
            return [
                'rank' => $index + 1,
                'name' => $sp['name'],
                'total_sales' => $sp['total_sales'],
                'achievement' => $sp['achievement'],
            ];
        })->take(10);

        return Inertia::render('Reports/Performance/SalesTeamPerformance', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'salespeople' => $salespeople,
            'monthlyTrend' => $monthlyTrend,
            'ranking' => $ranking,
        ]);
    }

    /**
     * Target achievement report
     */
    public function targetAchievement(Request $request)
    {
        $request->validate([
            'year' => 'nullable|integer|min:2020|max:2030',
        ]);

        $year = $request->year ?? Carbon::now()->year;
        $startDate = Carbon::create($year, 1, 1);
        $endDate = Carbon::create($year, 12, 31);

        // Monthly targets vs actual
        $monthlyData = [];
        for ($month = 1; $month <= 12; $month++) {
            $monthStart = Carbon::create($year, $month, 1);
            $monthEnd = $monthStart->copy()->endOfMonth();

            if ($monthEnd > Carbon::now()) {
                break;
            }

            $actual = SalesOrder::whereBetween('order_date', [$monthStart, $monthEnd])
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->sum('total_amount');

            // Get monthly target (assuming yearly target divided by 12)
            $yearlyTarget = SalesTarget::where('year', $year)->sum('revenue_target');
            $monthlyTarget = $yearlyTarget / 12;

            $monthlyData[] = [
                'month' => $monthStart->format('Y-m'),
                'month_name' => $monthStart->locale('tr')->monthName,
                'target' => $monthlyTarget,
                'actual' => $actual,
                'achievement' => $monthlyTarget > 0 ? round(($actual / $monthlyTarget) * 100, 2) : 0,
                'variance' => $actual - $monthlyTarget,
            ];
        }

        // By salesperson
        $bySalesperson = SalesRepresentative::where('is_active', true)
            ->get()
            ->map(function ($sp) use ($year, $startDate, $endDate) {
                $target = SalesTarget::where('user_id', $sp->id)
                    ->where('year', $year)
                    ->first();

                $actual = SalesOrder::where('salesperson_id', $sp->id)
                    ->whereBetween('order_date', [$startDate, min($endDate, Carbon::now())])
                    ->whereNotIn('status', ['cancelled', 'draft'])
                    ->sum('total_amount');

                $targetAmount = $target ? $target->revenue_target : 0;

                return [
                    'name' => $sp->name,
                    'target' => $targetAmount,
                    'actual' => $actual ?? 0,
                    'achievement' => $targetAmount > 0 ? round(($actual / $targetAmount) * 100, 2) : 0,
                ];
            })
            ->sortByDesc('actual')
            ->values();

        // Overall summary
        $totalTarget = SalesTarget::where('year', $year)->sum('revenue_target');
        $totalActual = SalesOrder::whereBetween('order_date', [$startDate, min($endDate, Carbon::now())])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->sum('total_amount');

        return Inertia::render('Reports/Performance/TargetAchievement', [
            'filters' => [
                'year' => $year,
            ],
            'monthlyData' => $monthlyData,
            'bySalesperson' => $bySalesperson,
            'summary' => [
                'total_target' => $totalTarget ?? 0,
                'total_actual' => $totalActual ?? 0,
                'overall_achievement' => $totalTarget > 0 ? round(($totalActual / $totalTarget) * 100, 2) : 0,
            ],
            'years' => range(2020, Carbon::now()->year),
        ]);
    }

    /**
     * Operational KPIs report
     */
    public function operationalKPIs(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfMonth();

        // Order processing KPIs
        $orderKPIs = $this->getOrderKPIs($startDate, $endDate);

        // Delivery KPIs
        $deliveryKPIs = $this->getDeliveryKPIs($startDate, $endDate);

        // Customer service KPIs
        $customerKPIs = $this->getCustomerKPIs($startDate, $endDate);

        // Financial KPIs
        $financialKPIs = $this->getFinancialKPIs($startDate, $endDate);

        // Trend data
        $kpiTrend = $this->getKPITrend($startDate, $endDate);

        return Inertia::render('Reports/Performance/OperationalKPIs', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'orderKPIs' => $orderKPIs,
            'deliveryKPIs' => $deliveryKPIs,
            'customerKPIs' => $customerKPIs,
            'financialKPIs' => $financialKPIs,
            'kpiTrend' => $kpiTrend,
        ]);
    }

    /**
     * Trend analysis report
     */
    public function trendAnalysis(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subYear();

        // Monthly sales trend
        $salesTrend = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->select(
                DB::raw("DATE_FORMAT(order_date, '%Y-%m') as month"),
                DB::raw('SUM(total_amount) as total_sales'),
                DB::raw('COUNT(id) as order_count'),
                DB::raw('COUNT(DISTINCT customer_id) as customer_count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Calculate moving average and growth
        $salesTrendWithAnalysis = $salesTrend->map(function ($item, $index) use ($salesTrend) {
            // 3-month moving average
            $movingAvg = $salesTrend->slice(max(0, $index - 2), min(3, $index + 1))->avg('total_sales');

            // Month-over-month growth
            $prevMonth = $salesTrend->get($index - 1);
            $growth = $prevMonth && $prevMonth->total_sales > 0
                ? (($item->total_sales - $prevMonth->total_sales) / $prevMonth->total_sales) * 100
                : 0;

            return [
                'month' => $item->month,
                'total_sales' => $item->total_sales ?? 0,
                'order_count' => $item->order_count ?? 0,
                'customer_count' => $item->customer_count ?? 0,
                'moving_avg' => round($movingAvg ?? 0, 2),
                'growth' => round($growth, 2),
            ];
        });

        // Year-over-year comparison
        $currentYear = Carbon::now()->year;
        $yoyComparison = [];

        for ($month = 1; $month <= 12; $month++) {
            $currentYearSales = SalesOrder::whereYear('order_date', $currentYear)
                ->whereMonth('order_date', $month)
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->sum('total_amount');

            $prevYearSales = SalesOrder::whereYear('order_date', $currentYear - 1)
                ->whereMonth('order_date', $month)
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->sum('total_amount');

            $yoyComparison[] = [
                'month' => Carbon::create($currentYear, $month, 1)->locale('tr')->shortMonthName,
                'current_year' => $currentYearSales ?? 0,
                'previous_year' => $prevYearSales ?? 0,
                'growth' => $prevYearSales > 0 ? round((($currentYearSales - $prevYearSales) / $prevYearSales) * 100, 2) : 0,
            ];
        }

        // Seasonality analysis
        $seasonality = SalesOrder::whereNotIn('status', ['cancelled', 'draft'])
            ->whereYear('order_date', '>=', $currentYear - 2)
            ->select(
                DB::raw('MONTH(order_date) as month'),
                DB::raw('AVG(total_amount) as avg_order_value'),
                DB::raw('COUNT(id) / COUNT(DISTINCT YEAR(order_date)) as avg_orders')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => Carbon::create(2000, $item->month, 1)->locale('tr')->shortMonthName,
                    'avg_order_value' => round($item->avg_order_value ?? 0, 2),
                    'avg_orders' => round($item->avg_orders ?? 0, 2),
                ];
            });

        return Inertia::render('Reports/Performance/TrendAnalysis', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'salesTrend' => $salesTrendWithAnalysis,
            'yoyComparison' => $yoyComparison,
            'seasonality' => $seasonality,
        ]);
    }

    // Helper methods
    private function getSummaryStats($startDate, $endDate)
    {
        // Sales target achievement
        $totalTarget = SalesTarget::where('year', $startDate->year)->sum('revenue_target');
        $totalSales = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->sum('total_amount');

        $targetAchievement = $totalTarget > 0 ? round(($totalSales / $totalTarget) * 100, 2) : 0;

        // Order fulfillment rate
        $totalOrders = SalesOrder::whereBetween('order_date', [$startDate, $endDate])->count();
        $fulfilledOrders = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->where('status', 'delivered')
            ->count();
        $fulfillmentRate = $totalOrders > 0 ? round(($fulfilledOrders / $totalOrders) * 100, 2) : 0;

        // On-time delivery rate
        $deliveredOrders = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->where('status', 'delivered')
            ->count();
        $onTimeOrders = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->where('status', 'delivered')
            ->whereNotNull('delivered_at')
            ->whereNotNull('delivery_date')
            ->whereColumn('delivered_at', '<=', 'delivery_date')
            ->count();
        $onTimeRate = $deliveredOrders > 0 ? round(($onTimeOrders / $deliveredOrders) * 100, 2) : 100;

        // Customer satisfaction (placeholder - would need feedback data)
        $customerSatisfaction = 85; // Placeholder

        return [
            'target_achievement' => $targetAchievement,
            'fulfillment_rate' => $fulfillmentRate,
            'on_time_delivery' => $onTimeRate,
            'customer_satisfaction' => $customerSatisfaction,
        ];
    }

    private function getSalesTeamPerformance($startDate, $endDate)
    {
        return SalesOrder::query()
            ->leftJoin('sales_representatives', 'sales_orders.salesperson_id', '=', 'sales_representatives.id')
            ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->select(
                DB::raw("COALESCE(CONCAT(sales_representatives.first_name, ' ', sales_representatives.last_name), 'Atanmamis') as name"),
                DB::raw('SUM(sales_orders.total_amount) as total_sales')
            )
            ->groupBy('sales_representatives.id', 'sales_representatives.first_name', 'sales_representatives.last_name')
            ->orderByDesc('total_sales')
            ->limit(10)
            ->get();
    }

    private function getTargetVsActual($startDate, $endDate)
    {
        $result = [];
        $current = $startDate->copy()->startOfMonth();

        while ($current <= $endDate) {
            $monthEnd = $current->copy()->endOfMonth();

            $actual = SalesOrder::whereBetween('order_date', [$current, $monthEnd])
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->sum('total_amount');

            $yearlyTarget = SalesTarget::where('year', $current->year)->sum('revenue_target');
            $monthlyTarget = $yearlyTarget / 12;

            $result[] = [
                'month' => $current->format('Y-m'),
                'target' => $monthlyTarget ?? 0,
                'actual' => $actual ?? 0,
            ];

            $current->addMonth();
        }

        return $result;
    }

    private function getDepartmentPerformance($startDate, $endDate)
    {
        // Simulated department performance data for radar chart
        return [
            ['metric' => 'Satis', 'value' => 85],
            ['metric' => 'Musteri Hizmetleri', 'value' => 78],
            ['metric' => 'Operasyon', 'value' => 92],
            ['metric' => 'Finans', 'value' => 88],
            ['metric' => 'Lojistik', 'value' => 75],
            ['metric' => 'Kalite', 'value' => 90],
        ];
    }

    private function getKPIScores($startDate, $endDate)
    {
        $totalOrders = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->count();

        $avgOrderValue = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->avg('total_amount') ?? 0;

        $activeCustomers = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->distinct()
            ->count('customer_id');

        return [
            ['name' => 'Toplam Siparis', 'value' => $totalOrders, 'target' => 1000, 'unit' => 'adet'],
            ['name' => 'Ortalama Siparis Degeri', 'value' => round($avgOrderValue, 2), 'target' => 5000, 'unit' => 'TL'],
            ['name' => 'Aktif Musteri', 'value' => $activeCustomers, 'target' => 200, 'unit' => 'adet'],
            ['name' => 'Teslimat Suresi', 'value' => 3.2, 'target' => 3, 'unit' => 'gun'],
        ];
    }

    private function getOrderKPIs($startDate, $endDate)
    {
        $totalOrders = SalesOrder::whereBetween('order_date', [$startDate, $endDate])->count();
        $confirmedOrders = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereIn('status', ['confirmed', 'in_production', 'ready_to_ship', 'shipped', 'delivered'])
            ->count();

        return [
            'total_orders' => $totalOrders,
            'confirmed_orders' => $confirmedOrders,
            'confirmation_rate' => $totalOrders > 0 ? round(($confirmedOrders / $totalOrders) * 100, 2) : 0,
            'avg_processing_time' => 2.5, // Placeholder - would calculate from actual data
        ];
    }

    private function getDeliveryKPIs($startDate, $endDate)
    {
        $shipped = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereIn('status', ['shipped', 'delivered'])
            ->count();

        $delivered = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->where('status', 'delivered')
            ->count();

        return [
            'shipped_orders' => $shipped,
            'delivered_orders' => $delivered,
            'delivery_rate' => $shipped > 0 ? round(($delivered / $shipped) * 100, 2) : 0,
            'avg_delivery_time' => 3.5, // Placeholder
        ];
    }

    private function getCustomerKPIs($startDate, $endDate)
    {
        $activeCustomers = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
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
            'active_customers' => $activeCustomers,
            'repeat_customers' => $repeatCustomers,
            'repeat_rate' => $activeCustomers > 0 ? round(($repeatCustomers / $activeCustomers) * 100, 2) : 0,
            'satisfaction_score' => 4.2, // Placeholder - would need feedback system
        ];
    }

    private function getFinancialKPIs($startDate, $endDate)
    {
        $totalRevenue = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->sum('total_amount');

        // Estimate cost as 70% of revenue (placeholder - would calculate from actual cost data)
        $totalCost = $totalRevenue * 0.7;

        $grossMargin = $totalRevenue > 0 ? (($totalRevenue - $totalCost) / $totalRevenue) * 100 : 0;

        return [
            'total_revenue' => $totalRevenue ?? 0,
            'total_cost' => round($totalCost, 2),
            'gross_profit' => round(($totalRevenue ?? 0) - $totalCost, 2),
            'gross_margin' => round($grossMargin, 2),
        ];
    }

    private function getKPITrend($startDate, $endDate)
    {
        $result = [];
        $current = $startDate->copy()->startOfMonth();

        while ($current <= $endDate) {
            $monthEnd = $current->copy()->endOfMonth();

            $orders = SalesOrder::whereBetween('order_date', [$current, $monthEnd])
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->count();

            $revenue = SalesOrder::whereBetween('order_date', [$current, $monthEnd])
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->sum('total_amount');

            $customers = SalesOrder::whereBetween('order_date', [$current, $monthEnd])
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->distinct()
                ->count('customer_id');

            $result[] = [
                'month' => $current->format('Y-m'),
                'orders' => $orders,
                'revenue' => $revenue ?? 0,
                'customers' => $customers,
            ];

            $current->addMonth();
        }

        return $result;
    }
}
