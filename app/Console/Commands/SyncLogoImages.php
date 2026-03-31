<?php

namespace App\Console\Commands;

use App\Services\LogoProductImageSyncService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SyncLogoImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logo:sync-images
                            {--firm= : Logo firm number (default: env LOGO_FIRM_NO)}
                            {--limit= : Limit number of records to sync}
                            {--table= : Specific table name (optional, auto-detected if not provided)}
                            {--incremental : Sync only changed records since last sync}
                            {--batch-size=100 : Number of images to process per batch}
                            {--resume : Resume from last saved offset}
                            {--all : Sync all images using batch processing}
                            {--stats : Show sync statistics only}
                            {--count : Show total image count in Logo}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync product images from Logo ERP';

    protected LogoProductImageSyncService $syncService;
    protected string $progressCacheKey = 'logo_image_sync_progress';

    public function __construct(LogoProductImageSyncService $syncService)
    {
        parent::__construct();
        $this->syncService = $syncService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $firmNo = (int) ($this->option('firm') ?? config('services.logo.firm_no', 1));

        // Show stats only
        if ($this->option('stats')) {
            $this->showStats();
            return Command::SUCCESS;
        }

        // Show count only
        if ($this->option('count')) {
            $this->showLogoCount($firmNo);
            return Command::SUCCESS;
        }

        // Batch processing for all images
        if ($this->option('all')) {
            return $this->handleBatchSync($firmNo);
        }

        // Regular sync with limit
        return $this->handleRegularSync($firmNo);
    }

    /**
     * Handle batch sync for all images
     */
    protected function handleBatchSync(int $firmNo): int
    {
        $batchSize = (int) $this->option('batch-size');
        $tableName = $this->option('table');
        $resume = $this->option('resume');

        $this->info('🔄 Starting Logo Product Image Batch Synchronization...');
        $this->newLine();

        // Get total count first
        $countResult = $this->syncService->getLogoImageCount($firmNo, $tableName);
        if (!$countResult['success']) {
            $this->error('❌ Failed to get image count: ' . $countResult['error']);
            return Command::FAILURE;
        }

        $totalImages = $countResult['count'];
        $tableName = $countResult['table'];

        $this->info("📊 Firm Number: {$firmNo} | Table: {$tableName}");
        $this->info("📦 Total Images: " . number_format($totalImages));
        $this->info("📦 Batch Size: {$batchSize}");

        // Check for resume
        $startOffset = 0;
        if ($resume) {
            $savedProgress = Cache::get($this->progressCacheKey . "_{$firmNo}");
            if ($savedProgress) {
                $startOffset = $savedProgress['offset'] ?? 0;
                $this->info("🔄 Resuming from offset: " . number_format($startOffset));
                $this->info("   Previously synced: " . number_format($savedProgress['synced'] ?? 0));
            }
        }

        $this->newLine();

        // Create progress bar
        $progressBar = $this->output->createProgressBar($totalImages);
        $progressBar->setFormat(' %current%/%max% [%bar%] %percent:3s%% | Synced: %synced% | Skipped: %skipped% | Batch: %batch%');
        $progressBar->setMessage('0', 'synced');
        $progressBar->setMessage('0', 'skipped');
        $progressBar->setMessage('0', 'batch');
        $progressBar->start();

        if ($startOffset > 0) {
            $progressBar->setProgress($startOffset);
        }

        // Progress callback
        $progressCallback = function ($progress) use ($progressBar, $firmNo) {
            $progressBar->setProgress($progress['processed'] + ($progress['offset'] - $progress['processed']));
            $progressBar->setMessage((string) $progress['synced'], 'synced');
            $progressBar->setMessage((string) $progress['skipped'], 'skipped');
            $progressBar->setMessage((string) $progress['batch'], 'batch');

            // Save progress for resume
            Cache::put($this->progressCacheKey . "_{$firmNo}", [
                'offset' => $progress['offset'],
                'synced' => $progress['synced'],
                'skipped' => $progress['skipped'],
                'batch' => $progress['batch'],
                'updated_at' => now()->toDateTimeString(),
            ], now()->addDays(7));
        };

        $result = $this->syncService->syncProductImagesInBatches(
            $firmNo,
            $batchSize,
            $tableName,
            $progressCallback,
            $startOffset
        );

        $progressBar->finish();
        $this->newLine(2);

        if (!$result['success']) {
            $this->error('❌ Synchronization failed!');
            $this->error('Error: ' . $result['error']);
            return Command::FAILURE;
        }

        $stats = $result['stats'];

        $this->info('✅ Batch synchronization completed successfully!');
        $this->newLine();

        // Display statistics
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total in Logo', number_format($result['total_in_logo'])],
                ['Processed', number_format($stats['total'])],
                ['Synced', number_format($stats['synced'])],
                ['Skipped', number_format($stats['skipped'])],
                ['Batches', number_format($stats['batches_processed'])],
                ['Errors', count($stats['errors'])],
            ]
        );

        if (!empty($stats['errors'])) {
            $this->newLine();
            $this->warn('⚠️  First 10 errors:');
            foreach (array_slice($stats['errors'], 0, 10) as $error) {
                $this->line('  • ' . $error);
            }
        }

        // Clear progress cache on completion
        Cache::forget($this->progressCacheKey . "_{$firmNo}");

        return Command::SUCCESS;
    }

    /**
     * Handle regular sync with limit
     */
    protected function handleRegularSync(int $firmNo): int
    {
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $tableName = $this->option('table');
        $incrementalSync = $this->option('incremental');

        $this->info('🔄 Starting Logo Product Image Synchronization...');
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
            $this->info("📦 Limit: {$limit} images");
        } else {
            $this->info("📦 All product images");
        }

        $this->newLine();

        $progressBar = $this->output->createProgressBar();
        $progressBar->start();

        $result = $this->syncService->syncProductImages($firmNo, $limit, $tableName, $incrementalSync);

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
                ['Synced', $stats['synced']],
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
     * Show Logo image count
     */
    protected function showLogoCount(int $firmNo): void
    {
        $this->info('📊 Counting images in Logo database...');

        $result = $this->syncService->getLogoImageCount($firmNo);

        if (!$result['success']) {
            $this->error('❌ Failed: ' . $result['error']);
            return;
        }

        $this->newLine();
        $this->table(
            ['Metric', 'Value'],
            [
                ['Firm Number', $firmNo],
                ['Table', $result['table']],
                ['Total Images', number_format($result['count'])],
            ]
        );
    }

    /**
     * Show sync statistics
     */
    protected function showStats(): void
    {
        $this->info('📊 Logo Product Image Sync Statistics');
        $this->newLine();

        $stats = $this->syncService->getSyncStats();

        if (!$stats['success']) {
            $this->error('Failed to get statistics: ' . $stats['error']);
            return;
        }

        $this->table(
            ['Metric', 'Count'],
            [
                ['Products with Images', $stats['total_products_with_images']],
                ['Logo Synced Images', $stats['logo_synced_images']],
            ]
        );

        if ($stats['last_sync']) {
            $this->newLine();
            $this->info('🕐 Last Sync: ' . $stats['last_sync']);
        } else {
            $this->newLine();
            $this->warn('⚠️  No sync records found');
        }

        // Show resume info if available
        $firmNo = (int) ($this->option('firm') ?? config('services.logo.firm_no', 1));
        $savedProgress = Cache::get($this->progressCacheKey . "_{$firmNo}");
        if ($savedProgress) {
            $this->newLine();
            $this->info('📌 Saved Progress (use --resume to continue):');
            $this->line("   Offset: " . number_format($savedProgress['offset']));
            $this->line("   Synced: " . number_format($savedProgress['synced']));
            $this->line("   Last Update: " . $savedProgress['updated_at']);
        }
    }
}
