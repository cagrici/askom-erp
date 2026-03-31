<?php

namespace App\Console\Commands;

use App\Services\LogoOrderSyncService;
use Illuminate\Console\Command;

class SyncLogoOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logo:sync-orders
                            {--firm= : Logo firm number (default: env LOGO_FIRM_NO)}
                            {--limit= : Limit number of records to sync}
                            {--table= : Specific table name (optional, auto-detected if not provided)}
                            {--update-totals : Update order totals from Logo for orders with zero totals}
                            {--update-all : Update ALL orders from Logo (totals + user info)}
                            {--stats : Show sync statistics only}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync order lines from Logo ERP';

    protected LogoOrderSyncService $syncService;

    public function __construct(LogoOrderSyncService $syncService)
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

        // Update totals only (zero totals)
        if ($this->option('update-totals')) {
            return $this->handleUpdateTotals(onlyZeroTotals: true);
        }

        // Update all orders (totals + user info)
        if ($this->option('update-all')) {
            return $this->handleUpdateTotals(onlyZeroTotals: false);
        }

        $firmNo = (int) ($this->option('firm') ?? config('services.logo.firm_no', 1));
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $tableName = $this->option('table');

        $this->info('Starting Logo Order Line Synchronization...');
        $this->newLine();

        if ($tableName) {
            $this->info("📊 Firm Number: {$firmNo} | Table: {$tableName}");
        } else {
            $this->info("📊 Firm Number: {$firmNo} | Table: Auto-detect");
        }

        if ($limit) {
            $this->info("📦 Limit: {$limit} records");
        } else {
            $this->info("📦 All order lines");
        }

        $this->newLine();

        $progressBar = $this->output->createProgressBar();
        $progressBar->start();

        $result = $this->syncService->syncOrderLines($firmNo, $limit, $tableName);

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
     * Handle updating order totals and user info
     */
    protected function handleUpdateTotals(bool $onlyZeroTotals = true): int
    {
        $firmNo = (int) ($this->option('firm') ?? config('services.logo.firm_no', 1));
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;

        if ($onlyZeroTotals) {
            $this->info('🔄 Updating Orders with Zero Totals from Logo...');
        } else {
            $this->info('🔄 Updating ALL Orders from Logo (totals + user info)...');
        }

        $this->newLine();
        $this->info("📊 Firm Number: {$firmNo}");

        if ($limit) {
            $this->info("📦 Limit: {$limit} orders");
        }

        $this->newLine();

        $result = $this->syncService->updateOrderTotals($firmNo, $limit, $onlyZeroTotals);

        if (!$result['success']) {
            $this->error('❌ Update failed!');
            $this->error('Error: ' . $result['error']);
            return Command::FAILURE;
        }

        $stats = $result['stats'];

        $this->info('✅ Orders updated successfully!');
        $this->newLine();

        $this->table(
            ['Metric', 'Count'],
            [
                [$onlyZeroTotals ? 'Total Orders with Zero Totals' : 'Total Orders', $stats['total']],
                ['Updated', $stats['updated']],
                ['Skipped (no Logo data)', $stats['skipped']],
                ['Errors', count($stats['errors'])],
            ]
        );

        if (!empty($stats['errors'])) {
            $this->newLine();
            $this->warn('⚠️  Errors occurred:');
            foreach (array_slice($stats['errors'], 0, 10) as $error) {
                $this->line('  • ' . $error);
            }
        }

        return Command::SUCCESS;
    }

    /**
     * Show sync statistics
     */
    protected function showStats(): void
    {
        $this->info('📊 Logo Order Sync Statistics');
        $this->newLine();

        $stats = $this->syncService->getSyncStats();

        if (!$stats['success']) {
            $this->error('Failed to get statistics: ' . $stats['error']);
            return;
        }

        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Synced Order Lines', $stats['total_synced_lines']],
                ['Total Synced Orders', $stats['total_synced_orders']],
                ['Orders with Zero Total', $stats['orders_with_zero_total'] ?? 0],
            ]
        );

        if (($stats['orders_with_zero_total'] ?? 0) > 0) {
            $this->newLine();
            $this->warn("⚠️  {$stats['orders_with_zero_total']} orders have zero totals. Run with --update-totals to fix.");
        }

        if ($stats['last_sync']) {
            $this->newLine();
            $this->info('🕐 Last Sync: ' . $stats['last_sync']);
        } else {
            $this->newLine();
            $this->warn('⚠️  No sync records found');
        }
    }
}
