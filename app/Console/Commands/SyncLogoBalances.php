<?php

namespace App\Console\Commands;

use App\Services\LogoBalanceSyncService;
use Illuminate\Console\Command;

class SyncLogoBalances extends Command
{
    protected $signature = 'logo:sync-balances
                            {--firm= : Logo firma numarasi (default: env LOGO_FIRM_NO)}';

    protected $description = 'Logo ERP\'den cari hesap bakiyelerini senkronize et';

    protected LogoBalanceSyncService $syncService;

    public function __construct(LogoBalanceSyncService $syncService)
    {
        parent::__construct();
        $this->syncService = $syncService;
    }

    public function handle(): int
    {
        $firmNo = $this->option('firm') ? (int) $this->option('firm') : null;

        $this->info('Logo cari bakiye senkronizasyonu baslatiliyor...');

        $bar = null;
        $result = $this->syncService->syncBalances($firmNo, function ($event, $data) use (&$bar) {
            if ($event === 'total') {
                $bar = $this->output->createProgressBar($data);
                $bar->start();
            } elseif ($event === 'progress' && $bar) {
                $bar->setProgress($data);
            }
        });

        if ($bar) {
            $bar->finish();
            $this->newLine();
        }

        if ($result['success']) {
            $this->info("Senkronizasyon tamamlandi:");
            $this->table(
                ['Metrik', 'Deger'],
                [
                    ['Toplam LOGO kaydi', $result['total']],
                    ['Guncellenen', $result['updated']],
                    ['Eslesmeyenler (Logo ID yok)', $result['skipped']],
                    ['Bakiyesi sifirlanan', $result['zeroed']],
                ]
            );
            return Command::SUCCESS;
        } else {
            $this->error("Hata: " . $result['error']);
            return Command::FAILURE;
        }
    }
}
