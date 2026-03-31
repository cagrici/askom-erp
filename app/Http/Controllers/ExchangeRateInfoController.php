<?php

namespace App\Http\Controllers;

use App\Models\ExchangeRate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ExchangeRateInfoController extends Controller
{
    public function index(Request $request)
    {
        // Get latest rates for all currencies
        $latestRates = ExchangeRate::getLatestRates();
        
        // Get popular currencies for dashboard
        $popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NOK', 'SEK', 'DKK'];
        $mainRates = $latestRates->filter(function($rate, $currency) use ($popularCurrencies) {
            return in_array($currency, $popularCurrencies);
        });

        // Get historical data for chart (last 30 days for USD and EUR)
        $endDate = Carbon::today();
        $startDate = $endDate->copy()->subDays(30);
        
        $usdHistory = ExchangeRate::getHistoricalRates('USD', $startDate, $endDate)
            ->map(function($rate) {
                return [
                    'date' => $rate->date->format('Y-m-d'),
                    'value' => (float) $rate->value
                ];
            });

        $eurHistory = ExchangeRate::getHistoricalRates('EUR', $startDate, $endDate)
            ->map(function($rate) {
                return [
                    'date' => $rate->date->format('Y-m-d'),
                    'value' => (float) $rate->value
                ];
            });

        // Calculate daily changes for main currencies
        $ratesWithChanges = [];
        foreach ($mainRates as $currency => $rate) {
            $yesterday = $endDate->copy()->subDay();
            $previousRate = ExchangeRate::getRate($currency, $yesterday->format('Y-m-d'));
            
            $change = 0;
            $changePercent = 0;
            
            if ($previousRate) {
                $change = $rate->value - $previousRate->value;
                $changePercent = ($change / $previousRate->value) * 100;
            }
            
            $ratesWithChanges[] = [
                'currency' => $currency,
                'currency_name' => $rate->currency_name,
                'current' => (float) $rate->value,
                'previous' => $previousRate ? (float) $previousRate->value : null,
                'change' => round($change, 4),
                'change_percent' => round($changePercent, 2),
                'date' => $rate->date->format('d.m.Y')
            ];
        }

        // Get statistics
        $totalCurrencies = ExchangeRate::distinct('currency')->count();
        $latestDate = ExchangeRate::max('date');
        $oldestDate = ExchangeRate::min('date');
        $totalRecords = ExchangeRate::count();

        // Get weekly/monthly averages for USD and EUR
        $weeklyAvg = $this->getAverageRates(['USD', 'EUR'], 7);
        $monthlyAvg = $this->getAverageRates(['USD', 'EUR'], 30);

        return Inertia::render('Info/ExchangeRates', [
            'mainRates' => $ratesWithChanges,
            'allRates' => $latestRates->values(),
            'usdHistory' => $usdHistory->values(),
            'eurHistory' => $eurHistory->values(),
            'statistics' => [
                'total_currencies' => $totalCurrencies,
                'latest_date' => Carbon::parse($latestDate)->format('d.m.Y'),
                'oldest_date' => Carbon::parse($oldestDate)->format('d.m.Y'),
                'total_records' => number_format($totalRecords),
                'data_years' => Carbon::parse($oldestDate)->diffInYears(Carbon::parse($latestDate))
            ],
            'averages' => [
                'weekly' => $weeklyAvg,
                'monthly' => $monthlyAvg
            ]
        ]);
    }

    public function getCurrencyHistory(Request $request, $currency)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'period' => 'nullable|in:7,30,90,365'
        ]);

        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::today();
        $period = $request->period ?? 30;
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : $endDate->copy()->subDays($period);

        $history = ExchangeRate::getHistoricalRates(strtoupper($currency), $startDate, $endDate);
        
        $data = $history->map(function($rate) {
            return [
                'date' => $rate->date->format('Y-m-d'),
                'formatted_date' => $rate->date->format('d.m.Y'),
                'value' => (float) $rate->value,
                'formatted_value' => number_format($rate->value, 4, ',', '.') . ' TL'
            ];
        });

        // Calculate statistics
        $values = $data->pluck('value');
        $stats = [
            'min' => round($values->min(), 4),
            'max' => round($values->max(), 4),
            'avg' => round($values->avg(), 4),
            'first' => $values->first(),
            'last' => $values->last(),
            'change' => round($values->last() - $values->first(), 4),
            'change_percent' => $values->first() > 0 ? round((($values->last() - $values->first()) / $values->first()) * 100, 2) : 0
        ];

        return response()->json([
            'success' => true,
            'data' => $data->values(),
            'statistics' => $stats,
            'currency' => strtoupper($currency),
            'period' => [
                'start' => $startDate->format('d.m.Y'),
                'end' => $endDate->format('d.m.Y'),
                'days' => $startDate->diffInDays($endDate)
            ]
        ]);
    }

    public function convertCurrency(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'from' => 'required|string|size:3',
            'to' => 'required|string|size:3',
            'date' => 'nullable|date'
        ]);

        $amount = $request->amount;
        $from = strtoupper($request->from);
        $to = strtoupper($request->to);
        $date = $request->date ? Carbon::parse($request->date)->format('Y-m-d') : null;

        $convertedAmount = ExchangeRate::convert($amount, $from, $to, $date);

        if ($convertedAmount === null) {
            return response()->json([
                'success' => false,
                'message' => 'Dönüştürme işlemi başarısız. Kur bilgisi bulunamadı.'
            ], 400);
        }

        // Get rates used for conversion
        $fromRate = $from !== 'TRY' ? ExchangeRate::getRate($from, $date ?: Carbon::today()->format('Y-m-d')) : null;
        $toRate = $to !== 'TRY' ? ExchangeRate::getRate($to, $date ?: Carbon::today()->format('Y-m-d')) : null;

        return response()->json([
            'success' => true,
            'result' => [
                'amount' => $amount,
                'from' => $from,
                'to' => $to,
                'converted_amount' => round($convertedAmount, 4),
                'formatted_result' => number_format($convertedAmount, 4, ',', '.'),
                'date' => $date ?: Carbon::today()->format('Y-m-d'),
                'rates_used' => [
                    'from_rate' => $fromRate ? (float) $fromRate->value : null,
                    'to_rate' => $toRate ? (float) $toRate->value : null
                ]
            ]
        ]);
    }

    private function getAverageRates($currencies, $days)
    {
        $endDate = Carbon::today();
        $startDate = $endDate->copy()->subDays($days);
        
        $averages = [];
        
        foreach ($currencies as $currency) {
            $rates = ExchangeRate::getHistoricalRates($currency, $startDate, $endDate);
            $average = $rates->avg('value');
            
            if ($average) {
                $averages[$currency] = round($average, 4);
            }
        }
        
        return $averages;
    }

    public function getAvailableCurrencies()
    {
        $currencies = ExchangeRate::select('currency', 'currency_name')
            ->distinct()
            ->orderBy('currency')
            ->get()
            ->map(function($item) {
                return [
                    'code' => $item->currency,
                    'name' => $item->currency_name ?: $item->currency
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $currencies
        ]);
    }
}