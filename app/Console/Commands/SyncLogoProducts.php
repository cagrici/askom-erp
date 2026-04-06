<?php

namespace App\Console\Commands;

use App\Services\LogoProductSyncService;
use Illuminate\Console\Command;

class SyncLogoProducts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logo:sync-products
                            {--firm= : Logo firm number (default: env LOGO_FIRM_NO)}
                            {--limit= : Limit number of records to sync}
                            {--table= : Specific table name (optional, auto-detected if not provided)}
                            {--incremental : Sync only changed records since last sync}
                            {--deactivate-orphans : Only run orphan deactivation (skip product sync)}
                            {--stats : Show sync statistics only}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync products from Logo ERP';

    protected LogoProductSyncService $syncService;
    protected $progressBar = null;
    protected int $totalRecords = 0;

    public function __construct(LogoProductSyncService $syncService)
    {
        parent::__construct();
        $this->syncService = $syncService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Show stats only
        if ($this->option('stats')) {
            $this->showStats();
            return Command::SUCCESS;
        }

        $firmNo = (int) ($this->option('firm') ?? config('services.logo.firm_no', 1));

        // Run only orphan deactivation
        if ($this->option('deactivate-orphans')) {
            return $this->runOrphanDeactivation($firmNo);
        }

        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $tableName = $this->option('table');
        $incrementalSync = $this->option('incremental');

        $this->info('Starting Logo Product Synchronization...');
        $this->newLine();

        if ($tableName) {
            $this->info("📊 Firm Number: {$firmNo} | Table: {$tableName}");
        } else {
            $this->info("📊 Firm Number: {$firmNo} | Table: Auto-detect");
        }

        if ($incrementalSync) {
            $this->info("🔁 Mode: Incremental (only changed records)");
        } else {
            $this->info("🔁 Mode: Full sync");
        }

        if ($limit) {
            $this->info("📦 Limit: {$limit} records");
        } else {
            $this->info("📦 All active products");
        }

        $this->newLine();

        $result = $this->syncService->syncProducts($firmNo, $limit, $tableName, true, $incrementalSync, function ($info) {
            // Progress callback from service
            if ($info['type'] === 'total') {
                $this->totalRecords = $info['total'];
                $this->progressBar = $this->output->createProgressBar($info['total']);
                $this->progressBar->setFormat(' %current%/%max% [%bar%] %percent:3s%% | Created: %created% | Updated: %updated% | Skipped: %skipped%');
                $this->progressBar->setMessage('0', 'created');
                $this->progressBar->setMessage('0', 'updated');
                $this->progressBar->setMessage('0', 'skipped');
                $this->progressBar->start();
            } elseif ($info['type'] === 'page_done' && isset($this->progressBar)) {
                $this->progressBar->setMessage((string) $info['created'], 'created');
                $this->progressBar->setMessage((string) $info['updated'], 'updated');
                $this->progressBar->setMessage((string) $info['skipped'], 'skipped');
                $this->progressBar->advance($info['page_count']);
            }
        });

        if (isset($this->progressBar)) {
            $this->progressBar->finish();
        }
        $this->newLine(2);

        if (!$result['success']) {
            $this->error('❌ Synchronization failed!');
            $this->error('Error: ' . $result['error']);
            return Command::FAILURE;
        }

        $stats = $result['stats'];

        $this->info('✅ Synchronization completed successfully!');
        $this->newLine();

        // Display statistics
        $rows = [
            ['Total Processed', $stats['total']],
            ['Created', $stats['created']],
            ['Updated', $stats['updated']],
            ['Skipped', $stats['skipped']],
            ['Errors', count($stats['errors'])],
        ];

        if (isset($stats['deactivated'])) {
            $rows[] = ['Deactivated (orphans)', $stats['deactivated']];
        }
        if (isset($stats['reactivated'])) {
            $rows[] = ['Reactivated', $stats['reactivated']];
        }

        $this->table(['Metric', 'Count'], $rows);

        if (!empty($stats['errors'])) {
            $this->newLine();
            $this->warn('⚠️  Errors occurred during sync:');
            foreach ($stats['errors'] as $error) {
                $this->line('  • ' . $error);
            }
        }

        $this->newLine();
        $this->info('📊 Run with --stats to see overall statistics');

        return Command::SUCCESS;
    }

    /**
     * Run orphan product deactivation only
     */
    protected function runOrphanDeactivation(int $firmNo): int
    {
        $this->info("Starting orphan product deactivation for firm {$firmNo}...");
        $this->newLine();

        $result = $this->syncService->deactivateOrphanProducts($firmNo, null, function ($info) {
            if ($info['type'] === 'orphan_check_start') {
                $this->info("Checking {$info['total']} products against Logo...");
            } elseif ($info['type'] === 'orphan_check_done') {
                $this->newLine();
                $this->info("Deactivated: {$info['deactivated']}");
                $this->info("Reactivated: {$info['reactivated']}");
            }
        });

        if (!$result['success']) {
            $this->error('Failed: ' . ($result['error'] ?? 'Unknown error'));
            return Command::FAILURE;
        }

        $this->newLine();
        $this->table(
            ['Metric', 'Count'],
            [
                ['Deactivated (not in Logo)', $result['deactivated']],
                ['Reactivated (back in Logo)', $result['reactivated']],
            ]
        );

        return Command::SUCCESS;
    }

    /**
     * Show sync statistics
     */
    protected function showStats(): void
    {
        $this->info('📊 Logo Product Sync Statistics');
        $this->newLine();

        $stats = $this->syncService->getSyncStats();

        if (!$stats['success']) {
            $this->error('Failed to get statistics: ' . $stats['error']);
            return;
        }

        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Synced Products', $stats['total_synced']],
                ['Active Products', $stats['active']],
                ['Inactive Products', $stats['inactive']],
                ['Can Be Purchased', $stats['can_be_purchased']],
                ['Can Be Sold', $stats['can_be_sold']],
            ]
        );

        if ($stats['last_sync']) {
            $this->newLine();
            $this->info('🕐 Last Sync: ' . $stats['last_sync']);
        } else {
            $this->newLine();
            $this->warn('⚠️  No sync records found');
        }
    }
}
