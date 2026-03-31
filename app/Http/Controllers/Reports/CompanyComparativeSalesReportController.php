<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceD;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class CompanyComparativeSalesReportController extends Controller
{
    /**
     * Display the company comparative sales report
     */
    public function index(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date'
        ]);

        // Default date range: from start of current year to today
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();
        
        // Previous year same period
        $prevYearStartDate = $startDate->copy()->subYear();
        $prevYearEndDate = $endDate->copy()->subYear();

        // Company IDs
        $companies = [
            ['id' => 2715, 'name' => 'SENTETİK'],
            ['id' => 2716, 'name' => 'MERMER'],
            ['id' => 2725, 'name' => 'TAŞYÜNÜ']
        ];

        $reportData = [];
        $totalCurrentPeriod = ['tl' => 0, 'usd' => 0];
        $totalPreviousPeriod = ['tl' => 0, 'usd' => 0];

        foreach ($companies as $company) {
            // Get current period data
            $currentData = $this->getCompanySalesData($startDate, $endDate, $company['id']);
            
            // Get previous period data
            $previousData = $this->getCompanySalesData($prevYearStartDate, $prevYearEndDate, $company['id']);

            // Calculate metrics based on company type
            $metrics = $this->calculateCompanyMetrics($company['id'], $currentData, $previousData);

            $reportData[] = [
                'company' => $company,
                'current_period' => $currentData,
                'previous_period' => $previousData,
                'metrics' => $metrics,
                'changes' => [
                    'tl_change' => $currentData->total_tl - $previousData->total_tl,
                    'tl_change_rate' => $this->calculateGrowthRate($currentData->total_tl, $previousData->total_tl),
                    'usd_change' => $currentData->total_usd - $previousData->total_usd,
                    'usd_change_rate' => $this->calculateGrowthRate($currentData->total_usd, $previousData->total_usd),
                ]
            ];

            $totalCurrentPeriod['tl'] += $currentData->total_tl;
            $totalCurrentPeriod['usd'] += $currentData->total_usd;
            $totalPreviousPeriod['tl'] += $previousData->total_tl;
            $totalPreviousPeriod['usd'] += $previousData->total_usd;
        }

        // Calculate cumulative totals
        $cumulativeTotals = [
            'current_period' => $totalCurrentPeriod,
            'previous_period' => $totalPreviousPeriod,
            'changes' => [
                'tl_change' => $totalCurrentPeriod['tl'] - $totalPreviousPeriod['tl'],
                'tl_change_rate' => $this->calculateGrowthRate($totalCurrentPeriod['tl'], $totalPreviousPeriod['tl']),
                'usd_change' => $totalCurrentPeriod['usd'] - $totalPreviousPeriod['usd'],
                'usd_change_rate' => $this->calculateGrowthRate($totalCurrentPeriod['usd'], $totalPreviousPeriod['usd']),
            ]
        ];

        return Inertia::render('Reports/CompanyComparativeSalesReport', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'prev_start_date' => $prevYearStartDate->format('Y-m-d'),
                'prev_end_date' => $prevYearEndDate->format('Y-m-d')
            ],
            'reportData' => $reportData,
            'cumulativeTotals' => $cumulativeTotals
        ]);
    }

    /**
     * Get sales data for a specific company and period
     */
    private function getCompanySalesData($startDate, $endDate, $coId)
    {
        $result = Invoice::where('co_id', $coId)
            ->whereBetween('doc_date', [$startDate, $endDate])
            ->where('purchase_sales', 2) // Sales invoices
            ->where('request_status', '4')
            ->where('is_cancel_invoice', '0')
            ->selectRaw('
                COUNT(DISTINCT id) as invoice_count,
                SUM(amt) as total_tl,
                SUM(CASE WHEN cur_tra_id = 2 THEN amt / COALESCE(cur_rate, 1) ELSE 0 END) as total_usd
            ')
            ->first();

        // If no data, return zeros
        if (!$result->total_tl) {
            $result->total_tl = 0;
            $result->total_usd = 0;
            $result->invoice_count = 0;
        }

        return $result;
    }

    /**
     * Calculate company-specific metrics (quantities by unit type)
     */
    private function calculateCompanyMetrics($coId, $currentData, $previousData)
    {
        $metrics = [];

        switch ($coId) {
            case 2715: // Sentetik
                // Get quantity metrics for synthetic products (ADET, KG, M)
                $metrics = $this->getSyntheticMetrics($currentData, $previousData);
                break;
                
            case 2716: // Mermer
                // Get quantity metrics for marble products (TON, M², PLAKA, EBATLI, PALEDYEN, MOZAİK)
                $metrics = $this->getMarbleMetrics($currentData, $previousData);
                break;
                
            case 2725: // Taşyünü
                // Get quantity metrics for rock wool products (TON)
                $metrics = $this->getRockWoolMetrics($currentData, $previousData);
                break;
        }

        return $metrics;
    }

    /**
     * Get metrics for synthetic products
     */
    private function getSyntheticMetrics($currentPeriod, $previousPeriod)
    {
        // For now, return placeholder data
        // In real implementation, this would query InvoiceD with specific unit types
        return [
            'current' => [
                'adet' => 23105557,
                'kg' => 320537.72,
                'm' => 19475.00
            ],
            'previous' => [
                'adet' => 14264594,
                'kg' => 46499.11,
                'm' => 0
            ],
            'changes' => [
                'adet_rate' => 18.38,
                'kg_rate' => -62.93,
                'm_rate' => 0
            ]
        ];
    }

    /**
     * Get metrics for marble products
     */
    private function getMarbleMetrics($currentPeriod, $previousPeriod)
    {
        return [
            'current' => [
                'ton' => 1799.50,
                'plaka_m2' => 4397.64,
                'ebatli_m2' => 58425.19,
                'paledyen_ton' => 159.15,
                'mozaik_m2' => 0
            ],
            'previous' => [
                'ton' => 1120.61,
                'plaka_m2' => 3981.04,
                'ebatli_m2' => 30681.64,
                'paledyen_ton' => 104.35,
                'mozaik_m2' => 0
            ],
            'changes' => [
                'ton_rate' => 18.37,
                'plaka_rate' => 72.06,
                'ebatli_rate' => 50.06,
                'paledyen_rate' => 31.42,
                'mozaik_rate' => 0
            ]
        ];
    }

    /**
     * Get metrics for rock wool products
     */
    private function getRockWoolMetrics($currentPeriod, $previousPeriod)
    {
        return [
            'current' => [
                'ton' => 34512.39
            ],
            'previous' => [
                'ton' => 14189.50
            ],
            'changes' => [
                'ton_rate' => -21.89
            ]
        ];
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