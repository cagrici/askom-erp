<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\EvdsService;
use App\Models\ExchangeRate;
use Carbon\Carbon;

class EvdsController extends Controller
{
    private $evdsService;

    public function __construct(EvdsService $evdsService)
    {
        $this->evdsService = $evdsService;
        // Make exchange rate endpoints public for API access
        $this->middleware('auth')->except([
            'getExchangeRates',
            'getCurrentRates',
            'getHistoricalRates',
            'getAverageRates',
            'getSupportedCurrencies'
        ]);
    }

    /**
     * Get exchange rates for specified currencies and date range
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getExchangeRates(Request $request)
    {

        // Ensure JSON response
        $request->headers->set('Accept', 'application/json');

        $request->validate([
            'currencies' => 'array',
            'currencies.*' => 'string|in:USD,EUR,GBP,CHF,JPY,CAD,AUD',
            'start_date' => 'date_format:d-m-Y',
            'end_date' => 'date_format:d-m-Y',
            'type' => 'string|in:A,S', // A: Alış (Buy), S: Satış (Sell)
        ]);

        $currencies = $request->get('currencies', ['USD', 'EUR', 'GBP']);
        $startDate = $request->get('start_date', Carbon::today()->subDays(30)->format('d-m-Y'));
        $endDate = $request->get('end_date', Carbon::today()->format('d-m-Y'));
        $type = $request->get('type', 'A'); // Default to buy rates

        try {
            $data = $this->evdsService->getExchangeRates($currencies, $startDate, $endDate, $type);

            // Archive exchange rates to database
            $archivedCount = 0;
            if (is_array($data) && !empty($data)) {
                $archivedCount = ExchangeRate::archiveRates($data);
            }

            return response()->json([
                'success' => true,
                'data' => $data,
                'meta' => [
                    'currencies' => $currencies,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'type' => $type === 'A' ? 'Alış' : 'Satış',
                    'archived_count' => $archivedCount
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kur bilgileri alınırken hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current exchange rates (today's rates)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCurrentRates(Request $request)
    {
        // Ensure JSON response
        $request->headers->set('Accept', 'application/json');

        $cacheKey = 'evds_current_rates_' . Carbon::today()->format('Y-m-d');

        try {
            $data = $this->evdsService->getTodayRates(['USD', 'EUR', 'GBP'], 'A');

            // Archive current rates to database
            $archivedCount = 0;
            if (is_array($data) && !empty($data)) {
                $archivedCount = ExchangeRate::archiveRates($data);
            }

            return response()->json([
                'success' => true,
                'data' => $data,
                'date' => Carbon::today()->format('d.m.Y'),
                'archived_count' => $archivedCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Güncel kurlar alınırken hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get archived exchange rates from database
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getArchivedRates(Request $request)
    {
        $request->validate([
            'currencies' => 'array',
            'currencies.*' => 'string|in:USD,EUR,GBP,CHF,JPY,CAD,AUD',
            'start_date' => 'date',
            'end_date' => 'date|after_or_equal:start_date',
            'type' => 'string|in:A,S',
        ]);

        $currencies = $request->get('currencies', ['USD', 'EUR', 'GBP']);
        $startDate = $request->get('start_date', Carbon::today()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::today()->format('Y-m-d'));
        $type = $request->get('type', 'A');

        try {
            $rates = ExchangeRate::whereIn('currency', $currencies)
                ->forDateRange($startDate, $endDate)
                ->where('type', $type)
                ->orderBy('date', 'desc')
                ->orderBy('currency')
                ->get()
                ->groupBy('date');

            $formattedData = [];
            foreach ($rates as $date => $dateRates) {
                $ratesData = [];
                foreach ($dateRates as $rate) {
                    $ratesData[$rate->currency] = [
                        'currency' => $rate->currency,
                        'currency_name' => $rate->currency_name,
                        'value' => (float) $rate->value,
                        'formatted' => $rate->formatted_value,
                        'type' => $rate->type === 'A' ? 'Alış' : 'Satış',
                        'is_average' => $rate->is_average
                    ];
                }
                
                $formattedData[] = [
                    'date' => Carbon::parse($date)->format('d-m-Y'),
                    'date_iso' => $date,
                    'date_formatted' => Carbon::parse($date)->format('d.m.Y'),
                    'rates' => $ratesData
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $formattedData,
                'source' => 'database',
                'meta' => [
                    'currencies' => $currencies,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'type' => $type === 'A' ? 'Alış' : 'Satış',
                    'total_records' => $rates->flatten()->count()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Arşiv kurları alınırken hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get latest archived rates from database
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getLatestArchivedRates(Request $request)
    {
        $type = $request->get('type', 'A');

        try {
            $latestRates = ExchangeRate::getLatestRates($type);

            $formattedRates = [];
            foreach ($latestRates as $currency => $rate) {
                $formattedRates[$currency] = [
                    'currency' => $rate->currency,
                    'currency_name' => $rate->currency_name,
                    'value' => (float) $rate->value,
                    'formatted' => $rate->formatted_value,
                    'type' => $rate->type === 'A' ? 'Alış' : 'Satış',
                    'date' => $rate->date->format('d-m-Y')
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $formattedRates,
                'source' => 'database',
                'type' => $type === 'A' ? 'Alış' : 'Satış'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'En son kurlar alınırken hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Convert currency using archived rates
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function convertCurrencyFromArchive(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'from_currency' => 'required|string|in:USD,EUR,GBP,CHF,JPY,CAD,AUD,TRY',
            'to_currency' => 'required|string|in:USD,EUR,GBP,CHF,JPY,CAD,AUD,TRY',
            'date' => 'date',
            'type' => 'string|in:A,S'
        ]);

        $amount = $request->get('amount');
        $fromCurrency = $request->get('from_currency');
        $toCurrency = $request->get('to_currency');
        $date = $request->get('date', Carbon::today()->format('Y-m-d'));
        $type = $request->get('type', 'A');

        try {
            $convertedAmount = ExchangeRate::convert($amount, $fromCurrency, $toCurrency, $date, $type);

            if ($convertedAmount === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dönüşüm için gerekli kur bilgisi bulunamadı'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'original_amount' => $amount,
                    'converted_amount' => round($convertedAmount, 4),
                    'from_currency' => $fromCurrency,
                    'to_currency' => $toCurrency,
                    'date' => $date,
                    'type' => $type === 'A' ? 'Alış' : 'Satış',
                    'formatted' => number_format($convertedAmount, 4, ',', '.') . ' ' . $toCurrency
                ],
                'source' => 'database'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Para birimi dönüşümünde hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get historical exchange rates for a specific currency
     *
     * @param string $currency
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getHistoricalRates($currency, Request $request)
    {
        $request->validate([
            'start_date' => 'date_format:d-m-Y',
            'end_date' => 'date_format:d-m-Y',
            'type' => 'string|in:A,S',
        ]);

        $currency = strtoupper($currency);
        if (!in_array($currency, ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD'])) {
            return response()->json([
                'success' => false,
                'message' => 'Desteklenmeyen para birimi'
            ], 400);
        }

        $startDate = $request->get('start_date', Carbon::today()->subYear()->format('d-m-Y'));
        $endDate = $request->get('end_date', Carbon::today()->format('d-m-Y'));
        $type = $request->get('type', 'A');

        try {
            $data = $this->evdsService->getCurrencyHistory($currency, $startDate, $endDate, $type);

            return response()->json([
                'success' => true,
                'data' => $data,
                'currency' => $currency,
                'meta' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'type' => $type === 'A' ? 'Alış' : 'Satış'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Geçmiş kurlar alınırken hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get exchange rate averages for a specific period
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAverageRates(Request $request)
    {
        $request->validate([
            'currencies' => 'array',
            'currencies.*' => 'string|in:USD,EUR,GBP,CHF,JPY,CAD,AUD',
            'start_date' => 'required|date_format:d-m-Y',
            'end_date' => 'required|date_format:d-m-Y',
            'frequency' => 'integer|in:5,6,8', // 5: Monthly, 6: Quarterly, 8: Yearly
        ]);

        $currencies = $request->get('currencies', ['USD', 'EUR']);
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $frequency = $request->get('frequency', 5); // Default to monthly

        try {
            $data = $this->evdsService->getAverageRates($currencies, $startDate, $endDate, $frequency);

            $frequencyText = [
                5 => 'Aylık',
                6 => '3 Aylık',
                8 => 'Yıllık'
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'meta' => [
                    'currencies' => $currencies,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'frequency' => $frequencyText[$frequency] ?? 'Aylık'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ortalama kurlar alınırken hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get supported currencies list
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSupportedCurrencies()
    {
        try {
            $currencies = $this->evdsService->getSupportedCurrencies();

            return response()->json([
                'success' => true,
                'currencies' => $currencies
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Desteklenen para birimleri alınırken hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Convert amount from one currency to another
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function convertCurrency(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'from_currency' => 'required|string|in:USD,EUR,GBP,CHF,JPY,CAD,AUD,TRY,TL',
            'to_currency' => 'required|string|in:USD,EUR,GBP,CHF,JPY,CAD,AUD,TRY,TL',
            'date' => 'date_format:d-m-Y'
        ]);

        $amount = $request->get('amount');
        $fromCurrency = strtoupper($request->get('from_currency'));
        $toCurrency = strtoupper($request->get('to_currency'));
        $date = $request->get('date');

        try {
            $result = $this->evdsService->convertCurrency($amount, $fromCurrency, $toCurrency, $date);

            return response()->json([
                'success' => true,
                'conversion' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Para birimi dönüşümü yapılırken hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }
}
