<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Warehouse;
use App\Models\InventoryStock;
use App\Models\InventoryItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class LogoInventorySyncService
{
    protected LogoService $logoService;
    protected string $connection = 'logo';

    // Possible view/table name patterns for inventory totals (preferred)
    // Views (LV_) have calculated stock data, tables (LG_) may be empty
    protected array $possibleInvTotalTablePatterns = [
        'LV_%03d_01_STINVTOT', // View - calculated stock totals (PREFERRED)
        'LG_%03d_01_STINVTOT', // Table - may be empty
        'LV_%03d_STINVTOT',    // View without period
        'LG_%03d_STINVTOT',    // Table without period
    ];

    // Possible table name patterns for stock lines (fallback for calculations)
    protected array $possibleStockTablePatterns = [
        'LG_%03d_01_STLINE',   // Standard format with period
        'LG_%03d_STLINE',      // Without period
    ];

    public function __construct(LogoService $logoService)
    {
        $this->logoService = $logoService;
    }

    /**
     * Sync inventory/stock data from Logo database
     */
    public function syncInventory(?int $firmNo = null, ?int $limit = null, ?string $tableName = null, bool $incrementalSync = false, bool $continueOnError = true): array
    {
        $firmNo = $firmNo ?? LogoService::getDefaultFirmNo();

        try {
            Log::info("Starting Logo inventory sync for firm {$firmNo}");

            // Find stock table if not provided
            if (!$tableName) {
                $tableName = $this->findStockTable($firmNo);
                if (!$tableName) {
                    return [
                        'success' => false,
                        'error' => "Stock table not found for firm {$firmNo}",
                    ];
                }
            }

            Log::info("Using stock table: {$tableName}");

            $stats = [
                'total' => 0,
                'created' => 0,
                'updated' => 0,
                'skipped' => 0,
                'errors' => [],
            ];

            // Pagination settings
            $pageSize = 500;
            $offset = 0;
            $totalRecords = $limit ?? $this->getTotalStockCount($firmNo, $tableName, $incrementalSync);

            Log::info("Total records to sync: {$totalRecords}");

            // Process in pages
            while ($offset < $totalRecords) {
                $currentPageSize = min($pageSize, $totalRecords - $offset);

                Log::info("Fetching page: offset={$offset}, limit={$currentPageSize}");

                // Get stock data for this page
                $logoStocks = $this->getLogoStockPaged($firmNo, $tableName, $offset, $currentPageSize, $incrementalSync);

                if (!$logoStocks['success']) {
                    Log::error("Failed to fetch page at offset {$offset}: {$logoStocks['error']}");
                    if (!$continueOnError) {
                        return [
                            'success' => false,
                            'error' => $logoStocks['error'],
                        ];
                    }
                    break;
                }

                $stocks = $logoStocks['data'];
                $stats['total'] += count($stocks);

                // Process this page in a transaction
                DB::beginTransaction();

                try {
                    foreach ($stocks as $logoStock) {
                        $result = $this->syncSingleStock($logoStock, $firmNo);

                        if ($result['action'] === 'created') {
                            $stats['created']++;
                        } elseif ($result['action'] === 'updated') {
                            $stats['updated']++;
                        } elseif ($result['action'] === 'error') {
                            $stats['skipped']++;
                            if (isset($result['error'])) {
                                $errorMsg = "Product Logo ID {$logoStock->product_logo_id}: {$result['error']}";
                                $stats['errors'][] = $errorMsg;
                                if (count($stats['errors']) <= 10) {
                                    Log::warning($errorMsg);
                                }
                            }

                            if (!$continueOnError) {
                                throw new Exception($result['error']);
                            }
                        } else {
                            $stats['skipped']++;
                        }
                    }

                    DB::commit();

                    $progress = round(($offset + $currentPageSize) / $totalRecords * 100, 1);
                    Log::info("Progress: {$progress}% - Created={$stats['created']}, Updated={$stats['updated']}, Skipped={$stats['skipped']}");

                } catch (Exception $e) {
                    DB::rollBack();

                    if (!$continueOnError) {
                        throw $e;
                    }

                    Log::error("Page processing error at offset {$offset}: " . $e->getMessage());
                }

                $offset += $pageSize;

                unset($stocks);
                unset($logoStocks);
            }

            Log::info('Logo inventory sync completed', $stats);

            return [
                'success' => true,
                'stats' => $stats,
            ];

        } catch (Exception $e) {
            Log::error('Logo inventory sync error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Find the correct inventory totals table name
     */
    protected function findStockTable(int $firmNo): ?string
    {
        try {
            // First try inventory totals view/table patterns (views have calculated stock)
            foreach ($this->possibleInvTotalTablePatterns as $pattern) {
                $tableName = sprintf($pattern, $firmNo);
                $isView = str_starts_with($pattern, 'LV_');

                // Check in views or tables based on pattern prefix
                $schemaTable = $isView ? 'INFORMATION_SCHEMA.VIEWS' : 'INFORMATION_SCHEMA.TABLES';

                $exists = DB::connection($this->connection)
                    ->selectOne("
                        SELECT COUNT(*) as count
                        FROM {$schemaTable}
                        WHERE TABLE_NAME = ?
                    ", [$tableName]);

                if ($exists && $exists->count > 0) {
                    $type = $isView ? 'view' : 'table';
                    Log::info("Found inventory totals {$type}: {$tableName}");
                    return $tableName;
                }
            }

            // Search for STINVTOT view first (views have calculated stock)
            $views = DB::connection($this->connection)
                ->select("
                    SELECT TABLE_NAME
                    FROM INFORMATION_SCHEMA.VIEWS
                    WHERE TABLE_NAME LIKE ?
                    ORDER BY TABLE_NAME
                ", ["LV_%{$firmNo}%STINVTOT"]);

            if (!empty($views)) {
                $tableName = $views[0]->TABLE_NAME;
                Log::info("Found inventory totals view by search: {$tableName}");
                return $tableName;
            }

            // Fallback: Search for STINVTOT table
            $tables = DB::connection($this->connection)
                ->select("
                    SELECT TABLE_NAME
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME LIKE ?
                ", ["LG_%{$firmNo}%STINVTOT%"]);

            if (!empty($tables)) {
                $tableName = $tables[0]->TABLE_NAME;
                Log::info("Found inventory totals table by search: {$tableName}");
                return $tableName;
            }

            return null;
        } catch (Exception $e) {
            Log::error("Error finding stock table: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get total stock count (unique STOCKREF/INVENNO combinations with non-zero stock)
     *
     * IMPORTANT: STINVTOT stores DAILY CHANGES (deltas), not absolute values.
     * The actual stock is the SUM of all ONHAND values for each STOCKREF/INVENNO.
     */
    protected function getTotalStockCount(int $firmNo, string $tableName, bool $incrementalSync = false): int
    {
        try {
            // Count unique STOCKREF/INVENNO combinations where SUM(ONHAND) != 0
            $query = DB::connection($this->connection)
                ->table($tableName)
                ->selectRaw('STOCKREF, INVENNO')
                ->where('INVENNO', '>=', 0) // Only actual warehouses, not consolidated (-1)
                ->groupBy('STOCKREF', 'INVENNO')
                ->havingRaw('SUM(ONHAND) != 0');

            return $query->get()->count();
        } catch (Exception $e) {
            Log::error('Get Logo stock count error: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get stock data from Logo with pagination
     *
     * Logo STINVTOT view structure:
     * - LOGICALREF: Primary key
     * - STOCKREF: Product reference (ITEMS.LOGICALREF)
     * - INVENNO: Warehouse number (-1 = consolidated, 0 = main, 1+ = secondary)
     * - DATE_: Record date (view stores daily changes/deltas)
     * - ONHAND: Daily change in on-hand quantity (NOT absolute value!)
     * - RESERVED: Daily change in reserved quantity
     * - RECEIVED: Daily change in received quantity
     * - SHIPPED: Daily change in shipped quantity
     *
     * IMPORTANT: The view stores DAILY CHANGES (deltas), not absolute values!
     * The actual stock is the SUM of all ONHAND values for each STOCKREF/INVENNO.
     */
    protected function getLogoStockPaged(int $firmNo, string $tableName, int $offset, int $limit, bool $incrementalSync = false): array
    {
        try {
            // SUM all daily changes to get actual stock values
            // This is how Logo calculates "Gerçek Stok" (Real Stock)
            $query = DB::connection($this->connection)
                ->table($tableName)
                ->selectRaw('
                    MIN(LOGICALREF) as logo_id,
                    STOCKREF as product_logo_id,
                    INVENNO as warehouse_number,
                    SUM(ONHAND) as quantity_on_hand,
                    SUM(RESERVED) as quantity_reserved,
                    SUM(RECEIVED) as quantity_received,
                    SUM(SHIPPED) as quantity_shipped
                ')
                ->where('INVENNO', '>=', 0) // Only actual warehouses, not consolidated (-1)
                ->groupBy('STOCKREF', 'INVENNO')
                ->havingRaw('SUM(ONHAND) != 0') // Only items with non-zero stock
                ->offset($offset)
                ->limit($limit);

            $stocks = $query->get();

            return [
                'success' => true,
                'data' => $stocks,
                'count' => $stocks->count(),
            ];

        } catch (Exception $e) {
            Log::error('Get Logo stock paged error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
            ];
        }
    }

    /**
     * Sync single stock record
     */
    protected function syncSingleStock(object $logoStock, int $firmNo): array
    {
        try {
            // Find the product
            $product = Product::where('logo_id', $logoStock->product_logo_id)
                ->where('logo_firm_no', $firmNo)
                ->first();

            if (!$product) {
                return [
                    'action' => 'skipped',
                    'error' => "Product not found for Logo ID: {$logoStock->product_logo_id}",
                ];
            }

            // Find or create warehouse
            // Warehouse number in Logo might need mapping to local warehouse
            $warehouse = $this->findOrCreateWarehouse($logoStock->warehouse_number, $firmNo);

            if (!$warehouse) {
                return [
                    'action' => 'skipped',
                    'error' => "Warehouse not found/created for number: {$logoStock->warehouse_number}",
                ];
            }

            // Find or create inventory item
            // Use product_id as primary key; if SKU already taken by another product, append product_id
            $sku = $product->code;
            $existingSku = InventoryItem::where('sku', $sku)->where('product_id', '!=', $product->id)->first();
            if ($existingSku) {
                $sku = $product->code . '-' . $product->id;
            }

            $inventoryItem = InventoryItem::updateOrCreate(
                [
                    'product_id' => $product->id,
                ],
                [
                    'sku' => $sku,
                    'name' => $product->name,
                ]
            );

            // Update or create inventory stock
            $inventoryStock = InventoryStock::updateOrCreate(
                [
                    'inventory_item_id' => $inventoryItem->id,
                    'warehouse_id' => $warehouse->id,
                ],
                [
                    'quantity_on_hand' => $logoStock->quantity_on_hand ?? 0,
                    'quantity_reserved' => $logoStock->quantity_reserved ?? 0,
                    'quantity_on_order' => $logoStock->quantity_on_order ?? 0,
                    'quantity_available' => max(0, ($logoStock->quantity_on_hand ?? 0) - ($logoStock->quantity_reserved ?? 0)),
                    'status' => 'active',
                    'logo_synced_at' => now(),
                ]
            );

            $wasRecentlyCreated = $inventoryStock->wasRecentlyCreated;

            // Also update stock_quantity on the product for backward compatibility
            // Calculate total stock across all warehouses for this product
            $totalStock = InventoryStock::whereHas('inventoryItem', function ($query) use ($product) {
                $query->where('product_id', $product->id);
            })->sum('quantity_on_hand');

            $product->update(['stock_quantity' => $totalStock]);

            return [
                'action' => $wasRecentlyCreated ? 'created' : 'updated',
                'inventory_stock' => $inventoryStock,
            ];

        } catch (Exception $e) {
            Log::error("Sync stock error for product Logo ID {$logoStock->product_logo_id}: " . $e->getMessage());

            return [
                'action' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Find or create warehouse by Logo warehouse number
     *
     * INVENNO values in Logo:
     * -1: Consolidated stock across all warehouses (use default warehouse)
     *  0: Main warehouse
     *  1+: Secondary warehouses
     */
    protected function findOrCreateWarehouse(int $warehouseNumber, int $firmNo): ?Warehouse
    {
        try {
            // Handle consolidated stock (INVENNO = -1) - use or create default warehouse
            if ($warehouseNumber == -1) {
                $warehouse = Warehouse::where('is_default', true)->first();
                if ($warehouse) {
                    return $warehouse;
                }
                // Create default warehouse for consolidated stock
                $warehouseNumber = 0; // Treat as main warehouse
            }

            // Try to find existing warehouse by code or Logo reference
            $warehouse = Warehouse::where('code', "LOGO-{$firmNo}-{$warehouseNumber}")
                ->orWhere('name', 'like', "%Depo {$warehouseNumber}%")
                ->first();

            if ($warehouse) {
                return $warehouse;
            }

            // Determine warehouse name
            $warehouseName = match ($warehouseNumber) {
                0 => "Logo Ana Depo",
                default => "Logo Depo {$warehouseNumber}",
            };

            // Create new warehouse
            $warehouse = Warehouse::create([
                'code' => "LOGO-{$firmNo}-{$warehouseNumber}",
                'name' => $warehouseName,
                'address' => 'Logo ERP Depo',
                'city' => 'Istanbul',
                'country' => 'Turkey',
                'warehouse_type' => 'main',
                'status' => 'active',
                'is_default' => $warehouseNumber == 0 || $warehouseNumber == -1,
            ]);

            Log::info("Created warehouse for Logo number {$warehouseNumber}: {$warehouse->name}");

            return $warehouse;

        } catch (Exception $e) {
            Log::error("Error finding/creating warehouse {$warehouseNumber}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get last stock sync session for incremental sync
     */
    protected function getLastStockSyncSession(int $firmNo): ?int
    {
        $lastSync = InventoryStock::whereNotNull('logo_synced_at')
            ->orderBy('logo_synced_at', 'desc')
            ->first();

        // Return conservative estimate
        // TODO: Store and retrieve actual Logo session numbers
        return $lastSync ? 0 : null;
    }

    /**
     * Get sync statistics
     */
    public function getSyncStats(): array
    {
        try {
            $totalStockRecords = InventoryStock::whereNotNull('logo_synced_at')->count();
            $totalWarehouses = Warehouse::where('code', 'like', 'LOGO-%')->count();
            $lastSync = InventoryStock::whereNotNull('logo_synced_at')
                ->orderBy('logo_synced_at', 'desc')
                ->first();

            $totalQuantity = InventoryStock::whereNotNull('logo_synced_at')
                ->sum('quantity_on_hand');

            return [
                'success' => true,
                'total_stock_records' => $totalStockRecords,
                'total_warehouses' => $totalWarehouses,
                'total_quantity_on_hand' => (int) $totalQuantity,
                'last_sync' => $lastSync?->logo_synced_at?->format('Y-m-d H:i:s'),
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
