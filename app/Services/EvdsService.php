<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class EvdsService
{
    private $apiKey;
    private $baseUrl = 'https://evds2.tcmb.gov.tr/service/evds';

    public function __construct()
    {
        $this->apiKey = config('services.evds.api_key') ?: env('EVDS_API_KEY');

        // API key yoksa servis kullanılmasın, hata vermesin
        if (!$this->apiKey) {
            \Log::debug('EVDS API key not configured');
            return;
        }
    }

    /**
     * Get exchange rates for multiple currencies
     *
     * @param array $currencies
     * @param string $startDate (d-m-Y format)
     * @param string $endDate (d-m-Y format)
     * @param string $type (A=Alış, S=Satış)
     * @return array
     */
    public function getExchangeRates(array $currencies, string $startDate, string $endDate, string $type = 'A'): array
    {
        $cacheKey = 'evds_rates_' . md5(implode('_', $currencies) . "_{$startDate}_{$endDate}_{$type}");
        return $this->fetchFromApi($currencies, $startDate, $endDate, $type);
        return Cache::remember($cacheKey, 1800, function () use ($currencies, $startDate, $endDate, $type) { // Cache for 30 minutes
            return $this->fetchFromApi($currencies, $startDate, $endDate, $type);
        });
    }

    /**
     * Get today's exchange rates
     *
     * @param array $currencies
     * @param string $type
     * @return array
     */
    public function getTodayRates(array $currencies = ['USD', 'EUR'], string $type = 'A'): array
    {
        $today = Carbon::today()->format('d-m-Y');
        return $this->getExchangeRates($currencies, $today, $today, $type);
    }

    /**
     * Get average rates for a specific frequency
     *
     * @param array $currencies
     * @param string $startDate
     * @param string $endDate
     * @param int $frequency (5=Monthly, 6=Quarterly, 8=Yearly)
     * @return array
     */
    public function getAverageRates(array $currencies, string $startDate, string $endDate, int $frequency = 5): array
    {
        $cacheKey = 'evds_avg_rates_' . md5(implode('_', $currencies) . "_{$startDate}_{$endDate}_{$frequency}");

        return Cache::remember($cacheKey, 3600, function () use ($currencies, $startDate, $endDate, $frequency) { // Cache for 1 hour
            return $this->fetchAverageFromApi($currencies, $startDate, $endDate, $frequency);
        });
    }

    /**
     * Get specific currency rate for a date range
     *
     * @param string $currency
     * @param string $startDate
     * @param string $endDate
     * @param string $type
     * @return array
     */
    public function getCurrencyHistory(string $currency, string $startDate, string $endDate, string $type = 'A'): array
    {
        return $this->getExchangeRates([$currency], $startDate, $endDate, $type);
    }

    /**
     * Fetch data from EVDS API
     *
     * @param array $currencies
     * @param string $startDate
     * @param string $endDate
     * @param string $type
     * @return array
     */
    private function fetchFromApi(array $currencies, string $startDate, string $endDate, string $type): array
    {
        // Build series codes based on EVDS documentation
        $seriesCodes = [];
        foreach ($currencies as $currency) {
            $seriesCodes[] = "TP.DK.{$currency}.{$type}.YTL";
        }

        $seriesParam = implode('-', $seriesCodes);
        $url = "{$this->baseUrl}/series={$seriesParam}&startDate={$startDate}&endDate={$endDate}&type=json";



        $response = Http::withOptions([
            'verify' => env('HTTP_VERIFY_SSL', false)
        ])->withHeaders([
            'key' => $this->apiKey
        ])->timeout(30)->get($url);

        if (!$response->successful()) {
            throw new \Exception("EVDS API Error: HTTP {$response->status()} - " . $response->body());
        }

        $data = $response->json();

        if (!isset($data['items']) || empty($data['items'])) {
            return [];
        }

        return $this->formatResponseData($data['items'], $currencies, $type);
    }

    /**
     * Fetch average data from EVDS API with frequency transformation
     *
     * @param array $currencies
     * @param string $startDate
     * @param string $endDate
     * @param int $frequency
     * @return array
     */
    private function fetchAverageFromApi(array $currencies, string $startDate, string $endDate, int $frequency): array
    {
        $seriesCodes = [];
        $aggregationTypes = [];
        $formulas = [];

        foreach ($currencies as $currency) {
            $seriesCodes[] = "TP.DK.{$currency}.A.YTL";
            $aggregationTypes[] = 'avg';
            $formulas[] = '0'; // Level (no transformation)
        }

        $seriesParam = implode('-', $seriesCodes);
        $aggregationParam = implode('-', $aggregationTypes);
        $formulasParam = implode('-', $formulas);

        $url = "{$this->baseUrl}/series={$seriesParam}&startDate={$startDate}&endDate={$endDate}&type=json&aggregationTypes={$aggregationParam}&formulas={$formulasParam}&frequency={$frequency}";

        $response = Http::withHeaders([
            'key' => $this->apiKey
        ])->timeout(30)->get($url);

        if (!$response->successful()) {
            throw new \Exception("EVDS API Error: HTTP {$response->status()} - " . $response->body());
        }

        $data = $response->json();

        if (!isset($data['items']) || empty($data['items'])) {
            return [];
        }

        return $this->formatResponseData($data['items'], $currencies, 'A', true);
    }

    /**
     * Format API response data for frontend consumption
     *
     * @param array $items
     * @param array $currencies
     * @param string $type
     * @param bool $isAverage
     * @return array
     */
    private function formatResponseData(array $items, array $currencies, string $type, bool $isAverage = false): array
    {
        $formattedData = [];

        foreach ($items as $item) {
            $date = $item['Tarih'] ?? null;
            if (!$date) continue;

            try {
                $carbonDate = Carbon::createFromFormat('d-m-Y', $date);
                $dateEntry = [
                    'date' => $date,
                    'date_iso' => $carbonDate->format('Y-m-d'),
                    'date_formatted' => $carbonDate->format('d.m.Y'),
                    'timestamp' => $carbonDate->timestamp,
                    'rates' => []
                ];

                foreach ($currencies as $currency) {
                    // EVDS API returns field names with underscores instead of dots
                    $fieldName = "TP_DK_{$currency}_{$type}_YTL";
                    $value = $item[$fieldName] ?? null;

                    if ($value !== null && $value !== '' && is_numeric($value)) {
                        $cur_id = $this->getCurrencyId($currency);
                        $numericValue = (float) $value;
                        $dateEntry['rates'][$currency] = [
                            'currency' => $currency,
                            'cur_id' => $cur_id,
                            'currency_name' => $this->getCurrencyName($currency),
                            'value' => $numericValue,
                            'formatted' => number_format($numericValue, 4, ',', '.') . ' TL',
                            'type' => $type === 'A' ? 'A' : 'S',
                            'is_average' => $isAverage
                        ];
                    }
                }

                if (!empty($dateEntry['rates'])) {
                    $formattedData[] = $dateEntry;
                }
            } catch (\Exception $e) {
                // Skip invalid dates
                continue;
            }
        }

        // Sort by date descending (newest first)
        usort($formattedData, function ($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });

        return $formattedData;
    }

    /**
     * Get currency display name
     *
     * @param string $currencyCode
     * @return string
     */
    private function getCurrencyName(string $currencyCode): string
    {
        $currencyNames = [
            'USD' => 'ABD Doları',
            'EUR' => 'Euro',
            'GBP' => 'İngiliz Sterlini',
            'CHF' => 'İsviçre Frangı',
            'JPY' => 'Japon Yeni',
            'CAD' => 'Kanada Doları',
            'AUD' => 'Avustralya Doları',
        ];

        return $currencyNames[$currencyCode] ?? $currencyCode;
    }

    /**
     * Get list of supported currencies
     *
     * @return array
     */
    public function getSupportedCurrencies(): array
    {
        return [
            'USD' => [
                'name' => 'ABD Doları',
                'symbol' => '$',
                'code' => 'USD'
            ],
            'EUR' => [
                'name' => 'Euro',
                'symbol' => '€',
                'code' => 'EUR'
            ],
            'GBP' => [
                'name' => 'İngiliz Sterlini',
                'symbol' => '£',
                'code' => 'GBP'
            ],
            'CHF' => [
                'name' => 'İsviçre Frangı',
                'symbol' => 'CHF',
                'code' => 'CHF'
            ],
            'JPY' => [
                'name' => 'Japon Yeni',
                'symbol' => '¥',
                'code' => 'JPY'
            ],
            'CAD' => [
                'name' => 'Kanada Doları',
                'symbol' => 'C$',
                'code' => 'CAD'
            ],
            'AUD' => [
                'name' => 'Avustralya Doları',
                'symbol' => 'A$',
                'code' => 'AUD'
            ]
        ];
    }

    /**
     * Convert rate from one currency to another
     *
     * @param float $amount
     * @param string $fromCurrency
     * @param string $toCurrency
     * @param string $date
     * @return array
     */
    public function convertCurrency(float $amount, string $fromCurrency, string $toCurrency, string $date = null): array
    {
        if ($fromCurrency === $toCurrency) {
            return [
                'from_amount' => $amount,
                'from_currency' => $fromCurrency,
                'to_amount' => $amount,
                'to_currency' => $toCurrency,
                'rate' => 1.0,
                'date' => $date ?? Carbon::today()->format('d-m-Y')
            ];
        }

        $date = $date ?? Carbon::today()->format('d-m-Y');

        if ($toCurrency === 'TRY' || $toCurrency === 'TL') {
            // Converting from foreign currency to TRY
            $rates = $this->getExchangeRates([$fromCurrency], $date, $date, 'A');
            if (!empty($rates) && isset($rates[0]['rates'][$fromCurrency])) {
                $rate = $rates[0]['rates'][$fromCurrency]['value'];
                $convertedAmount = $amount * $rate;

                return [
                    'from_amount' => $amount,
                    'from_currency' => $fromCurrency,
                    'to_amount' => $convertedAmount,
                    'to_currency' => 'TRY',
                    'rate' => $rate,
                    'date' => $date
                ];
            }
        } elseif ($fromCurrency === 'TRY' || $fromCurrency === 'TL') {
            // Converting from TRY to foreign currency
            $rates = $this->getExchangeRates([$toCurrency], $date, $date, 'S');
            if (!empty($rates) && isset($rates[0]['rates'][$toCurrency])) {
                $rate = $rates[0]['rates'][$toCurrency]['value'];
                $convertedAmount = $amount / $rate;

                return [
                    'from_amount' => $amount,
                    'from_currency' => 'TRY',
                    'to_amount' => $convertedAmount,
                    'to_currency' => $toCurrency,
                    'rate' => $rate,
                    'date' => $date
                ];
            }
        }

        throw new \Exception("Dönüşüm için gerekli kur bilgisi bulunamadı: {$fromCurrency} -> {$toCurrency}");
    }

    public function getCurrencyId(string $currencyCode): int
    {
        $currencyIds = [
            'USD' => 116,
            'EUR' => 115,
            'GBP' => 117,
            'CHF' => 120,
            'JPY' => 126,
            'CAD' => 122,
            'AUD' => 118
        ];

        return $currencyIds[$currencyCode] ?? 0;
    }
}
