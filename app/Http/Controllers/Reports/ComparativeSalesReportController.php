<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\Company;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ComparativeSalesReportController extends Controller
{
    /**
     * Display the comparative sales report
     */
    public function index(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'co_id' => 'nullable|integer|exists:companies,id',
        ]);

        // Default date range: from start of current year to today
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();

        // Previous year same period
        $prevYearStartDate = $startDate->copy()->subYear();
        $prevYearEndDate = $endDate->copy()->subYear();

        // Get current period sales data
        $currentPeriodData = $this->getSalesData($startDate, $endDate);

        // Get previous year same period sales data
        $previousPeriodData = $this->getSalesData($prevYearStartDate, $prevYearEndDate);

        // Merge and calculate comparison
        $comparisonData = $this->calculateComparison($currentPeriodData, $previousPeriodData);

        // Get monthly breakdown for charts
        $monthlyData = $this->getMonthlyData($startDate, $endDate, $prevYearStartDate, $prevYearEndDate);

        // Get top products
        $topProducts = $this->getTopProducts($startDate, $endDate);

        return Inertia::render('Reports/ComparativeSalesReport', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'co_id' => $request->co_id,
            ],
            'companies' => Company::orderBy('name')->get(['id', 'name']),
            'comparisonData' => $comparisonData,
            'monthlyData' => $monthlyData,
            'topProducts' => $topProducts,
            'summary' => [
                'currentPeriodTotal' => $currentPeriodData->sum('total_amount') ?? 0,
                'previousPeriodTotal' => $previousPeriodData->sum('total_amount') ?? 0,
                'growthRate' => $this->calculateGrowthRate(
                    $currentPeriodData->sum('total_amount') ?? 0,
                    $previousPeriodData->sum('total_amount') ?? 0
                )
            ]
        ]);
    }

    /**
     * Get sales data for a specific period
     */
    private function getSalesData($startDate, $endDate)
    {
        $query = InvoiceItem::query()
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('products', 'invoice_items.product_id', '=', 'products.id')
            ->whereBetween('invoices.invoice_date', [$startDate, $endDate])
            ->where('invoices.invoice_type', 'sales')
            ->where('invoices.status', '!=', 'cancelled')
            ->select(
                'products.id as product_id',
                'products.code',
                'products.name',
                DB::raw('SUM(invoice_items.quantity) as total_quantity'),
                DB::raw('SUM(invoice_items.line_total) as total_amount'),
                DB::raw('COUNT(DISTINCT invoice_items.invoice_id) as invoice_count')
            )
            ->groupBy('products.id', 'products.code', 'products.name');

        return $query->get();
    }

    /**
     * Calculate comparison between two periods
     */
    private function calculateComparison($currentData, $previousData)
    {
        $comparison = [];

        // Create a map of previous data by product_id
        $previousMap = $previousData->keyBy('product_id');

        foreach ($currentData as $current) {
            $previous = $previousMap->get($current->product_id);

            $comparison[] = [
                'product_id' => $current->product_id,
                'code' => $current->code,
                'name' => $current->name,
                'current_quantity' => $current->total_quantity ?? 0,
                'previous_quantity' => $previous ? ($previous->total_quantity ?? 0) : 0,
                'quantity_change' => ($current->total_quantity ?? 0) - ($previous ? ($previous->total_quantity ?? 0) : 0),
                'quantity_change_rate' => $this->calculateGrowthRate(
                    $current->total_quantity ?? 0,
                    $previous ? ($previous->total_quantity ?? 0) : 0
                ),
                'current_amount' => $current->total_amount ?? 0,
                'previous_amount' => $previous ? ($previous->total_amount ?? 0) : 0,
                'amount_change' => ($current->total_amount ?? 0) - ($previous ? ($previous->total_amount ?? 0) : 0),
                'amount_change_rate' => $this->calculateGrowthRate(
                    $current->total_amount ?? 0,
                    $previous ? ($previous->total_amount ?? 0) : 0
                )
            ];
        }

        // Add products that only exist in previous period
        foreach ($previousData as $previous) {
            if (!$currentData->contains('product_id', $previous->product_id)) {
                $comparison[] = [
                    'product_id' => $previous->product_id,
                    'code' => $previous->code,
                    'name' => $previous->name,
                    'current_quantity' => 0,
                    'previous_quantity' => $previous->total_quantity ?? 0,
                    'quantity_change' => -($previous->total_quantity ?? 0),
                    'quantity_change_rate' => -100,
                    'current_amount' => 0,
                    'previous_amount' => $previous->total_amount ?? 0,
                    'amount_change' => -($previous->total_amount ?? 0),
                    'amount_change_rate' => -100
                ];
            }
        }

        // Sort by current amount descending
        usort($comparison, function($a, $b) {
            return $b['current_amount'] <=> $a['current_amount'];
        });

        return $comparison;
    }

    /**
     * Get monthly sales data for charts
     */
    private function getMonthlyData($startDate, $endDate, $prevStartDate, $prevEndDate)
    {
        // Current period monthly data
        $currentMonthly = $this->getMonthlyBreakdown($startDate, $endDate);

        // Previous period monthly data
        $previousMonthly = $this->getMonthlyBreakdown($prevStartDate, $prevEndDate);

        // Merge data for comparison
        $months = [];
        foreach ($currentMonthly as $data) {
            $months[$data->month] = [
                'month' => $data->month,
                'current_amount' => $data->total_amount ?? 0,
                'previous_amount' => 0
            ];
        }

        foreach ($previousMonthly as $data) {
            $currentMonth = Carbon::parse($data->month)->addYear()->format('Y-m');
            if (isset($months[$currentMonth])) {
                $months[$currentMonth]['previous_amount'] = $data->total_amount ?? 0;
            }
        }

        return array_values($months);
    }

    /**
     * Get monthly breakdown of sales
     */
    private function getMonthlyBreakdown($startDate, $endDate)
    {
        return Invoice::query()
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->where('invoice_type', 'sales')
            ->where('status', '!=', 'cancelled')
            ->select(
                DB::raw("DATE_FORMAT(invoice_date, '%Y-%m') as month"),
                DB::raw('SUM(gross_total) as total_amount')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();
    }

    /**
     * Get top selling products
     */
    private function getTopProducts($startDate, $endDate, $limit = 10)
    {
        return InvoiceItem::query()
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('products', 'invoice_items.product_id', '=', 'products.id')
            ->whereBetween('invoices.invoice_date', [$startDate, $endDate])
            ->where('invoices.invoice_type', 'sales')
            ->where('invoices.status', '!=', 'cancelled')
            ->select(
                'products.code',
                'products.name',
                DB::raw('SUM(invoice_items.quantity) as total_quantity'),
                DB::raw('SUM(invoice_items.line_total) as total_amount')
            )
            ->groupBy('products.id', 'products.code', 'products.name')
            ->orderByDesc('total_amount')
            ->limit($limit)
            ->get();
    }

    /**
     * Calculate growth rate percentage
     */
    private function calculateGrowthRate($current, $previous)
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }

        return round((($current - $previous) / $previous) * 100, 2);
    }
}
