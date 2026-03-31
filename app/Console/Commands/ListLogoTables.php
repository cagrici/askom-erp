<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ListLogoTables extends Command
{
    protected $signature = 'logo:list-tables
                            {--filter= : Filter tables by name pattern}
                            {--firm= : Firma numarasi (default: env LOGO_FIRM_NO)}';

    protected $description = 'List all tables in Logo database';

    public function handle()
    {
        $filter = $this->option('filter');
        $firmNo = (int) ($this->option('firm') ?? config('services.logo.firm_no', 1));

        $this->info('📋 Logo Database Tables');
        $this->newLine();

        try {
            // Get all tables
            $tables = DB::connection('logo')
                ->select("
                    SELECT TABLE_NAME, TABLE_TYPE
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_TYPE = 'BASE TABLE'
                    ORDER BY TABLE_NAME
                ");

            if (empty($tables)) {
                $this->warn('No tables found!');
                return Command::FAILURE;
            }

            // Filter if needed
            if ($filter) {
                $tables = array_filter($tables, function($table) use ($filter) {
                    return stripos($table->TABLE_NAME, $filter) !== false;
                });
                $this->info("Filtering by: {$filter}");
                $this->newLine();
            }

            // Show firm-specific tables
            $firmPattern = sprintf('LG_%03d_', $firmNo);
            $firmTables = array_filter($tables, function($table) use ($firmPattern) {
                return stripos($table->TABLE_NAME, $firmPattern) !== false;
            });

            if (!empty($firmTables)) {
                $this->info("📊 Firma {$firmNo} Tables (" . count($firmTables) . " tables):");
                $this->newLine();

                foreach ($firmTables as $table) {
                    $this->line('  • ' . $table->TABLE_NAME);
                }
                $this->newLine();
            }

            // Show all tables
            $this->info("📋 All Tables (" . count($tables) . " tables):");
            $this->newLine();

            $tableNames = array_map(fn($t) => [$t->TABLE_NAME], $tables);
            $this->table(['Table Name'], array_slice($tableNames, 0, 100));

            if (count($tables) > 100) {
                $this->warn('Only showing first 100 tables. Use --filter to narrow down results.');
            }

            // Show suggestions for current accounts
            $this->newLine();
            $this->info('💡 Common current account table patterns:');
            $this->line('  • LG_XXX_CLCARD - Current account cards');
            $this->line('  • LG_XXX_01_CLCARD - Alternative format');
            $this->line('  • LG_XXX_CLFICHE - Current account transactions (not what we need)');
            $this->newLine();

            $clcardTables = array_filter($tables, function($table) {
                return preg_match('/LG_\d+_.*CLCARD/i', $table->TABLE_NAME);
            });

            if (!empty($clcardTables)) {
                $this->info('🎯 Found CLCARD tables:');
                foreach ($clcardTables as $table) {
                    $this->line('  ✓ ' . $table->TABLE_NAME);
                }
            }

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
