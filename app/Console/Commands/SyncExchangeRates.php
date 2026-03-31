<?php

//# Bugünün kurlarını çek (USD, EUR, GBP)
//php artisan tcmb:sync-rates
//
//  # Belirli bir tarih için kurları çek
//  php artisan tcmb:sync-rates --date=2026-01-08
//
//  # Farklı para birimleri için
//  php artisan tcmb:sync-rates --currencies=USD,EUR,GBP,CHF
//
//  # Mevcut kurları güncelle
//  php artisan tcmb:sync-rates --force
//
//  # Test modu (kaydetmeden)
//  php artisan tcmb:sync-rates --dry-run

namespace App\Console\Commands;

use App\Models\ExchangeRate;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncExchangeRates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tcmb:sync-rates
                            {--date= : Specific date to sync (YYYY-MM-DD format)}
                            {--currencies=USD,EUR,GBP : Comma-separated list of currencies to sync}
                            {--force : Force update even if rates exist}
                            {--dry-run : Show what would be synced without saving}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync exchange rates from TCMB (Central Bank of Turkey)';

    /**
     * TCMB XML URLs
     */
    private const TCMB_TODAY_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';
    private const TCMB_ARCHIVE_URL = 'https://www.tcmb.gov.tr/kurlar/{year}{month}/{day}{month}{year}.xml';

    /**
     * Currency code to TCMB code mapping
     */
    private array $currencyMap = [
        'USD' => 'US DOLLAR',
        'EUR' => 'EURO',
        'GBP' => 'BRITISH POUND',
        'CHF' => 'SWISS FRANC',
        'JPY' => 'JAPENESE YEN',
        'SAR' => 'SAUDI RIYAL',
        'AUD' => 'AUSTRALIAN DOLLAR',
        'CAD' => 'CANADIAN DOLLAR',
        'SEK' => 'SWEDISH KRONA',
        'NOK' => 'NORWEGIAN KRONE',
        'DKK' => 'DANISH KRONE',
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dateOption = $this->option('date');
        $currencies = array_map('trim', explode(',', $this->option('currencies')));
        $force = $this->option('force');
        $dryRun = $this->option('dry-run');

        $date = $dateOption ? Carbon::parse($dateOption) : Carbon::today();

        $this->info("TCMB Exchange Rate Sync");
        $this->info("Date: {$date->format('Y-m-d')}");
        $this->info("Currencies: " . implode(', ', $currencies));

        if ($dryRun) {
            $this->warn("DRY RUN MODE - No data will be saved");
        }

        $this->newLine();

        try {
            $xmlData = $this->fetchRates($date);

            if (!$xmlData) {
                $this->error("Failed to fetch rates from TCMB");
                return Command::FAILURE;
            }

            $rateDate = $this->parseRateDate($xmlData);
            $this->info("Rate Date from TCMB: {$rateDate->format('Y-m-d')}");
            $this->newLine();

            $synced = 0;
            $skipped = 0;
            $updated = 0;

            foreach ($currencies as $currency) {
                $result = $this->syncCurrency($xmlData, $currency, $rateDate, $force, $dryRun);

                if ($result === 'synced') {
                    $synced++;
                } elseif ($result === 'updated') {
                    $updated++;
                } else {
                    $skipped++;
                }
            }

            $this->newLine();
            $this->info("Sync Complete:");
            $this->info("  New rates: {$synced}");
            $this->info("  Updated: {$updated}");
            $this->info("  Skipped: {$skipped}");

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            Log::error("TCMB Sync Error", ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return Command::FAILURE;
        }
    }

    /**
     * Fetch rates from TCMB
     */
    private function fetchRates(Carbon $date): ?\SimpleXMLElement
    {
        $isToday = $date->isToday();

        if ($isToday) {
            $url = self::TCMB_TODAY_URL;
        } else {
            $url = str_replace(
                ['{year}', '{month}', '{day}'],
                [$date->format('Y'), $date->format('m'), $date->format('d')],
                self::TCMB_ARCHIVE_URL
            );
        }

        $this->info("Fetching from: {$url}");

        try {
            $response = Http::timeout(30)->get($url);

            if (!$response->successful()) {
                $this->error("HTTP Error: " . $response->status());
                return null;
            }

            $xml = simplexml_load_string($response->body());

            if ($xml === false) {
                $this->error("Failed to parse XML");
                return null;
            }

            return $xml;

        } catch (\Exception $e) {
            $this->error("Request failed: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Parse rate date from XML
     */
    private function parseRateDate(\SimpleXMLElement $xml): Carbon
    {
        // Use Turkish date format (Tarih attribute) which is dd.mm.yyyy
        $dateAttr = (string) $xml['Tarih'];

        return Carbon::createFromFormat('d.m.Y', $dateAttr);
    }

    /**
     * Sync a specific currency
     */
    private function syncCurrency(
        \SimpleXMLElement $xml,
        string $currencyCode,
        Carbon $rateDate,
        bool $force,
        bool $dryRun
    ): string {
        $currencyNode = $this->findCurrencyNode($xml, $currencyCode);

        if (!$currencyNode) {
            $this->warn("  {$currencyCode}: Currency not found in XML");
            return 'skipped';
        }

        $unit = (int) $currencyNode->Unit;
        $currencyName = (string) $currencyNode->Isim;
        $forexBuying = $this->parseDecimal((string) $currencyNode->ForexBuying);
        $forexSelling = $this->parseDecimal((string) $currencyNode->ForexSelling);
        $banknoteBuying = $this->parseDecimal((string) $currencyNode->BanknoteBuying);
        $banknoteSelling = $this->parseDecimal((string) $currencyNode->BanknoteSelling);
        $crossRateUsd = $this->parseDecimal((string) $currencyNode->CrossRateUSD);

        // Normalize rates to unit 1
        $normalizedForexBuying = $forexBuying / $unit;
        $normalizedForexSelling = $forexSelling / $unit;
        $normalizedBanknoteBuying = $banknoteBuying / $unit;
        $normalizedBanknoteSelling = $banknoteSelling / $unit;

        $rawData = [
            'source' => 'TCMB',
            'unit' => $unit,
            'forex_buying' => $forexBuying,
            'forex_selling' => $forexSelling,
            'banknote_buying' => $banknoteBuying,
            'banknote_selling' => $banknoteSelling,
            'cross_rate_usd' => $crossRateUsd,
            'fetched_at' => now()->toIso8601String(),
        ];

        // Check if buy rate already exists (skip DB check in dry-run mode)
        $existingBuy = null;
        $existingSell = null;

        if (!$dryRun) {
            $existingBuy = ExchangeRate::where('date', $rateDate->format('Y-m-d'))
                ->where('currency', $currencyCode)
                ->where('type', 'A')
                ->first();

            $existingSell = ExchangeRate::where('date', $rateDate->format('Y-m-d'))
                ->where('currency', $currencyCode)
                ->where('type', 'S')
                ->first();
        }

        $result = 'skipped';

        // Sync buy rate (using forex buying as primary)
        if (!$existingBuy || $force) {
            $buyData = [
                'date' => $rateDate->format('Y-m-d'),
                'currency' => $currencyCode,
                'currency_name' => $currencyName,
                'value' => $normalizedForexBuying,
                'type' => 'A',
                'is_average' => false,
                'rate_timestamp' => now(),
                'raw_data' => $rawData,
            ];

            if (!$dryRun) {
                if ($existingBuy) {
                    $existingBuy->update($buyData);
                    $result = 'updated';
                } else {
                    ExchangeRate::create($buyData);
                    $result = 'synced';
                }
            } else {
                $result = 'synced'; // Would be synced in dry-run
            }

            $this->line("  {$currencyCode} Buy: {$normalizedForexBuying} TL" . ($existingBuy && $force ? ' (updated)' : ''));
        } else {
            $this->line("  {$currencyCode} Buy: Already exists (skipped)");
        }

        // Sync sell rate (using forex selling as primary)
        if (!$existingSell || $force) {
            $sellData = [
                'date' => $rateDate->format('Y-m-d'),
                'currency' => $currencyCode,
                'currency_name' => $currencyName,
                'value' => $normalizedForexSelling,
                'type' => 'S',
                'is_average' => false,
                'rate_timestamp' => now(),
                'raw_data' => $rawData,
            ];

            if (!$dryRun) {
                if ($existingSell) {
                    $existingSell->update($sellData);
                    if ($result !== 'synced') {
                        $result = 'updated';
                    }
                } else {
                    ExchangeRate::create($sellData);
                    if ($result !== 'synced') {
                        $result = 'synced';
                    }
                }
            }

            $this->line("  {$currencyCode} Sell: {$normalizedForexSelling} TL" . ($existingSell && $force ? ' (updated)' : ''));
        } else {
            $this->line("  {$currencyCode} Sell: Already exists (skipped)");
        }

        // Also log banknote (effective) rates
        $this->line("  {$currencyCode} Banknote Buy: {$normalizedBanknoteBuying} TL (stored in raw_data)");
        $this->line("  {$currencyCode} Banknote Sell: {$normalizedBanknoteSelling} TL (stored in raw_data)");

        return $result;
    }

    /**
     * Find currency node in XML
     */
    private function findCurrencyNode(\SimpleXMLElement $xml, string $currencyCode): ?\SimpleXMLElement
    {
        foreach ($xml->Currency as $currency) {
            $kod = (string) $currency['Kod'];
            if (strtoupper($kod) === strtoupper($currencyCode)) {
                return $currency;
            }
        }

        return null;
    }

    /**
     * Parse decimal value from TCMB format
     */
    private function parseDecimal(string $value): float
    {
        if (empty($value)) {
            return 0.0;
        }

        // TCMB uses dot as decimal separator
        return (float) $value;
    }
}
