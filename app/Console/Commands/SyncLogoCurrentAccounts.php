<?php

namespace App\Console\Commands;

use App\Services\LogoCurrentAccountSyncService;
use Illuminate\Console\Command;

class SyncLogoCurrentAccounts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logo:sync-current-accounts
                            {--firm= : Logo firm number (default: env LOGO_FIRM_NO)}
                            {--limit= : Limit number of records to sync}
                            {--table= : Specific table name (optional, auto-detected if not provided)}
                            {--stats : Show sync statistics only}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync current accounts (customers/suppliers) from Logo ERP';

    protected LogoCurrentAccountSyncService $syncService;

    public function __construct(LogoCurrentAccountSyncService $syncService)
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

        $this->info('Starting Logo Current Account Synchronization...');
        $this->newLine();

        if ($tableName) {
            $this->info("📊 Firm Number: {$firmNo} | Table: {$tableName}");
        } else {
            $this->info("📊 Firm Number: {$firmNo} | Table: Auto-detect");
        }

        if ($limit) {
            $this->info("📦 Limit: {$limit} records");
        } else {
            $this->info("📦 All active records");
        }

        $this->newLine();

        $progressBar = $this->output->createProgressBar();
        $progressBar->start();

        $result = $this->syncService->syncCurrentAccounts($firmNo, $limit, $tableName);

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
            foreach ($stats['errors'] as $error) {
                $this->line('  • ' . $error);
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
        $this->info('📊 Logo Current Account Sync Statistics');
        $this->newLine();

        $stats = $this->syncService->getSyncStats();

        if (!$stats['success']) {
            $this->error('Failed to get statistics: ' . $stats['error']);
            return;
        }

        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Synced Accounts', $stats['total_synced']],
                ['Customers Only', $stats['customers']],
                ['Suppliers Only', $stats['suppliers']],
                ['Both (Customer & Supplier)', $stats['both']],
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
