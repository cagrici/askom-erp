<?php

namespace App\Console\Commands;

use App\Services\LogoProductSyncService;
use Illuminate\Console\Command;

class SyncNewLogoProducts extends Command
{
    protected $signature = 'logo:sync-new-products
                            {--firm= : Logo firm number (default: env LOGO_FIRM_NO)}
                            {--check=50 : Number of latest Logo products to check}';

    protected $description = 'Check latest Logo products and import any that are missing locally';

    protected LogoProductSyncService $syncService;

    public function __construct(LogoProductSyncService $syncService)
    {
        parent::__construct();
        $this->syncService = $syncService;
    }

    public function handle()
    {
        $firmNo = (int) ($this->option('firm') ?? config('services.logo.firm_no', 1));
        $checkCount = (int) $this->option('check');

        $this->info("Checking last {$checkCount} Logo products (Firm: {$firmNo})...");

        $result = $this->syncService->syncNewProducts($firmNo, $checkCount, null, function ($info) {
            if ($info['type'] === 'total') {
                if ($info['total'] === 0) {
                    $this->info('No new products found.');
                } else {
                    $this->info("Found {$info['total']} new product(s). Importing...");
                }
            } elseif ($info['type'] === 'done') {
                $this->info("Imported: {$info['created']} | Errors: {$info['errors']}");
            }
        });

        if (!$result['success']) {
            $this->error('Sync failed: ' . $result['error']);
            return Command::FAILURE;
        }

        $stats = $result['stats'];

        if ($stats['total'] === 0) {
            return Command::SUCCESS;
        }

        $this->info("Done: {$stats['created']} new product(s) added.");

        if (!empty($stats['errors'])) {
            $this->warn('Errors:');
            foreach (array_slice($stats['errors'], 0, 10) as $error) {
                $this->line("  - {$error}");
            }
        }

        return Command::SUCCESS;
    }
}
