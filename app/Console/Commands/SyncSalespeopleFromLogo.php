<?php

namespace App\Console\Commands;

use App\Models\SalesRepresentative;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncSalespeopleFromLogo extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'logo:sync-salespeople
                            {--firm= : Logo firm number (default: env LOGO_FIRM_NO)}
                            {--active-only : Only sync active salespeople}
                            {--dry-run : Show what would be synced without making changes}';

    /**
     * The console command description.
     */
    protected $description = 'Sync salespeople from Logo LG_SLSMAN table to sales_representatives';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $firmNo = (int) ($this->option('firm') ?? config('services.logo.firm_no', 1));
        $activeOnly = $this->option('active-only');
        $dryRun = $this->option('dry-run');

        $this->info('🔄 Starting Salespeople Synchronization from Logo...');
        $this->newLine();
        $this->info("📊 Firm Number: {$firmNo}");
        $this->info("📋 Active Only: " . ($activeOnly ? 'Yes' : 'No'));
        $this->info("🧪 Dry Run: " . ($dryRun ? 'Yes' : 'No'));
        $this->newLine();

        try {
            $logoDb = DB::connection('logo');

            // Build query
            $query = $logoDb->table('LG_SLSMAN')
                ->where('FIRMNR', $firmNo)
                ->orderBy('CODE');

            if ($activeOnly) {
                $query->where('ACTIVE', 1);
            }

            $logoSalespeople = $query->get();

            $this->info("Found {$logoSalespeople->count()} salespeople in Logo");
            $this->newLine();

            $stats = [
                'total' => $logoSalespeople->count(),
                'created' => 0,
                'updated' => 0,
                'skipped' => 0,
                'errors' => [],
            ];

            $progressBar = $this->output->createProgressBar($stats['total']);
            $progressBar->start();

            foreach ($logoSalespeople as $logoSalesperson) {
                try {
                    $result = $this->syncSalesperson($logoSalesperson, $firmNo, $dryRun);
                    $stats[$result]++;
                } catch (\Exception $e) {
                    $stats['errors'][] = "Code {$logoSalesperson->CODE}: {$e->getMessage()}";
                }
                $progressBar->advance();
            }

            $progressBar->finish();
            $this->newLine(2);

            // Display results
            $this->info('✅ Synchronization completed!');
            $this->newLine();

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
                $this->warn('⚠️ Errors occurred:');
                foreach (array_slice($stats['errors'], 0, 10) as $error) {
                    $this->line("  • {$error}");
                }
                if (count($stats['errors']) > 10) {
                    $this->line('  ... and ' . (count($stats['errors']) - 10) . ' more errors');
                }
            }

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Synchronization failed: ' . $e->getMessage());
            Log::error('Logo salespeople sync failed', ['error' => $e->getMessage()]);
            return Command::FAILURE;
        }
    }

    /**
     * Sync a single salesperson
     */
    protected function syncSalesperson(object $logoSalesperson, int $firmNo, bool $dryRun): string
    {
        // Parse name from CODE or DEFINITION_
        $name = $logoSalesperson->DEFINITION_ ?: $logoSalesperson->CODE;
        $nameParts = $this->parseName($name);

        $data = [
            'logo_id' => $logoSalesperson->LOGICALREF,
            'logo_code' => $logoSalesperson->CODE,
            'logo_firm_no' => $firmNo,
            'logo_user_id' => $logoSalesperson->USERID,
            'first_name' => $nameParts['first_name'],
            'last_name' => $nameParts['last_name'],
            'email' => $logoSalesperson->EMAILADDR ?: null,
            'phone' => $logoSalesperson->TELNUMBER ?: null,
            'is_active' => (bool) $logoSalesperson->ACTIVE,
            'logo_synced_at' => now(),
        ];

        // Check if exists
        $existing = SalesRepresentative::where('logo_id', $logoSalesperson->LOGICALREF)
            ->where('logo_firm_no', $firmNo)
            ->first();

        if ($dryRun) {
            if ($existing) {
                $this->line("  Would UPDATE: {$logoSalesperson->CODE} ({$name})");
                return 'updated';
            } else {
                $this->line("  Would CREATE: {$logoSalesperson->CODE} ({$name})");
                return 'created';
            }
        }

        if ($existing) {
            $existing->update($data);
            return 'updated';
        } else {
            SalesRepresentative::create($data);
            return 'created';
        }
    }

    /**
     * Parse name into first and last name
     */
    protected function parseName(string $name): array
    {
        $name = trim($name);

        // Handle dash-separated names like "MURAT-ALPASLAN"
        if (str_contains($name, '-')) {
            $parts = explode('-', $name, 2);
            return [
                'first_name' => trim($parts[0]),
                'last_name' => trim($parts[1] ?? ''),
            ];
        }

        // Handle space-separated names
        $parts = explode(' ', $name, 2);
        return [
            'first_name' => trim($parts[0]),
            'last_name' => trim($parts[1] ?? ''),
        ];
    }
}
