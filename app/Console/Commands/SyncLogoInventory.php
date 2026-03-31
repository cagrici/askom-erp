<?php

namespace App\Console\Commands;

use App\Services\LogoInventorySyncService;
use Illuminate\Console\Command;

class SyncLogoInventory extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logo:sync-inventory
                            {--firm= : Logo firm number (default: env LOGO_FIRM_NO)}
                            {--limit= : Limit number of records to sync}
                            {--table= : Specific table name (optional, auto-detected if not provided)}
                            {--incremental : Sync only changed records since last sync}
                            {--no-continue-on-error : Stop on first error}
                            {--stats : Show sync statistics only}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync inventory/stock data from Logo ERP';

    protected LogoInventorySyncService $syncService;

    public function __construct(LogoInventorySyncService $syncService)
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
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $tableName = $this->option('table');
        $incrementalSync = $this->option('incremental');
        $continueOnError = !$this->option('no-continue-on-error');

        $this->info('Starting Logo Inventory/Stock Synchronization...');
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
            $this->info("📦 Limit: {$limit} stock records");
        } else {
            $this->info("📦 All stock records");
        }

        $this->newLine();

        $progressBar = $this->output->createProgressBar();
        $progressBar->start();

        $result = $this->syncService->syncInventory($firmNo, $limit, $tableName, $incrementalSync, $continueOnError);

        $progressBar->finish();
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
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Processed', $stats['total']],
                ['Created', $stats['created']],
                ['Updated', $stats['updated']],
                ['Skipped', $stats['skipped']],
                ['Errors', count($stats['errors'])],
            ]
        );

        if (!empty($stats['errors'])) {
            $this->newLine();
            $this->warn('⚠️  Errors occurred during sync:');
            foreach (array_slice($stats['errors'], 0, 10) as $error) {
                $this->line('  • ' . $error);
            }
            if (count($stats['errors']) > 10) {
                $this->line('  ... and ' . (count($stats['errors']) - 10) . ' more errors');
            }
        }

        $this->newLine();
        $this->info('📊 Run with --stats to see overall statistics');

        return Command::SUCCESS;
    }

    /**
     * Show sync statistics
     */
    protected function showStats(): void
    {
        $this->info('📊 Logo Inventory Sync Statistics');
        $this->newLine();

        $stats = $this->syncService->getSyncStats();

        if (!$stats['success']) {
            $this->error('Failed to get statistics: ' . $stats['error']);
            return;
        }

        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Stock Records', $stats['total_stock_records']],
                ['Total Warehouses', $stats['total_warehouses']],
                ['Total Quantity On Hand', number_format($stats['total_quantity_on_hand'])],
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
