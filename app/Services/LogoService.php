<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class LogoService
{
    /**
     * Logo database connection name
     */
    protected string $connection = 'logo';

    /**
     * Get default firm number from config
     */
    public static function getDefaultFirmNo(): int
    {
        return (int) config('services.logo.firm_no', 1);
    }

    /**
     * Test Logo database connection
     */
    public function testConnection(): array
    {
        try {
            $pdo = DB::connection($this->connection)->getPdo();

            $serverInfo = DB::connection($this->connection)
                ->selectOne('SELECT @@VERSION as version, DB_NAME() as dbname');

            return [
                'success' => true,
                'message' => 'Connection successful',
                'server_version' => $serverInfo->version ?? 'Unknown',
                'database_name' => $serverInfo->dbname ?? 'Unknown',
            ];

        } catch (Exception $e) {
            Log::error('Logo DB Connection Error: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Connection failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get all tables in Logo database
     */
    public function getTables(): array
    {
        try {
            $tables = DB::connection($this->connection)
                ->select("
                    SELECT
                        TABLE_SCHEMA,
                        TABLE_NAME,
                        TABLE_TYPE
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_TYPE = 'BASE TABLE'
                    ORDER BY TABLE_SCHEMA, TABLE_NAME
                ");

            return [
                'success' => true,
                'tables' => $tables,
                'count' => count($tables),
            ];

        } catch (Exception $e) {
            Log::error('Logo DB Get Tables Error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'tables' => [],
                'count' => 0,
            ];
        }
    }

    /**
     * Get table columns information
     */
    public function getTableColumns(string $tableName, ?string $schema = 'dbo'): array
    {
        try {
            $columns = DB::connection($this->connection)
                ->select("
                    SELECT
                        COLUMN_NAME,
                        DATA_TYPE,
                        CHARACTER_MAXIMUM_LENGTH,
                        IS_NULLABLE,
                        COLUMN_DEFAULT
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = ?
                    AND TABLE_SCHEMA = ?
                    ORDER BY ORDINAL_POSITION
                ", [$tableName, $schema]);

            return [
                'success' => true,
                'columns' => $columns,
                'count' => count($columns),
            ];

        } catch (Exception $e) {
            Log::error('Logo DB Get Columns Error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'columns' => [],
                'count' => 0,
            ];
        }
    }

    /**
     * Execute a raw query on Logo database
     */
    public function query(string $sql, array $bindings = []): array
    {
        try {
            $results = DB::connection($this->connection)
                ->select($sql, $bindings);

            return [
                'success' => true,
                'data' => $results,
                'count' => count($results),
            ];

        } catch (Exception $e) {
            Log::error('Logo DB Query Error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
                'count' => 0,
            ];
        }
    }

    /**
     * Get Logo customers (müşteriler)
     * Common Logo table: LG_XXX_CLCARD (XXX = Firma No)
     */
    public function getCustomers(?int $firmNo = null, int $limit = 100): array
    {
        $firmNo = $firmNo ?? self::getDefaultFirmNo();

        try {
            $tableName = sprintf('LG_%03d_CLCARD', $firmNo);

            // Check if table exists
            $tableExists = DB::connection($this->connection)
                ->selectOne("
                    SELECT COUNT(*) as count
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME = ?
                ", [$tableName]);

            if ($tableExists->count == 0) {
                return [
                    'success' => false,
                    'error' => "Table {$tableName} not found. Please check firm number.",
                    'data' => [],
                ];
            }

            $customers = DB::connection($this->connection)
                ->table($tableName)
                ->select([
                    'LOGICALREF',
                    'CODE',
                    'DEFINITION_',
                    'ADDR1',
                    'ADDR2',
                    'CITY',
                    'TOWN',
                    'TELNRS1',
                    'TELNRS2',
                    'EMAILADDR',
                    'TAXNR',
                ])
                ->where('ACTIVE', 0) // 0 = Active in Logo
                ->limit($limit)
                ->get();

            return [
                'success' => true,
                'data' => $customers,
                'count' => $customers->count(),
                'table' => $tableName,
            ];

        } catch (Exception $e) {
            Log::error('Logo Get Customers Error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
            ];
        }
    }

    /**
     * Get Logo products (ürünler)
     * Common Logo table: LG_XXX_ITEMS (XXX = Firma No)
     */
    public function getProducts(?int $firmNo = null, int $limit = 100): array
    {
        $firmNo = $firmNo ?? self::getDefaultFirmNo();

        try {
            $tableName = sprintf('LG_%03d_ITEMS', $firmNo);

            // Check if table exists
            $tableExists = DB::connection($this->connection)
                ->selectOne("
                    SELECT COUNT(*) as count
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME = ?
                ", [$tableName]);

            if ($tableExists->count == 0) {
                return [
                    'success' => false,
                    'error' => "Table {$tableName} not found. Please check firm number.",
                    'data' => [],
                ];
            }

            $products = DB::connection($this->connection)
                ->table($tableName)
                ->select([
                    'LOGICALREF',
                    'CODE',
                    'NAME',
                    'STGRPCODE',
                    'PRODUCERCODE',
                    'UNITSETREF',
                    'VATINC',
                    'ACTIVE',
                ])
                ->where('ACTIVE', 0) // 0 = Active in Logo
                ->where('CARDTYPE', 1) // 1 = Ticari mal
                ->limit($limit)
                ->get();

            return [
                'success' => true,
                'data' => $products,
                'count' => $products->count(),
                'table' => $tableName,
            ];

        } catch (Exception $e) {
            Log::error('Logo Get Products Error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
            ];
        }
    }

    /**
     * Get Logo invoices (faturalar)
     * Common Logo table: LG_XXX_INVOICE (XXX = Firma No)
     */
    public function getInvoices(?int $firmNo = null, ?string $dateFrom = null, ?string $dateTo = null, int $limit = 100): array
    {
        $firmNo = $firmNo ?? self::getDefaultFirmNo();

        try {
            $tableName = sprintf('LG_%03d_INVOICE', $firmNo);

            // Check if table exists
            $tableExists = DB::connection($this->connection)
                ->selectOne("
                    SELECT COUNT(*) as count
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME = ?
                ", [$tableName]);

            if ($tableExists->count == 0) {
                return [
                    'success' => false,
                    'error' => "Table {$tableName} not found. Please check firm number.",
                    'data' => [],
                ];
            }

            $query = DB::connection($this->connection)
                ->table($tableName)
                ->select([
                    'LOGICALREF',
                    'FICHENO',
                    'DATE_',
                    'CLIENTREF',
                    'NETTOTAL',
                    'GROSSTOTAL',
                    'TOTALDISCOUNTS',
                    'TOTALDISCOUNTED',
                    'TOTALVAT',
                ]);

            // Add date filters if provided
            if ($dateFrom) {
                $query->where('DATE_', '>=', $dateFrom);
            }
            if ($dateTo) {
                $query->where('DATE_', '<=', $dateTo);
            }

            $invoices = $query->limit($limit)->get();

            return [
                'success' => true,
                'data' => $invoices,
                'count' => $invoices->count(),
                'table' => $tableName,
            ];

        } catch (Exception $e) {
            Log::error('Logo Get Invoices Error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
            ];
        }
    }

    /**
     * Get data from any Logo table with custom query
     */
    public function getFromTable(string $tableName, array $columns = ['*'], ?array $where = null, int $limit = 100): array
    {
        try {
            $query = DB::connection($this->connection)
                ->table($tableName)
                ->select($columns);

            if ($where) {
                foreach ($where as $field => $value) {
                    $query->where($field, $value);
                }
            }

            $data = $query->limit($limit)->get();

            return [
                'success' => true,
                'data' => $data,
                'count' => $data->count(),
                'table' => $tableName,
            ];

        } catch (Exception $e) {
            Log::error('Logo Get From Table Error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
            ];
        }
    }

    /**
     * Get count of records in a table
     */
    public function getTableCount(string $tableName, ?array $where = null): array
    {
        try {
            $query = DB::connection($this->connection)->table($tableName);

            if ($where) {
                foreach ($where as $field => $value) {
                    $query->where($field, $value);
                }
            }

            $count = $query->count();

            return [
                'success' => true,
                'count' => $count,
                'table' => $tableName,
            ];

        } catch (Exception $e) {
            Log::error('Logo Get Table Count Error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'count' => 0,
            ];
        }
    }

    /**
     * Check if a Logo order has any dispatch (irsaliye) issued.
     * Queries STLINE→STFICHE where TRCODE=8 (sales dispatch).
     */
    public function hasDispatchForOrder(int $logoOrderId, ?int $firmNo = null): array
    {
        $firmNo = $firmNo ?? self::getDefaultFirmNo();
        $stlineTable = sprintf('LG_%03d_01_STLINE', $firmNo);
        $stficheTable = sprintf('LG_%03d_01_STFICHE', $firmNo);

        try {
            $dispatch = DB::connection($this->connection)->selectOne("
                SELECT TOP 1 sf.LOGICALREF, sf.FICHENO, sf.DATE_
                FROM {$stlineTable} sl
                JOIN {$stficheTable} sf ON sl.STFICHEREF = sf.LOGICALREF
                WHERE sl.ORDFICHEREF = ?
                AND sf.TRCODE = 8
                ORDER BY sf.DATE_ DESC
            ", [$logoOrderId]);

            if ($dispatch) {
                return [
                    'has_dispatch' => true,
                    'dispatch_no' => $dispatch->FICHENO,
                    'dispatch_date' => $dispatch->DATE_ ? date('d.m.Y', strtotime($dispatch->DATE_)) : null,
                ];
            }

            return ['has_dispatch' => false, 'dispatch_no' => null, 'dispatch_date' => null];
        } catch (Exception $e) {
            Log::warning("Logo dispatch check failed for order {$logoOrderId}: " . $e->getMessage());
            return ['has_dispatch' => false, 'dispatch_no' => null, 'dispatch_date' => null];
        }
    }
}
