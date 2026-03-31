<?php

namespace App\Services;

use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\SalesRepresentative;
use App\Models\Product;
use App\Models\CurrentAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class LogoOrderSyncService
{
    protected LogoService $logoService;
    protected string $connection = 'logo';

    // Possible table name patterns for order lines
    protected array $possibleLineTablePatterns = [
        'LG_%03d_ORFLINE',      // Standard format
        'LG_%03d_01_ORFLINE',   // Alternative format
        'LG_%s_ORFLINE',        // Without leading zeros
    ];

    // Possible table name patterns for order headers
    protected array $possibleHeaderTablePatterns = [
        'LG_%03d_ORFICHE',      // Standard format
        'LG_%03d_01_ORFICHE',   // Alternative format
        'LG_%s_ORFICHE',        // Without leading zeros
    ];

    public function __construct(LogoService $logoService)
    {
        $this->logoService = $logoService;
    }

    /**
     * Sync order lines from Logo database
     */
    public function syncOrderLines(?int $firmNo = null, ?int $limit = null, ?string $tableName = null, bool $continueOnError = true): array
    {
        $firmNo = $firmNo ?? LogoService::getDefaultFirmNo();

        try {
            Log::info("Starting Logo order line sync for firm {$firmNo}");

            // Find table if not provided
            if (!$tableName) {
                $tableName = $this->findOrderLineTable($firmNo);
                if (!$tableName) {
                    return [
                        'success' => false,
                        'error' => "Order line table not found for firm {$firmNo}",
                    ];
                }
            }

            Log::info("Using order line table: {$tableName}");

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
            $totalRecords = $limit ?? $this->getTotalOrderLineCount($firmNo, $tableName);

            Log::info("Total records to sync: {$totalRecords}");

            // Process in pages
            while ($offset < $totalRecords) {
                $currentPageSize = min($pageSize, $totalRecords - $offset);

                Log::info("Fetching page: offset={$offset}, limit={$currentPageSize}");

                // Get order lines for this page
                $logoOrderLines = $this->getLogoOrderLinesPaged($firmNo, $tableName, $offset, $currentPageSize);

                if (!$logoOrderLines['success']) {
                    Log::error("Failed to fetch page at offset {$offset}: {$logoOrderLines['error']}");
                    if (!$continueOnError) {
                        return [
                            'success' => false,
                            'error' => $logoOrderLines['error'],
                        ];
                    }
                    break;
                }

                $orderLines = $logoOrderLines['data'];
                $stats['total'] += count($orderLines);

                // Process this page in a transaction
                DB::beginTransaction();

                try {
                    foreach ($orderLines as $logoOrderLine) {
                        $result = $this->syncSingleOrderLine($logoOrderLine, $firmNo);

                        if ($result['action'] === 'created') {
                            $stats['created']++;
                        } elseif ($result['action'] === 'updated') {
                            $stats['updated']++;
                        } elseif ($result['action'] === 'error') {
                            $stats['skipped']++;
                            if (isset($result['error'])) {
                                $errorMsg = "Logo ID {$logoOrderLine->logo_id}: {$result['error']}";
                                $stats['errors'][] = $errorMsg;
                                // Only log first 10 errors to avoid flooding
                                if (count($stats['errors']) <= 10) {
                                    Log::warning($errorMsg);
                                }
                            }

                            // Stop on error if continueOnError is false
                            if (!$continueOnError) {
                                throw new Exception($result['error']);
                            }
                        } else {
                            $stats['skipped']++;
                        }
                    }

                    DB::commit();

                    // Log progress after each page
                    $progress = round(($offset + $currentPageSize) / $totalRecords * 100, 1);
                    Log::info("Progress: {$progress}% - Created={$stats['created']}, Updated={$stats['updated']}, Skipped={$stats['skipped']}");

                } catch (Exception $e) {
                    DB::rollBack();

                    if (!$continueOnError) {
                        throw $e;
                    }

                    Log::error("Page processing error at offset {$offset}: " . $e->getMessage());
                }

                // Move to next page
                $offset += $pageSize;

                // Free memory
                unset($orderLines);
                unset($logoOrderLines);
            }

            Log::info('Logo order line sync completed', $stats);

            return [
                'success' => true,
                'stats' => $stats,
            ];

        } catch (Exception $e) {
            Log::error('Logo order line sync error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Find the correct order line table name
     */
    protected function findOrderLineTable(int $firmNo): ?string
    {
        try {
            // Try each possible pattern
            foreach ($this->possibleLineTablePatterns as $pattern) {
                $tableName = sprintf($pattern, $firmNo);

                $exists = DB::connection($this->connection)
                    ->selectOne("
                        SELECT COUNT(*) as count
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_NAME = ?
                    ", [$tableName]);

                if ($exists && $exists->count > 0) {
                    Log::info("Found order line table: {$tableName}");
                    return $tableName;
                }
            }

            // If not found with patterns, search for any table containing ORFLINE
            $tables = DB::connection($this->connection)
                ->select("
                    SELECT TABLE_NAME
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME LIKE ?
                ", ["LG_{$firmNo}%ORFLINE%"]);

            if (!empty($tables)) {
                $tableName = $tables[0]->TABLE_NAME;
                Log::info("Found order line table by search: {$tableName}");
                return $tableName;
            }

            return null;
        } catch (Exception $e) {
            Log::error("Error finding order line table: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Find the correct order header table name
     */
    protected function findOrderHeaderTable(int $firmNo): ?string
    {
        try {
            // Try each possible pattern
            foreach ($this->possibleHeaderTablePatterns as $pattern) {
                $tableName = sprintf($pattern, $firmNo);

                $exists = DB::connection($this->connection)
                    ->selectOne("
                        SELECT COUNT(*) as count
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_NAME = ?
                    ", [$tableName]);

                if ($exists && $exists->count > 0) {
                    return $tableName;
                }
            }

            // If not found with patterns, search for any table containing ORFICHE
            $tables = DB::connection($this->connection)
                ->select("
                    SELECT TABLE_NAME
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME LIKE ?
                ", ["LG_{$firmNo}%ORFICHE%"]);

            if (!empty($tables)) {
                return $tables[0]->TABLE_NAME;
            }

            return null;
        } catch (Exception $e) {
            Log::error("Error finding order header table: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get order header data from Logo
     */
    protected function getLogoOrderHeader(int $logoOrderRef, int $firmNo): ?object
    {
        try {
            $headerTable = $this->findOrderHeaderTable($firmNo);
            if (!$headerTable) {
                return null;
            }

            return DB::connection($this->connection)
                ->table($headerTable)
                ->select([
                    'LOGICALREF as logo_id',
                    'FICHENO as order_number',
                    'DATE_ as order_date',
                    'CLIENTREF as client_ref',
                    'NETTOTAL as net_total',
                    'GROSSTOTAL as gross_total',
                    'TOTALVAT as total_vat',
                    'TOTALDISCOUNTS as total_discounts',
                    'TOTALEXPENSES as total_expenses',
                    'TRCODE as tr_code',
                    'STATUS as status',
                    'CANCELLED as is_cancelled',
                    'DOCODE as document_code',
                    'SPECODE as special_code',
                    'SALESMANREF as salesman_ref',
                    'TRCURR as currency',
                    'TRRATE as exchange_rate',
                    // Kullanici bilgileri
                    'CAPIBLOCK_CREATEDBY as created_by',
                    'CAPIBLOCK_CREADEDDATE as created_date',
                    'CAPIBLOCK_MODIFIEDBY as modified_by',
                    'CAPIBLOCK_MODIFIEDDATE as modified_date',
                ])
                ->where('LOGICALREF', $logoOrderRef)
                ->first();

        } catch (Exception $e) {
            Log::error("Error fetching order header: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get total order line count from Logo database
     */
    protected function getTotalOrderLineCount(int $firmNo, string $tableName): int
    {
        try {
            $result = DB::connection($this->connection)
                ->table($tableName)
                ->where('LINETYPE', 0) // 0 = Normal line
                ->where('CANCELLED', 0) // Not cancelled
                ->count();

            return $result;
        } catch (Exception $e) {
            Log::error('Get Logo order line count error: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get order lines from Logo database with pagination
     */
    protected function getLogoOrderLinesPaged(int $firmNo, string $tableName, int $offset, int $limit): array
    {
        try {
            $orderLines = DB::connection($this->connection)
                ->table($tableName)
                ->select([
                    'LOGICALREF as logo_id',
                    'STOCKREF as stock_ref',
                    'ORDFICHEREF as order_ref',
                    'CLIENTREF as client_ref',
                    'LINENO_ as line_no',
                    'TRCODE as tr_code',
                    'DATE_ as date',
                    'AMOUNT as quantity',
                    'PRICE as unit_price',
                    'TOTAL as gross_total',
                    'LINENET as net_total',
                    'DISCPER as discount_rate',
                    'VAT as vat_rate',
                    'VATAMNT as vat_amount',
                    'VATMATRAH as vat_base',
                    'LINEEXP as description',
                    'UOMREF as unit_ref',
                    'STATUS as status',
                    'CLOSED as is_closed',
                    'DUEDATE as due_date',
                ])
                ->where('LINETYPE', 0) // 0 = Normal line
                ->where('CANCELLED', 0) // Not cancelled
                ->offset($offset)
                ->limit($limit)
                ->get();

            return [
                'success' => true,
                'data' => $orderLines,
                'count' => $orderLines->count(),
            ];

        } catch (Exception $e) {
            Log::error('Get Logo order lines paged error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
            ];
        }
    }

    /**
     * Sync single order line
     */
    protected function syncSingleOrderLine(object $logoOrderLine, int $firmNo): array
    {
        try {
            // Find or create the sales order (header)
            $salesOrder = $this->findOrCreateSalesOrder($logoOrderLine->order_ref, $logoOrderLine->client_ref, $firmNo);

            if (!$salesOrder) {
                return [
                    'action' => 'error',
                    'error' => "Could not find or create sales order for order_ref: {$logoOrderLine->order_ref}",
                ];
            }

            // Find product by stock_ref (Logo product ID)
            $product = Product::where('logo_id', $logoOrderLine->stock_ref)
                ->where('logo_firm_no', $firmNo)
                ->first();

            if (!$product) {
                return [
                    'action' => 'error',
                    'error' => "Product not found for stock_ref: {$logoOrderLine->stock_ref}",
                ];
            }

            // Check if order line already exists by logo_id
            $existingOrderLine = SalesOrderItem::where('logo_id', $logoOrderLine->logo_id)
                ->first();

            $orderLineData = $this->mapLogoOrderLineToLocal($logoOrderLine, $salesOrder, $product, $firmNo);

            if ($existingOrderLine) {
                // Update existing order line
                $existingOrderLine->update($orderLineData);

                return [
                    'action' => 'updated',
                    'order_line' => $existingOrderLine,
                ];
            } else {
                // Create new order line
                $newOrderLine = SalesOrderItem::create($orderLineData);

                return [
                    'action' => 'created',
                    'order_line' => $newOrderLine,
                ];
            }

        } catch (Exception $e) {
            Log::error("Sync order line error for Logo ID {$logoOrderLine->logo_id}: " . $e->getMessage());

            return [
                'action' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Find or create sales order
     */
    protected function findOrCreateSalesOrder(int $logoOrderRef, ?int $logoClientRef, int $firmNo): ?SalesOrder
    {
        try {
            // Try to find existing order by logo_id
            $salesOrder = SalesOrder::where('logo_id', $logoOrderRef)
                ->where('logo_firm_no', $firmNo)
                ->first();

            // Get order header data from Logo for totals
            $logoHeader = $this->getLogoOrderHeader($logoOrderRef, $firmNo);

            if ($salesOrder) {
                // Update existing order with Logo totals if header data available
                if ($logoHeader) {
                    $updateData = [
                        'subtotal' => $logoHeader->net_total ?? 0,
                        'tax_amount' => $logoHeader->total_vat ?? 0,
                        'discount_amount' => $logoHeader->total_discounts ?? 0,
                        'total_amount' => $logoHeader->gross_total ?? 0,
                        'logo_synced_at' => now(),
                    ];

                    // Kullanici bilgilerini guncelle (Logo ve ERP user ID'leri ayni)
                    if (!empty($logoHeader->created_by)) {
                        $updateData['created_by_id'] = $logoHeader->created_by;
                    }
                    // Find SalesRepresentative by Logo SALESMANREF
                    if (!empty($logoHeader->salesman_ref) && $logoHeader->salesman_ref > 0) {
                        $salesRep = SalesRepresentative::where('logo_id', $logoHeader->salesman_ref)
                            ->where('logo_firm_no', $firmNo)
                            ->first();
                        if ($salesRep) {
                            $updateData['salesperson_id'] = $salesRep->id;
                        }
                    }

                    $salesOrder->update($updateData);
                }
                return $salesOrder;
            }

            // Check if client_ref is available to find customer
            if ($logoClientRef === null) {
                Log::warning("Cannot create sales order: client_ref is null for order_ref: {$logoOrderRef}");
                return null;
            }

            // Find customer by logo_id
            $customer = CurrentAccount::where('logo_id', $logoClientRef)
                ->where('logo_firm_no', $firmNo)
                ->first();

            if (!$customer) {
                Log::warning("Customer not found for logo client_ref: {$logoClientRef}");
                return null;
            }

            // Logo stores all amounts in TRY (NETTOTAL, GROSSTOTAL etc.)
            // TRCURR indicates pricing currency, but amounts are always in local currency (TRY)
            // So we always use TRY as the order currency when syncing from Logo
            $currency = 'TRY';

            // Determine pricing currency from Logo TRCURR (for showing foreign currency equivalent)
            $pricingCurrency = null;
            $exchangeRate = 1;
            if ($logoHeader && $logoHeader->currency !== null && (int)$logoHeader->currency !== 0) {
                $currencyMap = [1 => 'USD', 20 => 'EUR', 4 => 'GBP'];
                $pricingCurrency = $currencyMap[(int)$logoHeader->currency] ?? null;
                $exchangeRate = $logoHeader->exchange_rate ?? 1;
            }

            // Find SalesRepresentative by Logo SALESMANREF
            $salespersonId = null;
            if (!empty($logoHeader->salesman_ref) && $logoHeader->salesman_ref > 0) {
                $salesRep = SalesRepresentative::where('logo_id', $logoHeader->salesman_ref)
                    ->where('logo_firm_no', $firmNo)
                    ->first();
                if ($salesRep) {
                    $salespersonId = $salesRep->id;
                }
            }

            // Create new sales order with Logo totals
            // Teklif carisi (ID: 7576) için taslak, diğerleri için onaylandı
            $orderStatus = ($customer->id == 7576)
                ? SalesOrder::STATUS_DRAFT
                : SalesOrder::STATUS_CONFIRMED;

            $salesOrder = SalesOrder::create([
                'logo_id' => $logoOrderRef,
                'logo_firm_no' => $firmNo,
                'customer_id' => $customer->id,
                'order_number' => $logoHeader->order_number ?? null,
                'order_date' => $logoHeader ? date('Y-m-d', strtotime($logoHeader->order_date)) : now(),
                'status' => $orderStatus,
                'priority' => SalesOrder::PRIORITY_NORMAL,
                'subtotal' => $logoHeader->net_total ?? 0,
                'tax_amount' => $logoHeader->total_vat ?? 0,
                'discount_amount' => $logoHeader->total_discounts ?? 0,
                'shipping_cost' => $logoHeader->total_expenses ?? 0,
                'total_amount' => $logoHeader->gross_total ?? 0,
                'currency' => $currency,
                'exchange_rate' => $exchangeRate,
                'pricing_currency' => $pricingCurrency,
                'created_by_id' => $logoHeader->created_by ?? null,
                'salesperson_id' => $salespersonId,
                'logo_synced_at' => now(),
            ]);

            return $salesOrder;

        } catch (Exception $e) {
            Log::error("Error finding or creating sales order: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Map Logo order line data to local database structure
     */
    protected function mapLogoOrderLineToLocal(object $logoOrderLine, SalesOrder $salesOrder, Product $product, int $firmNo): array
    {
        $netTotal = $logoOrderLine->net_total ?? 0;
        $vatAmount = $logoOrderLine->vat_amount ?? 0;
        $lineTotal = $netTotal + $vatAmount;
        $unitPrice = $logoOrderLine->unit_price ?? 0;

        // Calculate foreign currency amounts if order has pricing_currency
        $foreignUnitPrice = null;
        $foreignLineTotal = null;
        $pricingCurrency = $salesOrder->pricing_currency;

        if ($pricingCurrency && $salesOrder->exchange_rate > 0) {
            $foreignUnitPrice = $unitPrice / $salesOrder->exchange_rate;
            $foreignLineTotal = $lineTotal / $salesOrder->exchange_rate;
        }

        return [
            'logo_id' => $logoOrderLine->logo_id,
            'logo_firm_no' => $firmNo,
            'logo_order_ref' => $logoOrderLine->order_ref,
            'sales_order_id' => $salesOrder->id,
            'product_id' => $product->id,
            'product_code' => $product->code,
            'product_name' => $product->name,
            'quantity' => $logoOrderLine->quantity ?? 0,
            'unit_price' => $unitPrice,
            'discount_percentage' => $logoOrderLine->discount_rate ?? 0,
            'discount_amount' => 0, // Logo'da DISTDISC var ama şimdilik 0
            'tax_rate' => $logoOrderLine->vat_rate ?? 0,
            'tax_amount' => $vatAmount,
            'line_total' => $lineTotal,
            'pricing_currency' => $pricingCurrency,
            'foreign_unit_price' => $foreignUnitPrice,
            'foreign_line_total' => $foreignLineTotal,
            'remaining_quantity' => $logoOrderLine->quantity ?? 0,
            'status' => SalesOrderItem::STATUS_PENDING,
            'notes' => $logoOrderLine->description,
            'logo_synced_at' => now(),
        ];
    }

    /**
     * Update order totals and user info from Logo for existing orders
     *
     * @param int|null $firmNo Firm number (defaults to env LOGO_FIRM_NO)
     * @param int|null $limit Limit records
     * @param bool $onlyZeroTotals Only update orders with zero totals (default: false = update all)
     */
    public function updateOrderTotals(?int $firmNo = null, ?int $limit = null, bool $onlyZeroTotals = false): array
    {
        $firmNo = $firmNo ?? LogoService::getDefaultFirmNo();

        try {
            Log::info("Starting order update for firm {$firmNo}", ['only_zero_totals' => $onlyZeroTotals]);

            $query = SalesOrder::where('logo_firm_no', $firmNo)
                ->whereNotNull('logo_id');

            // Sadece sifir tutarli siparisleri mi guncelleyelim?
            if ($onlyZeroTotals) {
                $query->where(function ($q) {
                    $q->where('total_amount', 0)
                      ->orWhereNull('total_amount');
                });
            }

            if ($limit) {
                $query->limit($limit);
            }

            $orders = $query->get();

            $stats = [
                'total' => $orders->count(),
                'updated' => 0,
                'skipped' => 0,
                'errors' => [],
            ];

            foreach ($orders as $order) {
                $logoHeader = $this->getLogoOrderHeader($order->logo_id, $firmNo);

                if (!$logoHeader) {
                    $stats['skipped']++;
                    continue;
                }

                try {
                    // Determine pricing currency from Logo TRCURR
                    $pricingCurrency = null;
                    $exchangeRate = 1;
                    if ($logoHeader->currency !== null && (int)$logoHeader->currency !== 0) {
                        $currencyMap = [1 => 'USD', 20 => 'EUR', 4 => 'GBP'];
                        $pricingCurrency = $currencyMap[(int)$logoHeader->currency] ?? null;
                        $exchangeRate = $logoHeader->exchange_rate ?? 1;
                    }

                    // Logo stores all amounts in TRY regardless of TRCURR
                    $updateData = [
                        'subtotal' => $logoHeader->net_total ?? 0,
                        'tax_amount' => $logoHeader->total_vat ?? 0,
                        'discount_amount' => $logoHeader->total_discounts ?? 0,
                        'total_amount' => $logoHeader->gross_total ?? 0,
                        'currency' => 'TRY',
                        'exchange_rate' => $exchangeRate,
                        'pricing_currency' => $pricingCurrency,
                        'logo_synced_at' => now(),
                    ];

                    // Kullanici bilgilerini de guncelle
                    if (!empty($logoHeader->created_by)) {
                        $updateData['created_by_id'] = $logoHeader->created_by;
                    }

                    // Find SalesRepresentative by Logo SALESMANREF
                    if (!empty($logoHeader->salesman_ref) && $logoHeader->salesman_ref > 0) {
                        $salesRep = SalesRepresentative::where('logo_id', $logoHeader->salesman_ref)
                            ->where('logo_firm_no', $firmNo)
                            ->first();
                        if ($salesRep) {
                            $updateData['salesperson_id'] = $salesRep->id;
                        }
                    }

                    $order->update($updateData);
                    $stats['updated']++;
                } catch (Exception $e) {
                    $stats['errors'][] = "Order {$order->id}: {$e->getMessage()}";
                }
            }

            Log::info('Order totals update completed', $stats);

            return [
                'success' => true,
                'stats' => $stats,
            ];

        } catch (Exception $e) {
            Log::error('Update order totals error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get sync statistics
     */
    public function getSyncStats(): array
    {
        try {
            $total = SalesOrderItem::whereNotNull('logo_id')->count();
            $totalOrders = SalesOrder::whereNotNull('logo_id')->count();
            $ordersWithZeroTotal = SalesOrder::whereNotNull('logo_id')
                ->where(function ($q) {
                    $q->where('total_amount', 0)
                      ->orWhereNull('total_amount');
                })
                ->count();

            $lastSync = SalesOrderItem::whereNotNull('logo_synced_at')
                ->orderBy('logo_synced_at', 'desc')
                ->first();

            return [
                'success' => true,
                'total_synced_lines' => $total,
                'total_synced_orders' => $totalOrders,
                'orders_with_zero_total' => $ordersWithZeroTotal,
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
