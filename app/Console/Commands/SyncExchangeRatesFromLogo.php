<?php

namespace App\Console\Commands;

use App\Models\ExchangeRate;
use App\Services\LogoService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncExchangeRatesFromLogo extends Command
{
    protected $signature = 'logo:sync-exchange-rates
                            {--date= : Belirli bir tarih için kurları çek (YYYY-MM-DD)}
                            {--days=1 : Kaç günlük kur çekilecek (varsayılan: 1 = sadece bugün)}
                            {--all : Logo\'daki tüm geçmiş kurları çek}
                            {--currencies=USD,EUR,GBP : Çekilecek para birimleri}
                            {--force : Mevcut kurları güncelle}
                            {--dry-run : Kaydetmeden göster}';

    protected $description = 'Logo Tiger ERP\'den döviz kurlarını senkronize et';

    /**
     * Logo Tiger RATES sütun açıklamaları:
     * RATES1 = Döviz Alış (Forex Buying)
     * RATES2 = Döviz Satış (Forex Selling)
     * RATES3 = Efektif Alış (Banknote Buying)
     * RATES4 = Efektif Satış (Banknote Selling)
     */
    protected array $rateTypeMap = [
        'RATES1' => 'A',  // Alış (Buy)
        'RATES2' => 'S',  // Satış (Sell)
    ];

    /**
     * Logo CRTYPE → ISO para birimi kodu eşleştirmesi
     * L_CURRENCYLIST tablosundan alınmıştır
     */
    protected array $currencyTypeMap = [];

    public function handle(): int
    {
        $firmNo = LogoService::getDefaultFirmNo();
        $exchangeTable = sprintf('LG_EXCHANGE_%03d', $firmNo);

        $this->info("Logo döviz kuru senkronizasyonu başlıyor (Firma: {$firmNo})");

        // L_CURRENCYLIST'ten CRTYPE → CURCODE mapping'i al
        $this->loadCurrencyMapping($firmNo);

        if (empty($this->currencyTypeMap)) {
            $this->error('Para birimi eşleştirmesi bulunamadı!');
            return self::FAILURE;
        }

        $requestedCurrencies = array_map('trim', explode(',', $this->option('currencies')));
        $force = $this->option('force');
        $dryRun = $this->option('dry-run');

        // Tarih aralığını belirle
        $dates = $this->getDateRange();

        $stats = ['total' => 0, 'created' => 0, 'updated' => 0, 'skipped' => 0];

        foreach ($dates as $date) {
            $logoDate = $this->dateToLogoFormat($date);

            $this->info("Tarih: {$date->format('Y-m-d')} (Logo DATE_: {$logoDate})");

            // İstenen para birimlerinin CRTYPE değerlerini bul
            $crTypes = $this->getCrTypesForCurrencies($requestedCurrencies);

            if (empty($crTypes)) {
                $this->warn("  İstenen para birimleri için CRTYPE bulunamadı: " . implode(', ', $requestedCurrencies));
                continue;
            }

            // Logo'dan kurları çek
            $rates = DB::connection('logo')->select(
                "SELECT CRTYPE, RATES1, RATES2, RATES3, RATES4
                 FROM {$exchangeTable}
                 WHERE DATE_ = ? AND CRTYPE IN (" . implode(',', $crTypes) . ")",
                [$logoDate]
            );

            if (empty($rates)) {
                $this->warn("  Bu tarih için Logo'da kur bulunamadı.");
                continue;
            }

            foreach ($rates as $rate) {
                $currencyCode = $this->currencyTypeMap[$rate->CRTYPE] ?? null;
                if (!$currencyCode || !in_array($currencyCode, $requestedCurrencies)) {
                    continue;
                }

                $stats['total']++;

                // Alış ve Satış kurlarını kaydet
                foreach ($this->rateTypeMap as $rateColumn => $rateType) {
                    $value = $rate->{$rateColumn};

                    if ($value <= 0) {
                        continue;
                    }

                    $dateStr = $date->format('Y-m-d');

                    if ($dryRun) {
                        $typeLabel = $rateType === 'A' ? 'Alış' : 'Satış';
                        $this->line("  [DRY-RUN] {$currencyCode} {$typeLabel}: {$value}");
                        continue;
                    }

                    $existing = ExchangeRate::where('date', $dateStr)
                        ->where('currency', $currencyCode)
                        ->where('type', $rateType)
                        ->first();

                    if ($existing) {
                        if ($force) {
                            $existing->update([
                                'value' => $value,
                                'rate_timestamp' => now(),
                                'raw_data' => [
                                    'source' => 'logo',
                                    'crtype' => $rate->CRTYPE,
                                    'rates1' => $rate->RATES1,
                                    'rates2' => $rate->RATES2,
                                    'rates3' => $rate->RATES3,
                                    'rates4' => $rate->RATES4,
                                ],
                            ]);
                            $stats['updated']++;
                            $this->line("  Güncellendi: {$currencyCode} ({$rateType}) = {$value}");
                        } else {
                            $stats['skipped']++;
                        }
                    } else {
                        $currencyName = $this->getCurrencyName($rate->CRTYPE, $firmNo);

                        ExchangeRate::create([
                            'date' => $dateStr,
                            'currency' => $currencyCode,
                            'cur_id' => $rate->CRTYPE,
                            'currency_name' => $currencyName,
                            'value' => $value,
                            'type' => $rateType,
                            'is_average' => false,
                            'rate_timestamp' => now(),
                            'raw_data' => [
                                'source' => 'logo',
                                'crtype' => $rate->CRTYPE,
                                'rates1' => $rate->RATES1,
                                'rates2' => $rate->RATES2,
                                'rates3' => $rate->RATES3,
                                'rates4' => $rate->RATES4,
                            ],
                        ]);
                        $stats['created']++;
                        $this->line("  Eklendi: {$currencyCode} ({$rateType}) = {$value}");
                    }
                }
            }
        }

        $this->newLine();
        $this->info("Tamamlandı! Toplam: {$stats['total']}, Eklenen: {$stats['created']}, Güncellenen: {$stats['updated']}, Atlanan: {$stats['skipped']}");

        Log::info('Logo exchange rate sync completed', $stats);

        return self::SUCCESS;
    }

    /**
     * L_CURRENCYLIST tablosundan CRTYPE → CURCODE eşleştirmesini yükle
     */
    protected function loadCurrencyMapping(int $firmNo): void
    {
        $currencies = DB::connection('logo')->select(
            "SELECT CURTYPE, CURCODE, CURNAME
             FROM L_CURRENCYLIST
             WHERE FIRMNR = ? AND CURINUSE = 1
             ORDER BY CURTYPE",
            [$firmNo]
        );

        foreach ($currencies as $c) {
            $this->currencyTypeMap[$c->CURTYPE] = $c->CURCODE;
        }

        $this->info("  " . count($this->currencyTypeMap) . " para birimi eşleştirmesi yüklendi");
    }

    /**
     * İstenen para birimleri için CRTYPE değerlerini döndür
     */
    protected function getCrTypesForCurrencies(array $currencies): array
    {
        $crTypes = [];
        foreach ($this->currencyTypeMap as $crType => $curCode) {
            if (in_array($curCode, $currencies)) {
                $crTypes[] = $crType;
            }
        }
        return $crTypes;
    }

    /**
     * Para birimi adını al
     */
    protected function getCurrencyName(int $crType, int $firmNo): ?string
    {
        $result = DB::connection('logo')->selectOne(
            "SELECT CURNAME FROM L_CURRENCYLIST WHERE FIRMNR = ? AND CURTYPE = ?",
            [$firmNo, $crType]
        );
        return $result?->CURNAME;
    }

    /**
     * Carbon tarihini Logo DATE_ formatına çevir
     * Logo formatı: YEAR * 65536 + MONTH * 256 + DAY
     */
    protected function dateToLogoFormat(Carbon $date): int
    {
        return $date->year * 65536 + $date->month * 256 + $date->day;
    }

    /**
     * Logo DATE_ formatını Carbon'a çevir
     */
    protected function logoFormatToDate(int $logoDate): Carbon
    {
        $year = intdiv($logoDate, 65536);
        $remainder = $logoDate % 65536;
        $month = intdiv($remainder, 256);
        $day = $remainder % 256;

        return Carbon::createFromDate($year, $month, $day);
    }

    /**
     * Tarih aralığını belirle
     */
    protected function getDateRange(): array
    {
        if ($this->option('date')) {
            return [Carbon::parse($this->option('date'))];
        }

        if ($this->option('all')) {
            return $this->getAllLogoDates();
        }

        $days = (int) $this->option('days');
        $dates = [];

        for ($i = 0; $i < $days; $i++) {
            $dates[] = Carbon::today()->subDays($i);
        }

        return $dates;
    }

    /**
     * Logo'daki tüm benzersiz kur tarihlerini al
     */
    protected function getAllLogoDates(): array
    {
        $firmNo = LogoService::getDefaultFirmNo();
        $exchangeTable = sprintf('LG_EXCHANGE_%03d', $firmNo);

        $logoDates = DB::connection('logo')->select(
            "SELECT DISTINCT DATE_ FROM {$exchangeTable} ORDER BY DATE_ ASC"
        );

        $dates = [];
        foreach ($logoDates as $row) {
            $dates[] = $this->logoFormatToDate($row->DATE_);
        }

        $this->info("  Logo'da " . count($dates) . " farklı tarih bulundu");

        return $dates;
    }
}
