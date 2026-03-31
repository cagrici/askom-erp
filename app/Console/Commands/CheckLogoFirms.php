<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckLogoFirms extends Command
{
    protected $signature = 'logo:check-firms
                            {--max-firm=20 : Maximum firm number to check}';

    protected $description = 'Check all Logo firms and show current account counts';

    public function handle()
    {
        $maxFirm = (int) $this->option('max-firm');

        $this->info('🔍 Checking Logo Firms for Current Account Data');
        $this->newLine();

        $results = [];

        for ($firmNo = 1; $firmNo <= $maxFirm; $firmNo++) {
            $tableName = sprintf('LG_%03d_CLCARD', $firmNo);

            try {
                // Check if table exists
                $exists = DB::connection('logo')
                    ->selectOne("
                        SELECT COUNT(*) as count
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_NAME = ?
                    ", [$tableName]);

                if ($exists && $exists->count > 0) {
                    // Get active record count
                    $count = DB::connection('logo')
                        ->table($tableName)
                        ->where('ACTIVE', 0)
                        ->count();

                    // Get sample record to see if there's actual data
                    $sample = DB::connection('logo')
                        ->table($tableName)
                        ->where('ACTIVE', 0)
                        ->select('CODE', 'DEFINITION_')
                        ->first();

                    $results[] = [
                        'Firm' => $firmNo,
                        'Table' => $tableName,
                        'Active Records' => $count,
                        'Sample' => $sample ? "{$sample->CODE} - " . substr($sample->DEFINITION_, 0, 30) : '-',
                    ];
                }
            } catch (\Exception $e) {
                // Silently skip non-existent or inaccessible tables
                continue;
            }
        }

        if (empty($results)) {
            $this->warn('⚠️  No current account tables found!');
            return Command::FAILURE;
        }

        $this->info('📊 Found ' . count($results) . ' firms with current account data:');
        $this->newLine();

        $this->table(
            ['Firm', 'Table', 'Active Records', 'Sample'],
            $results
        );

        // Find the firm with most records
        $maxRecords = max(array_column($results, 'Active Records'));
        $activeFirm = collect($results)->first(fn($r) => $r['Active Records'] == $maxRecords);

        $this->newLine();
        $this->info("💡 Recommended firm to sync: Firm {$activeFirm['Firm']} ({$maxRecords} records)");
        $this->newLine();
        $this->line("Run: php artisan logo:sync-current-accounts --firm={$activeFirm['Firm']} --limit=10");

        return Command::SUCCESS;
    }
}
