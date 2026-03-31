<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ExchangeRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'currency',
        'cur_id',
        'currency_name',
        'value',
        'type',
        'is_average',
        'rate_timestamp',
        'raw_data'
    ];

    protected $casts = [
        'date' => 'date',
        'value' => 'decimal:4',
        'is_average' => 'boolean',
        'rate_timestamp' => 'datetime',
        'raw_data' => 'array'
    ];

    /**
     * Get exchange rate for specific currency and date.
     * Hafta sonu/tatil günlerinde kur bulunamazsa en yakın önceki tarihteki kuru döndürür.
     */
    public static function getRate($currency, $date, $type = 'A')
    {
        $rate = self::where('currency', $currency)
            ->where('date', $date)
            ->where('type', $type)
            ->first();

        if ($rate) {
            return $rate;
        }

        // Tam tarih bulunamazsa en yakın önceki tarihteki kuru al
        // (hafta sonu, tatil günleri vs. için)
        return self::where('currency', $currency)
            ->where('type', $type)
            ->where('date', '<=', $date)
            ->orderBy('date', 'desc')
            ->first();
    }

    /**
     * Get latest rates for all currencies
     */
    public static function getLatestRates($type = 'A')
    {
        return self::select('currency', 'currency_name', 'value', 'date')
            ->where('type', $type)
            ->whereIn('date', function($query) {
                $query->selectRaw('MAX(date)')
                    ->from('exchange_rates')
                    ->groupBy('currency');
            })
            ->get()
            ->keyBy('currency');
    }

    /**
     * Get historical rates for a currency
     */
    public static function getHistoricalRates($currency, $startDate, $endDate, $type = 'A')
    {
        return self::where('currency', $currency)
            ->where('type', $type)
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date')
            ->get();
    }

    /**
     * Archive exchange rates from EVDS API response
     */
    public static function archiveRates(array $apiData)
    {
        $savedCount = 0;

        foreach ($apiData as $dayData) {
            $date = Carbon::createFromFormat('d-m-Y', $dayData['date'])->format('Y-m-d');
            $timestamp = isset($dayData['timestamp']) ? Carbon::createFromTimestamp($dayData['timestamp']) : null;

            foreach ($dayData['rates'] as $currency => $rateData) {
                $existingRate = self::getRate($currency, $date, $rateData['type'] ?? 'A');

                if (!$existingRate) {
                    self::create([
                        'date' => $date,
                        'currency' => $currency,
                        'currency_name' => $rateData['currency_name'] ?? null,
                        'value' => $rateData['value'],
                        'type' => $rateData['type'] ?? 'A',
                        'is_average' => $rateData['is_average'] ?? false,
                        'rate_timestamp' => $timestamp,
                        'raw_data' => $rateData
                    ]);
                    $savedCount++;
                }
            }
        }

        return $savedCount;
    }

    /**
     * Clean old exchange rates (keep only last N days)
     */
    public static function cleanOldRates($keepDays = 365)
    {
        $cutoffDate = Carbon::now()->subDays($keepDays);
        return self::where('date', '<', $cutoffDate)->delete();
    }

    /**
     * Convert amount from one currency to another
     */
    public static function convert($amount, $fromCurrency, $toCurrency, $date = null, $type = 'A')
    {
        if ($fromCurrency === $toCurrency) {
            return $amount;
        }

        $date = $date ?: Carbon::today()->format('Y-m-d');

        // Assuming TRY as base currency
        if ($fromCurrency === 'TRY') {
            $toRate = self::getRate($toCurrency, $date, $type);
            return $toRate ? $amount / $toRate->value : null;
        }

        if ($toCurrency === 'TRY') {
            $fromRate = self::getRate($fromCurrency, $date, $type);
            return $fromRate ? $amount * $fromRate->value : null;
        }

        // Convert through TRY
        $fromRate = self::getRate($fromCurrency, $date, $type);
        $toRate = self::getRate($toCurrency, $date, $type);

        if ($fromRate && $toRate) {
            $tryAmount = $amount * $fromRate->value;
            return $tryAmount / $toRate->value;
        }

        return null;
    }

    /**
     * Get formatted value
     */
    public function getFormattedValueAttribute()
    {
        return number_format($this->value, 4, ',', '.') . ' TL';
    }

    /**
     * Scope for specific currency
     */
    public function scopeForCurrency($query, $currency)
    {
        return $query->where('currency', $currency);
    }

    /**
     * Scope for specific date range
     */
    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    /**
     * Scope for buy rates
     */
    public function scopeBuyRates($query)
    {
        return $query->where('type', 'A');
    }

    /**
     * Scope for sell rates
     */
    public function scopeSellRates($query)
    {
        return $query->where('type', 'S');
    }
}
