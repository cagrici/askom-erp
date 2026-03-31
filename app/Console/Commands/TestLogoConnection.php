<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Exception;

class TestLogoConnection extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logo:test-connection
                            {--show-config : Show Logo database configuration}
                            {--test-query : Run a sample query}
                            {--list-tables : List all tables in the database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test Logo MS SQL Server database connection';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔌 Testing Logo MS SQL Server Connection...');
        $this->newLine();

        // Show configuration if requested
        if ($this->option('show-config')) {
            $this->showConfiguration();
            $this->newLine();
        }

        // Test basic connection
        if (!$this->testBasicConnection()) {
            return Command::FAILURE;
        }

        // List tables if requested
        if ($this->option('list-tables')) {
            $this->newLine();
            $this->listTables();
        }

        // Run test query if requested
        if ($this->option('test-query')) {
            $this->newLine();
            $this->runTestQuery();
        }

        $this->newLine();
        $this->info('✅ All tests completed successfully!');

        return Command::SUCCESS;
    }

    /**
     * Show Logo database configuration
     */
    protected function showConfiguration(): void
    {
        $this->info('📋 Logo Database Configuration:');
        $this->newLine();

        $config = config('database.connections.logo');

        $this->table(
            ['Setting', 'Value'],
            [
                ['Driver', $config['driver'] ?? 'N/A'],
                ['Host', $config['host'] ?? 'N/A'],
                ['Port', $config['port'] ?? 'N/A'],
                ['Database', $config['database'] ?? 'N/A'],
                ['Username', $config['username'] ?? 'N/A'],
                ['Password', $config['password'] ? str_repeat('*', strlen($config['password'])) : 'N/A'],
                ['Charset', $config['charset'] ?? 'N/A'],
                ['Trust Server Certificate', $config['trust_server_certificate'] ? 'Yes' : 'No'],
                ['Encrypt', $config['encrypt'] ?? 'N/A'],
            ]
        );
    }

    /**
     * Test basic database connection
     */
    protected function testBasicConnection(): bool
    {
        $this->info('🔍 Testing basic connection...');

        try {
            // Try to connect
            $pdo = DB::connection('logo')->getPdo();

            $this->info('✅ Connection established successfully!');

            // Get server info
            $serverVersion = DB::connection('logo')->selectOne('SELECT @@VERSION as version');
            $this->info('📊 Server Version: ' . substr($serverVersion->version, 0, 100) . '...');

            // Get database name
            $dbName = DB::connection('logo')->selectOne('SELECT DB_NAME() as dbname');
            $this->info('🗄️  Database Name: ' . $dbName->dbname);

            return true;

        } catch (Exception $e) {
            $this->error('❌ Connection failed!');
            $this->error('Error: ' . $e->getMessage());
            $this->newLine();

            $this->warn('💡 Troubleshooting tips:');
            $this->line('  1. Check if SQL Server is running and accessible');
            $this->line('  2. Verify host, port, username, and password in .env');
            $this->line('  3. Ensure SQL Server allows remote connections');
            $this->line('  4. Check firewall settings (port 1433)');
            $this->line('  5. Verify SQL Server authentication mode (mixed mode)');
            $this->line('  6. Install/enable PHP SQL Server extension (pdo_sqlsrv)');
            $this->line('     Windows: Enable in php.ini: extension=pdo_sqlsrv');
            $this->line('     Linux: sudo apt-get install php-sqlsrv php-pdo-sqlsrv');

            return false;
        }
    }

    /**
     * List all tables in the Logo database
     */
    protected function listTables(): void
    {
        $this->info('📋 Listing tables in Logo database...');

        try {
            $tables = DB::connection('logo')
                ->select("
                    SELECT
                        TABLE_SCHEMA,
                        TABLE_NAME,
                        TABLE_TYPE
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_TYPE = 'BASE TABLE'
                    ORDER BY TABLE_SCHEMA, TABLE_NAME
                ");

            if (empty($tables)) {
                $this->warn('⚠️  No tables found in the database.');
                return;
            }

            $this->info('✅ Found ' . count($tables) . ' tables:');
            $this->newLine();

            // Group tables by schema
            $tablesBySchema = [];
            foreach ($tables as $table) {
                $schema = $table->TABLE_SCHEMA;
                if (!isset($tablesBySchema[$schema])) {
                    $tablesBySchema[$schema] = [];
                }
                $tablesBySchema[$schema][] = $table->TABLE_NAME;
            }

            // Display tables grouped by schema
            foreach ($tablesBySchema as $schema => $tableNames) {
                $this->info("Schema: {$schema}");

                $tableData = array_map(function($name) {
                    return [$name];
                }, $tableNames);

                $this->table(['Table Name'], $tableData);
                $this->newLine();
            }

        } catch (Exception $e) {
            $this->error('❌ Failed to list tables!');
            $this->error('Error: ' . $e->getMessage());
        }
    }

    /**
     * Run a sample test query
     */
    protected function runTestQuery(): void
    {
        $this->info('🔍 Running sample test query...');

        try {
            // Try to get database statistics
            $stats = DB::connection('logo')
                ->select("
                    SELECT
                        COUNT(*) as table_count
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_TYPE = 'BASE TABLE'
                ");

            $this->info('✅ Query executed successfully!');
            $this->info('📊 Total Tables: ' . $stats[0]->table_count);

            // Get Logo specific tables (common table patterns)
            $this->newLine();
            $this->info('🔍 Looking for Logo-specific tables...');

            $logoTables = DB::connection('logo')
                ->select("
                    SELECT
                        TABLE_NAME
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_TYPE = 'BASE TABLE'
                    AND (
                        TABLE_NAME LIKE 'LG_%'
                        OR TABLE_NAME LIKE '%_ITEMS'
                        OR TABLE_NAME LIKE '%INVOICE%'
                        OR TABLE_NAME LIKE '%STLINE%'
                    )
                    ORDER BY TABLE_NAME
                ");

            if (!empty($logoTables)) {
                $this->info('✅ Found ' . count($logoTables) . ' Logo tables:');
                foreach ($logoTables as $table) {
                    $this->line('  • ' . $table->TABLE_NAME);
                }
            } else {
                $this->warn('⚠️  No Logo-specific tables found.');
            }

        } catch (Exception $e) {
            $this->error('❌ Query failed!');
            $this->error('Error: ' . $e->getMessage());
        }
    }
}
