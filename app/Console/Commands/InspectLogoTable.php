<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class InspectLogoTable extends Command
{
    protected $signature = 'logo:inspect-table
                            {table : Table name (e.g., LG_001_CLCARD)}
                            {--limit=20 : Number of sample rows to show}';

    protected $description = 'Inspect Logo table structure and show sample data';

    public function handle()
    {
        $tableName = $this->argument('table');
        $limit = $this->option('limit');

        $this->info("🔍 Inspecting Logo Table: {$tableName}");
        $this->newLine();

        try {
            // Get column information
            $columns = DB::connection('logo')
                ->select(
                    "SELECT
                        COLUMN_NAME,
                        DATA_TYPE,
                        CHARACTER_MAXIMUM_LENGTH,
                        IS_NULLABLE,
                        COLUMN_DEFAULT
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = ?
                    ORDER BY ORDINAL_POSITION",
                    [$tableName]
                );

            if (empty($columns)) {
                $this->error("❌ Table '{$tableName}' not found!");
                return Command::FAILURE;
            }

            $columnCount = count($columns);
            $this->info("📋 Table Structure ({$columnCount} columns):");
            $this->newLine();

            // Display columns in a table
            $columnData = array_map(function($col) {
                return [
                    $col->COLUMN_NAME,
                    $col->DATA_TYPE,
                    $col->CHARACTER_MAXIMUM_LENGTH ?? 'N/A',
                    $col->IS_NULLABLE,
                ];
            }, $columns);

            $this->table(
                ['Column Name', 'Data Type', 'Max Length', 'Nullable'],
                $columnData
            );

            // Get sample data
            $this->newLine();
            $this->info("📊 Sample Data (first {$limit} rows):");
            $this->newLine();

            $sampleData = DB::connection('logo')
                ->table($tableName)
                ->limit($limit)
                ->get();

            if ($sampleData->isEmpty()) {
                $this->warn('⚠️  No data found in table');
            } else {
                $firstRow = (array) $sampleData->first();

                foreach ($sampleData as $index => $row) {
                    $this->line("--- Row " . ($index + 1) . " ---");
                    $rowArray = (array) $row;

                    foreach ($rowArray as $key => $value) {
                        $displayValue = $value;
                        if (is_null($value)) {
                            $displayValue = '<null>';
                        } elseif (strlen($value) > 50) {
                            $displayValue = substr($value, 0, 47) . '...';
                        }
                        $this->line("  {$key}: {$displayValue}");
                    }
                    $this->newLine();

                    if ($index >= 2) break; // Show only first 3 rows in detail
                }
            }

            // Get row count
            $rowCount = DB::connection('logo')
                ->table($tableName)
                ->count();

            $this->newLine();
            $this->info("📈 Total Rows: {$rowCount}");

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Error: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
