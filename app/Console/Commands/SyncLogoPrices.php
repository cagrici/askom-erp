<?php

namespace App\Console\Commands;

use App\Services\LogoPriceSyncService;
use Illuminate\Console\Command;

class SyncLogoPrices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logo:sync-prices
                            {--firm= : Logo firma numarasi (default: env LOGO_FIRM_NO)}
                            {--limit= : Senkronize edilecek kayit sayisi limiti}
                            {--price-lists : Sadece fiyat listelerini senkronize et}
                            {--price-cards : Sadece fiyat kartlarini (fiyat listesi detaylarini) senkronize et}
                            {--all : Tum fiyat verilerini senkronize et (fiyat listeleri + kartlar + urun fiyatlari)}
                            {--stats : Senkronizasyon istatistiklerini goster}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Logo ERP\'den urun fiyatlarini senkronize et';

    protected LogoPriceSyncService $syncService;

    public function __construct(LogoPriceSyncService $syncService)
    {
        parent::__construct();
        $this->syncService = $syncService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Sadece istatistikleri goster
        if ($this->option('stats')) {
            $this->showStats();
            return Command::SUCCESS;
        }

        $firmNo = (int) ($this->option('firm') ?? config('services.logo.firm_no', 1));
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;

        $this->info('Logo Fiyat Senkronizasyonu Baslatiliyor...');
        $this->newLine();
        $this->info("Firma Numarasi: {$firmNo}");

        if ($limit) {
            $this->info("Limit: {$limit} kayit");
        }

        $this->newLine();

        // Urun Fiyatlarini Senkronize Et (PRCLIST tablosundan)
        $this->info('Urun Fiyatlari (PRCLIST) Senkronize Ediliyor...');
        $progressBar = $this->output->createProgressBar();
        $progressBar->start();

        $result = $this->syncService->syncProductPrices($firmNo, $limit);

        $progressBar->finish();
        $this->newLine(2);

        if ($result['success']) {
            $this->displayStats('Urun Fiyatlari', $result['stats'] ?? []);
            $this->newLine();
            $this->info('Senkronizasyon basariyla tamamlandi!');
            $this->newLine();
            $this->info('Istatistikleri gormek icin --stats parametresini kullanin');
            return Command::SUCCESS;
        } else {
            $this->error('Urun fiyati senkronizasyonu basarisiz: ' . ($result['error'] ?? 'Bilinmeyen hata'));
            return Command::FAILURE;
        }
    }

    /**
     * Istatistikleri goster
     */
    protected function showStats(): void
    {
        $this->info('Logo Fiyat Senkronizasyon Istatistikleri');
        $this->newLine();

        $stats = $this->syncService->getSyncStats();

        if (!$stats['success']) {
            $this->error('Istatistikler alinamadi: ' . $stats['error']);
            return;
        }

        $this->table(
            ['Metrik', 'Deger'],
            [
                ['Toplam Senkronize Urun', $stats['total_synced_products']],
                ['Logo Fiyatli Urunler', $stats['products_with_logo_price']],
                ['Fiyat Listeleri', $stats['total_price_lists']],
                ['Fiyat Kartlari', $stats['total_price_cards']],
            ]
        );

        if ($stats['last_price_sync']) {
            $this->newLine();
            $this->info('Son Fiyat Senkronizasyonu: ' . $stats['last_price_sync']);
        } else {
            $this->newLine();
            $this->warn('Henuz fiyat senkronizasyonu yapilmamis');
        }
    }

    /**
     * Tek bir islem icin istatistikleri goster
     */
    protected function displayStats(string $title, array $stats): void
    {
        if (empty($stats)) {
            return;
        }

        $this->info("  {$title} Sonuclari:");

        $tableData = [];

        if (isset($stats['total'])) {
            $tableData[] = ['Toplam Islenen', $stats['total']];
        }
        if (isset($stats['created'])) {
            $tableData[] = ['Olusturulan', $stats['created']];
        }
        if (isset($stats['updated'])) {
            $tableData[] = ['Guncellenen', $stats['updated']];
        }
        if (isset($stats['skipped'])) {
            $tableData[] = ['Atlanan', $stats['skipped']];
        }
        if (isset($stats['errors']) && is_array($stats['errors'])) {
            $tableData[] = ['Hatalar', count($stats['errors'])];
        }

        if (!empty($tableData)) {
            $this->table(['Metrik', 'Deger'], $tableData);
        }

        // Hatalari goster
        if (!empty($stats['errors'])) {
            $this->warn('  Hatalar:');
            $errorCount = 0;
            foreach ($stats['errors'] as $error) {
                if ($errorCount >= 5) {
                    $remainingErrors = count($stats['errors']) - 5;
                    $this->line("    ... ve {$remainingErrors} hata daha");
                    break;
                }
                $this->line('    - ' . $error);
                $errorCount++;
            }
        }
    }
}
