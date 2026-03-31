<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\EvdsService;
use App\Models\ExchangeRate;
use Carbon\Carbon;

class ArchiveExchangeRates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'evds:archive-rates 
                           {--currencies=USD,EUR,GBP : Comma separated list of currencies}
                           {--days=7 : Number of days to fetch}
                           {--clean-old : Clean old rates (keep only last 365 days)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Archive exchange rates from EVDS API to database';

    private $evdsService;

    public function __construct(EvdsService $evdsService)
    {
        parent::__construct();
        $this->evdsService = $evdsService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $currencies = explode(',', $this->option('currencies'));
        $days = (int)$this->option('days');
        $cleanOld = $this->option('clean-old');

        $this->info("Arşivleme başlatılıyor...");
        $this->info("Para birimleri: " . implode(', ', $currencies));
        $this->info("Gün sayısı: " . $days);

        $endDate = Carbon::today();
        $startDate = $endDate->copy()->subDays($days - 1);

        $this->info("Tarih aralığı: " . $startDate->format('d-m-Y') . " - " . $endDate->format('d-m-Y'));

        try {
            // Fetch buy rates
            $this->line("Alış kurları getiriliyor...");
            $buyRates = $this->evdsService->getExchangeRates(
                $currencies,
                $startDate->format('d-m-Y'),
                $endDate->format('d-m-Y'),
                'A'
            );

            if ($buyRates) {
                $archivedBuy = ExchangeRate::archiveRates($buyRates);
                $this->info("Alış kurları arşivlendi: " . $archivedBuy . " kayıt");
            }

            // Fetch sell rates
            $this->line("Satış kurları getiriliyor...");
            $sellRates = $this->evdsService->getExchangeRates(
                $currencies,
                $startDate->format('d-m-Y'),
                $endDate->format('d-m-Y'),
                'S'
            );

            if ($sellRates) {
                $archivedSell = ExchangeRate::archiveRates($sellRates);
                $this->info("Satış kurları arşivlendi: " . $archivedSell . " kayıt");
            }

            $totalArchived = ($archivedBuy ?? 0) + ($archivedSell ?? 0);
            $this->info("Toplam arşivlenen kayıt: " . $totalArchived);

            // Clean old rates if requested
            if ($cleanOld) {
                $this->line("Eski kurlar temizleniyor...");
                $deleted = ExchangeRate::cleanOldRates(365);
                $this->info("Silinen eski kayıt sayısı: " . $deleted);
            }

            $this->info("Arşivleme tamamlandı!");

        } catch (\Exception $e) {
            $this->error("Hata oluştu: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}