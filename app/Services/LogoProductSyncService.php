<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;

class LogoProductSyncService
{
    protected LogoService $logoService;
    protected string $connection = 'logo';

    // Possible table name patterns for products
    protected array $possibleTablePatterns = [
        'LG_%03d_ITEMS',      // Standard format
        'LG_%03d_01_ITEMS',   // Alternative format
        'LG_%s_ITEMS',        // Without leading zeros
    ];

    // Caches for category, unit and brand lookups
    protected array $categoryCache = [];
    protected array $unitCache = [];
    protected array $brandCache = [];

    public function __construct(LogoService $logoService)
    {
        $this->logoService = $logoService;
    }

    /**
     * Sync products from Logo database
     */
    public function syncProducts(?int $firmNo = null, ?int $limit = null, ?string $tableName = null, bool $continueOnError = true, bool $incrementalSync = false, ?callable $progressCallback = null): array
    {
        $firmNo = $firmNo ?? LogoService::getDefaultFirmNo();

        try {
            Log::info("Starting Logo product sync for firm {$firmNo}");

            // Find table if not provided
            if (!$tableName) {
                $tableName = $this->findProductTable($firmNo);
                if (!$tableName) {
                    return [
                        'success' => false,
                        'error' => "Product table not found for firm {$firmNo}",
                    ];
                }
            }

            Log::info("Using product table: {$tableName}");

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
            $totalRecords = $limit ?? $this->getTotalProductCount($firmNo, $tableName, $incrementalSync);

            Log::info("Total records to sync: {$totalRecords}");

            // Notify progress callback with total
            if ($progressCallback) {
                $progressCallback(['type' => 'total', 'total' => $totalRecords]);
            }

            // Process in pages
            while ($offset < $totalRecords) {
                $currentPageSize = min($pageSize, $totalRecords - $offset);

                Log::info("Fetching page: offset={$offset}, limit={$currentPageSize}");

                // Get products for this page
                $logoProducts = $this->getLogoProductsPaged($firmNo, $tableName, $offset, $currentPageSize, $incrementalSync);

                if (!$logoProducts['success']) {
                    Log::error("Failed to fetch page at offset {$offset}: {$logoProducts['error']}");
                    if (!$continueOnError) {
                        return [
                            'success' => false,
                            'error' => $logoProducts['error'],
                        ];
                    }
                    break;
                }

                $products = $logoProducts['data'];
                $stats['total'] += count($products);

                // Process this page in a transaction
                DB::beginTransaction();

                try {
                    // Batch pre-load existing products for this page
                    $logoIds = collect($products)->pluck('logo_id')->filter()->toArray();
                    $codes = collect($products)->pluck('code')->filter()->toArray();
                    $existingByLogoId = Product::whereIn('logo_id', $logoIds)->get()->keyBy('logo_id');
                    $existingByCode = Product::whereIn('code', $codes)->get()->keyBy('code');

                    foreach ($products as $logoProduct) {
                        $result = $this->syncSingleProductBatch($logoProduct, $firmNo, $existingByLogoId, $existingByCode);

                        if ($result['action'] === 'created') {
                            $stats['created']++;
                        } elseif ($result['action'] === 'updated') {
                            $stats['updated']++;
                        } elseif ($result['action'] === 'error') {
                            $stats['skipped']++;
                            if (isset($result['error'])) {
                                $errorMsg = "Logo ID {$logoProduct->logo_id} ({$logoProduct->code}): {$result['error']}";
                                $stats['errors'][] = $errorMsg;
                                if (\count($stats['errors']) <= 10) {
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

                    // Log progress after each page
                    $progress = round(($offset + $currentPageSize) / $totalRecords * 100, 1);
                    Log::info("Progress: {$progress}% - Created={$stats['created']}, Updated={$stats['updated']}, Skipped={$stats['skipped']}");

                    // Notify progress callback
                    if ($progressCallback) {
                        $progressCallback([
                            'type' => 'page_done',
                            'page_count' => count($products),
                            'created' => $stats['created'],
                            'updated' => $stats['updated'],
                            'skipped' => $stats['skipped'],
                        ]);
                    }

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
                unset($products);
                unset($logoProducts);
            }

            Log::info('Logo product sync completed', $stats);

            return [
                'success' => true,
                'stats' => $stats,
            ];

        } catch (Exception $e) {
            Log::error('Logo product sync error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Find the correct product table name
     */
    protected function findProductTable(int $firmNo): ?string
    {
        try {
            // Try each possible pattern
            foreach ($this->possibleTablePatterns as $pattern) {
                $tableName = sprintf($pattern, $firmNo);

                $exists = DB::connection($this->connection)
                    ->selectOne("
                        SELECT COUNT(*) as count
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_NAME = ?
                    ", [$tableName]);

                if ($exists && $exists->count > 0) {
                    Log::info("Found product table: {$tableName}");
                    return $tableName;
                }
            }

            // If not found with patterns, search for any table containing ITEMS
            $tables = DB::connection($this->connection)
                ->select("
                    SELECT TABLE_NAME
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME LIKE ?
                    AND TABLE_NAME NOT LIKE '%ITEMSUBS%'
                ", ["LG_{$firmNo}%ITEMS%"]);

            if (!empty($tables)) {
                $tableName = $tables[0]->TABLE_NAME;
                Log::info("Found product table by search: {$tableName}");
                return $tableName;
            }

            return null;
        } catch (Exception $e) {
            Log::error("Error finding product table: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get total product count from Logo database
     */
    protected function getTotalProductCount(int $firmNo, string $tableName, bool $incrementalSync = false): int
    {
        try {
            $query = DB::connection($this->connection)
                ->table($tableName)
                ->where('CARDTYPE', '!=', 22); // Exclude alternative products

            // Incremental sync: only count records modified after last sync
            if ($incrementalSync) {
                $lastSyncSession = $this->getLastProductSyncSession($firmNo);
                if ($lastSyncSession) {
                    $query->where('LAESSION', '>', $lastSyncSession);
                }
            }

            $result = $query->count();

            return $result;
        } catch (Exception $e) {
            Log::error('Get Logo product count error: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get products from Logo database with pagination
     */
    protected function getLogoProductsPaged(int $firmNo, string $tableName, int $offset, int $limit, bool $incrementalSync = false): array
    {
        try {
            $query = DB::connection($this->connection)
                ->table($tableName)
                ->select([
                    'LOGICALREF as logo_id',
                    'CODE as code',
                    'NAME as name',
                    'PRODUCERCODE as producer_code',
                    'SPECODE as specode',
                    'SPECODE2 as specode2',
                    'SPECODE3 as specode3',
                    'STGRPCODE as group_code',
                    'VAT as vat_rate',
                    'SELLVAT as sell_vat_rate',
                    'CARDTYPE as card_type',
                    'ACTIVE as is_active',
                    'UNITSETREF as unit_set_ref',
                    'PURCHBRWS as can_be_purchased',
                    'SALESBRWS as can_be_sold',
                    'TRACKTYPE as track_type',
                    'EANBARCODE as ean_barcode',
                    'GTIPCODE as gtip_code',
                    'PRODCOUNTRY as country_of_origin',
                    // New fields for category, unit, brand mapping
                    'CATEGORYNAME as category_name',
                    'CATEGORYID as category_code',
                    'MARKREF as brand_ref',
                ])
                ->where('CARDTYPE', '!=', 22) // Exclude alternative products
                ->offset($offset)
                ->limit($limit);

            // Incremental sync: only get records modified after last sync
            if ($incrementalSync) {
                $lastSyncSession = $this->getLastProductSyncSession($firmNo);
                if ($lastSyncSession) {
                    $query->where('LAESSION', '>', $lastSyncSession);
                    Log::info("Incremental sync: fetching products modified after session {$lastSyncSession}");
                }
            }

            $products = $query->get();

            return [
                'success' => true,
                'data' => $products,
                'count' => $products->count(),
            ];

        } catch (Exception $e) {
            Log::error('Get Logo products paged error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
            ];
        }
    }

    /**
     * Get products from Logo database (legacy method - kept for compatibility)
     */
    protected function getLogoProducts(int $firmNo, ?int $limit, ?string $tableName = null): array
    {
        try {
            // Use provided table name or auto-detect
            if (!$tableName) {
                $tableName = $this->findProductTable($firmNo);

                if (!$tableName) {
                    return [
                        'success' => false,
                        'error' => "Product table not found for firm {$firmNo}. Tried patterns: " .
                                   implode(', ', array_map(fn($p) => sprintf($p, $firmNo), $this->possibleTablePatterns)),
                        'data' => [],
                    ];
                }
            }

            Log::info("Using product table: {$tableName}");

            $query = DB::connection($this->connection)
                ->table($tableName)
                ->select([
                    'LOGICALREF as logo_id',
                    'CODE as code',
                    'NAME as name',
                    'PRODUCERCODE as producer_code',
                    'SPECODE as specode',
                    'SPECODE2 as specode2',
                    'SPECODE3 as specode3',
                    'STGRPCODE as group_code',
                    'VAT as vat_rate',
                    'SELLVAT as sell_vat_rate',
                    'CARDTYPE as card_type', // 1=Ticari mal, 2=Karma, 3=Hammadde, 4=Yarımamul, 10=Hizmet, 11=Depozito, 12=Ambalaj, 13=Sabit kıymet, 22=Alternatif
                    'ACTIVE as is_active', // 0=Active, 1=Inactive
                    'UNITSETREF as unit_set_ref',
                    'PURCHBRWS as can_be_purchased', // 1=Can be purchased
                    'SALESBRWS as can_be_sold', // 1=Can be sold
                    'TRACKTYPE as track_type', // 0=No tracking, 1=Lot, 2=Serial
                    'EANBARCODE as ean_barcode',
                    'GTIPCODE as gtip_code',
                    'PRODCOUNTRY as country_of_origin',
                    // New fields for category, unit, brand mapping
                    'CATEGORYNAME as category_name',
                    'CATEGORYID as category_code',
                    'MARKREF as brand_ref',
                ])
                ->where('CARDTYPE', '!=', 22); // Exclude alternative products

            if ($limit) {
                $query->limit($limit);
            }

            $products = $query->get();

            return [
                'success' => true,
                'data' => $products,
                'count' => $products->count(),
                'table' => $tableName,
            ];

        } catch (Exception $e) {
            Log::error('Get Logo products error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
            ];
        }
    }

    /**
     * Sync single product with batch-loaded existing products (optimized)
     */
    protected function syncSingleProductBatch(object $logoProduct, int $firmNo, $existingByLogoId, $existingByCode): array
    {
        try {
            $productType = $this->determineProductType($logoProduct->card_type);

            // Use pre-loaded products instead of individual query
            $existingProduct = $existingByLogoId->get($logoProduct->logo_id)
                ?? $existingByCode->get($logoProduct->code);

            $productData = $this->mapLogoProductToLocal($logoProduct, $productType, $firmNo);

            if ($existingProduct) {
                $existingProduct->update($productData);

                if (!empty($logoProduct->unit_set_ref) && $logoProduct->unit_set_ref > 0) {
                    $this->syncProductUnitsFromLogo($existingProduct, $logoProduct->unit_set_ref, $firmNo);
                }

                return [
                    'action' => 'updated',
                    'product' => $existingProduct,
                ];
            } else {
                $newProduct = Product::create($productData);

                if (!empty($logoProduct->unit_set_ref) && $logoProduct->unit_set_ref > 0) {
                    $this->syncProductUnitsFromLogo($newProduct, $logoProduct->unit_set_ref, $firmNo);
                }

                return [
                    'action' => 'created',
                    'product' => $newProduct,
                ];
            }

        } catch (Exception $e) {
            Log::error("Sync product error for Logo ID {$logoProduct->logo_id}: " . $e->getMessage());

            return [
                'action' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Sync single product (legacy - kept for compatibility)
     */
    protected function syncSingleProduct(object $logoProduct, int $firmNo): array
    {
        try {
            // Determine product type from Logo CARDTYPE
            $productType = $this->determineProductType($logoProduct->card_type);

            // Check if product already exists by logo_id or code
            $existingProduct = Product::where('logo_id', $logoProduct->logo_id)
                ->orWhere('code', $logoProduct->code)
                ->first();

            $productData = $this->mapLogoProductToLocal($logoProduct, $productType, $firmNo);

            if ($existingProduct) {
                // Update existing product
                $existingProduct->update($productData);

                // Sync product units (conversions) from Logo
                if (!empty($logoProduct->unit_set_ref) && $logoProduct->unit_set_ref > 0) {
                    $this->syncProductUnitsFromLogo($existingProduct, $logoProduct->unit_set_ref, $firmNo);
                }

                return [
                    'action' => 'updated',
                    'product' => $existingProduct,
                ];
            } else {
                // Create new product
                $newProduct = Product::create($productData);

                // Sync product units (conversions) from Logo
                if (!empty($logoProduct->unit_set_ref) && $logoProduct->unit_set_ref > 0) {
                    $this->syncProductUnitsFromLogo($newProduct, $logoProduct->unit_set_ref, $firmNo);
                }

                return [
                    'action' => 'created',
                    'product' => $newProduct,
                ];
            }

        } catch (Exception $e) {
            Log::error("Sync product error for Logo ID {$logoProduct->logo_id}: " . $e->getMessage());

            return [
                'action' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Determine product type from Logo card type
     */
    protected function determineProductType(int $cardType): string
    {
        return match ($cardType) {
            1 => 'trading_goods',    // Ticari mal
            2 => 'trading_goods',    // Karma
            3 => 'raw_material',     // Hammadde
            4 => 'semi_finished',    // Yarımamul
            10 => 'service',         // Hizmet
            11 => 'trading_goods',   // Depozito
            12 => 'consumable',      // Ambalaj
            13 => 'finished_goods',  // Sabit kıymet
            default => 'trading_goods',
        };
    }

    /**
     * Map Logo product data to local database structure
     */
    protected function mapLogoProductToLocal(object $logoProduct, string $productType, int $firmNo): array
    {
        // Generate unique slug by appending logo_id
        $baseName = $logoProduct->name ?: $logoProduct->code;
        $slug = Str::slug($baseName) . '-' . $logoProduct->logo_id;

        // Get category_id from Logo CATEGORYNAME, fallback to STGRPCODE
        $categoryId = null;
        if (!empty($logoProduct->category_name)) {
            $categoryId = $this->findOrCreateCategory($logoProduct->category_name, $logoProduct->category_code ?? null);
        } elseif (!empty($logoProduct->group_code)) {
            // Fallback: use STGRPCODE if CATEGORYNAME is empty
            $categoryId = $this->findOrCreateCategoryFromStgrpCode($logoProduct->group_code);
        }

        // Get unit_id from Logo UNITSETREF
        $unitId = null;
        if (!empty($logoProduct->unit_set_ref) && $logoProduct->unit_set_ref > 0) {
            $unitId = $this->findOrCreateUnitFromLogoUnitSet($logoProduct->unit_set_ref, $firmNo);
        }

        // Get brand_id from Logo MARKREF
        $brandId = null;
        if (!empty($logoProduct->brand_ref) && $logoProduct->brand_ref > 0) {
            $brandId = $this->findOrCreateBrandFromLogoMark($logoProduct->brand_ref, $firmNo);
        }

        return [
            'logo_id' => $logoProduct->logo_id,
            'logo_firm_no' => $firmNo,
            'code' => $logoProduct->code,
            'name' => $baseName,
            'slug' => $slug,
            'barcode' => $logoProduct->ean_barcode,
            'logo_producer_code' => $logoProduct->producer_code,
            'logo_specode' => $logoProduct->specode,
            'product_type' => $productType,
            'tax_rate' => $logoProduct->sell_vat_rate ?? $logoProduct->vat_rate ?? 0,
            'is_active' => $logoProduct->is_active == 0, // Logo: 0=Active, 1=Inactive
            'can_be_purchased' => $logoProduct->can_be_purchased == 1,
            'can_be_sold' => $logoProduct->can_be_sold == 1,
            'is_stockable' => in_array($productType, ['finished_goods', 'raw_material', 'semi_finished', 'trading_goods', 'consumable']),
            'is_serialized' => $logoProduct->track_type == 2,
            'track_inventory' => $logoProduct->track_type != 0,
            'country_of_origin' => $logoProduct->country_of_origin,
            'category_id' => $categoryId,
            'unit_id' => $unitId,
            'brand_id' => $brandId,
            'logo_synced_at' => now(),
        ];
    }

    /**
     * Find or create a category by name
     */
    protected function findOrCreateCategory(string $categoryName, ?string $categoryCode = null): ?int
    {
        $categoryName = trim($categoryName);
        if (empty($categoryName)) {
            return null;
        }

        // Check cache first
        $cacheKey = $categoryName;
        if (isset($this->categoryCache[$cacheKey])) {
            return $this->categoryCache[$cacheKey];
        }

        // Try to find existing category
        $category = Category::where('name', $categoryName)
            ->where('type', 'product')
            ->first();

        if (!$category) {
            // Create new category (slug will be auto-generated by Category model)
            $category = Category::create([
                'name' => $categoryName,
                'type' => 'product',
                'is_active' => true,
                'meta_data' => $categoryCode ? ['logo_category_code' => $categoryCode] : null,
            ]);

            Log::info("Created product category from Logo: {$categoryName}");
        }

        $this->categoryCache[$cacheKey] = $category->id;
        return $category->id;
    }

    /**
     * Find or create a brand from Logo MARK table reference
     */
    protected function findOrCreateBrandFromLogoMark(int $markRef, int $firmNo): ?int
    {
        if ($markRef <= 0) {
            return null;
        }

        // Check cache first
        $cacheKey = "{$firmNo}_{$markRef}";
        if (isset($this->brandCache[$cacheKey])) {
            return $this->brandCache[$cacheKey];
        }

        try {
            // Get brand from Logo MARK table
            $markTable = sprintf('LG_%03d_MARK', $firmNo);

            $logoBrand = DB::connection($this->connection)
                ->table($markTable)
                ->select(['LOGICALREF', 'CODE', 'DESCR'])
                ->where('LOGICALREF', $markRef)
                ->first();

            if (!$logoBrand) {
                return null;
            }

            $brandCode = trim($logoBrand->CODE);
            $brandName = trim($logoBrand->DESCR) ?: $brandCode;

            if (empty($brandName)) {
                return null;
            }

            // Try to find existing brand by logo_id
            $brand = Brand::where('logo_id', $logoBrand->LOGICALREF)->first();

            if (!$brand) {
                // Try to find by name
                $brand = Brand::where('name', $brandName)->first();
            }

            if (!$brand) {
                // Create new brand
                $brand = Brand::create([
                    'name' => $brandName,
                    'logo_id' => $logoBrand->LOGICALREF,
                    'logo_code' => $brandCode,
                    'is_active' => true,
                    'logo_synced_at' => now(),
                ]);

                Log::info("Created brand from Logo: {$brandName} (Code: {$brandCode}, LOGICALREF: {$logoBrand->LOGICALREF})");
            } else {
                // Update existing brand with Logo reference if not set
                if (empty($brand->logo_id)) {
                    $brand->update([
                        'logo_id' => $logoBrand->LOGICALREF,
                        'logo_code' => $brandCode,
                        'logo_synced_at' => now(),
                    ]);
                    Log::info("Updated brand {$brandName} with Logo LOGICALREF: {$logoBrand->LOGICALREF}");
                }
            }

            $this->brandCache[$cacheKey] = $brand->id;
            return $brand->id;

        } catch (Exception $e) {
            Log::warning("Failed to get brand from Logo MARKREF {$markRef}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Find or create a category from Logo STGRPCODE (Stock Group)
     */
    protected function findOrCreateCategoryFromStgrpCode(string $stgrpCode): ?int
    {
        $stgrpCode = trim($stgrpCode);
        if (empty($stgrpCode)) {
            return null;
        }

        // Check cache first
        $cacheKey = "stgrp_{$stgrpCode}";
        if (isset($this->categoryCache[$cacheKey])) {
            return $this->categoryCache[$cacheKey];
        }

        // Try to find existing category by name (STGRPCODE as name)
        $category = Category::where('name', $stgrpCode)
            ->where('type', 'product')
            ->first();

        if (!$category) {
            // Create new category
            $category = Category::create([
                'name' => $stgrpCode,
                'type' => 'product',
                'is_active' => true,
                'meta_data' => ['logo_stgrp_code' => $stgrpCode],
            ]);

            Log::info("Created product category from Logo STGRPCODE: {$stgrpCode}");
        }

        $this->categoryCache[$cacheKey] = $category->id;
        return $category->id;
    }

    /**
     * Find or create a unit from Logo unit set reference
     */
    protected function findOrCreateUnitFromLogoUnitSet(int $unitSetRef, int $firmNo): ?int
    {
        // Check cache first
        $cacheKey = "{$firmNo}_{$unitSetRef}";
        if (isset($this->unitCache[$cacheKey])) {
            return $this->unitCache[$cacheKey];
        }

        try {
            // Get the main unit from Logo UNITSETL table
            $unitSetLineTable = sprintf('LG_%03d_UNITSETL', $firmNo);

            $logoUnit = DB::connection($this->connection)
                ->table($unitSetLineTable)
                ->select(['LOGICALREF', 'CODE', 'NAME'])
                ->where('UNITSETREF', $unitSetRef)
                ->where('MAINUNIT', 1) // Get main unit only
                ->first();

            if (!$logoUnit) {
                // Fallback: get first unit if no main unit found
                $logoUnit = DB::connection($this->connection)
                    ->table($unitSetLineTable)
                    ->select(['LOGICALREF', 'CODE', 'NAME'])
                    ->where('UNITSETREF', $unitSetRef)
                    ->orderBy('LINENR')
                    ->first();
            }

            if (!$logoUnit) {
                return null;
            }

            $unitCode = trim($logoUnit->CODE);
            $unitName = trim($logoUnit->NAME) ?: $unitCode;

            // Try to find existing unit by symbol/code
            $unit = Unit::where('symbol', $unitCode)->first();

            if (!$unit) {
                // Try to find by name
                $unit = Unit::where('name', $unitName)->first();
            }

            if (!$unit) {
                // Create new unit
                $unit = Unit::create([
                    'name' => $unitName,
                    'symbol' => $unitCode,
                    'type' => $this->determineUnitType($unitCode),
                    'conversion_factor' => 1,
                    'is_active' => true,
                    'logo_unit_ref' => $logoUnit->LOGICALREF,
                ]);

                Log::info("Created unit from Logo: {$unitName} ({$unitCode}) with LOGICALREF: {$logoUnit->LOGICALREF}");
            } else {
                // Update existing unit with Logo reference if not set
                if (empty($unit->logo_unit_ref)) {
                    $unit->update(['logo_unit_ref' => $logoUnit->LOGICALREF]);
                    Log::info("Updated unit {$unitName} with Logo LOGICALREF: {$logoUnit->LOGICALREF}");
                }
            }

            $this->unitCache[$cacheKey] = $unit->id;
            return $unit->id;

        } catch (Exception $e) {
            Log::warning("Failed to get unit from Logo UNITSETREF {$unitSetRef}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Determine unit type based on unit code
     */
    protected function determineUnitType(string $unitCode): string
    {
        $unitCode = strtoupper($unitCode);

        // Length units
        if (in_array($unitCode, ['M', 'MM', 'CM', 'KM', 'IN', 'FT', 'YD', 'MTR', 'MMT', 'CMT'])) {
            return 'length';
        }

        // Area units
        if (in_array($unitCode, ['M2', 'CM2', 'MM2', 'KM2', 'MTK', 'HA'])) {
            return 'area';
        }

        // Volume units
        if (in_array($unitCode, ['M3', 'CM3', 'L', 'LT', 'LTR', 'ML', 'GAL', 'MTQ'])) {
            return 'volume';
        }

        // Weight units
        if (in_array($unitCode, ['KG', 'G', 'MG', 'TON', 'LB', 'OZ', 'KGM', 'GRM', 'TNE'])) {
            return 'weight';
        }

        // Quantity/Count units
        if (in_array($unitCode, ['AD', 'ADET', 'PCS', 'EA', 'C62', 'NAR', 'PR', 'SET', 'PKT', 'BX', 'CT'])) {
            return 'quantity';
        }

        // Time units
        if (in_array($unitCode, ['H', 'MIN', 'SEC', 'DAY', 'HUR', 'MON'])) {
            return 'time';
        }

        // Default
        return 'other';
    }

    /**
     * Sync all product units (with conversions) from Logo UNITSETL
     */
    protected function syncProductUnitsFromLogo(Product $product, int $unitSetRef, int $firmNo): void
    {
        try {
            $unitSetLineTable = sprintf('LG_%03d_UNITSETL', $firmNo);

            // Get all units in the unit set
            $logoUnits = DB::connection($this->connection)
                ->table($unitSetLineTable)
                ->select(['LOGICALREF', 'CODE', 'NAME', 'MAINUNIT', 'CONVFACT1', 'CONVFACT2', 'LINENR'])
                ->where('UNITSETREF', $unitSetRef)
                ->orderBy('LINENR')
                ->get();

            if ($logoUnits->isEmpty()) {
                return;
            }

            $sortOrder = 0;
            foreach ($logoUnits as $logoUnit) {
                $unitCode = trim($logoUnit->CODE);
                $unitName = trim($logoUnit->NAME) ?: $unitCode;
                $isMainUnit = $logoUnit->MAINUNIT == 1;

                // Conversion factor: CONVFACT2 contains the multiplier (e.g., 6 for 1 PAKET = 6 ADET)
                // For main unit, conversion is 1
                $conversionFactor = $isMainUnit ? 1 : ($logoUnit->CONVFACT2 ?: 1);

                // Find or create the unit in units table (case-insensitive)
                $unit = Unit::whereRaw('LOWER(symbol) = ?', [strtolower($unitCode)])->first();
                if (!$unit) {
                    $unit = Unit::whereRaw('LOWER(name) = ?', [strtolower($unitName)])->first();
                }
                if (!$unit) {
                    // Try common mappings
                    $unitMappings = [
                        'ADET' => 'ad',
                        'AD' => 'ad',
                        'PCS' => 'ad',
                        'PAKET' => 'paket',
                        'PKT' => 'paket',
                        'KUTU' => 'kutu',
                        'KOLİ' => 'koli',
                        'KOLI' => 'koli',
                        'KG' => 'kg',
                        'GR' => 'g',
                        'LT' => 'L',
                        'MT' => 'm',
                    ];
                    $mappedSymbol = $unitMappings[strtoupper($unitCode)] ?? null;
                    if ($mappedSymbol) {
                        $unit = Unit::where('symbol', $mappedSymbol)->first();
                    }
                }

                if (!$unit) {
                    // Create new unit
                    $unit = Unit::create([
                        'name' => $unitName,
                        'symbol' => $unitCode,
                        'type' => $this->determineUnitType($unitCode),
                        'conversion_factor' => 1,
                        'is_active' => true,
                        'logo_unit_ref' => $logoUnit->LOGICALREF,
                    ]);
                } elseif (empty($unit->logo_unit_ref)) {
                    $unit->update(['logo_unit_ref' => $logoUnit->LOGICALREF]);
                }

                // Create or update ProductUnit record
                $productUnit = ProductUnit::where('product_id', $product->id)
                    ->where('unit_id', $unit->id)
                    ->first();

                if (!$productUnit) {
                    ProductUnit::create([
                        'product_id' => $product->id,
                        'unit_id' => $unit->id,
                        'unit_name' => $unitName,
                        'unit_code' => $unitCode,
                        'conversion_factor' => $conversionFactor,
                        'is_base_unit' => $isMainUnit,
                        'is_active' => true,
                        'sort_order' => $sortOrder,
                    ]);
                } else {
                    $productUnit->update([
                        'unit_name' => $unitName,
                        'unit_code' => $unitCode,
                        'conversion_factor' => $conversionFactor,
                        'is_base_unit' => $isMainUnit,
                        'sort_order' => $sortOrder,
                    ]);
                }

                $sortOrder++;
            }

        } catch (Exception $e) {
            Log::warning("Failed to sync product units for product {$product->id}: " . $e->getMessage());
        }
    }

    /**
     * Get last product sync session for incremental sync
     * Returns the maximum LAESSION value from previously synced products
     */
    protected function getLastProductSyncSession(int $firmNo): ?int
    {
        $lastSync = Product::where('logo_firm_no', $firmNo)
            ->whereNotNull('logo_synced_at')
            ->orderBy('logo_synced_at', 'desc')
            ->first();

        // TODO: Store actual Logo LAESSION in database for accurate incremental sync
        // For now, return null to do full sync until session tracking is implemented
        return null;
    }

    /**
     * Sync only NEW products from Logo that don't exist in local database.
     * Fetches the latest N products by LOGICALREF DESC and imports any missing ones.
     */
    public function syncNewProducts(?int $firmNo = null, int $checkCount = 50, ?string $tableName = null, ?callable $progressCallback = null): array
    {
        $firmNo = $firmNo ?? LogoService::getDefaultFirmNo();

        try {
            if (!$tableName) {
                $tableName = $this->findProductTable($firmNo);
                if (!$tableName) {
                    return ['success' => false, 'error' => "Product table not found for firm {$firmNo}"];
                }
            }

            // Fetch latest N products from Logo ordered by LOGICALREF DESC
            $recentLogoProducts = DB::connection($this->connection)
                ->table($tableName)
                ->select([
                    'LOGICALREF as logo_id',
                    'CODE as code',
                    'NAME as name',
                    'PRODUCERCODE as producer_code',
                    'SPECODE as specode',
                    'SPECODE2 as specode2',
                    'SPECODE3 as specode3',
                    'STGRPCODE as group_code',
                    'VAT as vat_rate',
                    'SELLVAT as sell_vat_rate',
                    'CARDTYPE as card_type',
                    'ACTIVE as is_active',
                    'UNITSETREF as unit_set_ref',
                    'PURCHBRWS as can_be_purchased',
                    'SALESBRWS as can_be_sold',
                    'TRACKTYPE as track_type',
                    'EANBARCODE as ean_barcode',
                    'GTIPCODE as gtip_code',
                    'PRODCOUNTRY as country_of_origin',
                    'CATEGORYNAME as category_name',
                    'CATEGORYID as category_code',
                    'MARKREF as brand_ref',
                ])
                ->where('CARDTYPE', '!=', 22)
                ->orderBy('LOGICALREF', 'desc')
                ->limit($checkCount)
                ->get();

            if ($recentLogoProducts->isEmpty()) {
                return ['success' => true, 'stats' => ['total' => 0, 'created' => 0, 'errors' => []]];
            }

            // Check which of these already exist locally (by logo_id or code)
            $logoIds = $recentLogoProducts->pluck('logo_id')->toArray();
            $codes = $recentLogoProducts->pluck('code')->filter()->toArray();

            $existingByLogoId = Product::whereIn('logo_id', $logoIds)->pluck('logo_id')->flip();
            $existingByCode = Product::whereIn('code', $codes)->get()->keyBy('code');

            // Filter to only truly new products
            $newProducts = $recentLogoProducts->filter(function ($p) use ($existingByLogoId, $existingByCode) {
                return !$existingByLogoId->has($p->logo_id) && !$existingByCode->has($p->code);
            });

            $stats = ['total' => $newProducts->count(), 'created' => 0, 'errors' => []];

            if ($newProducts->isEmpty()) {
                if ($progressCallback) {
                    $progressCallback(['type' => 'total', 'total' => 0]);
                }
                return ['success' => true, 'stats' => $stats];
            }

            if ($progressCallback) {
                $progressCallback(['type' => 'total', 'total' => $newProducts->count()]);
            }

            DB::beginTransaction();
            try {
                foreach ($newProducts as $logoProduct) {
                    try {
                        $productType = $this->determineProductType($logoProduct->card_type);
                        $productData = $this->mapLogoProductToLocal($logoProduct, $productType, $firmNo);
                        $newProduct = Product::create($productData);

                        if (!empty($logoProduct->unit_set_ref) && $logoProduct->unit_set_ref > 0) {
                            $this->syncProductUnitsFromLogo($newProduct, $logoProduct->unit_set_ref, $firmNo);
                        }

                        $stats['created']++;
                    } catch (Exception $e) {
                        $errorMsg = "Logo ID {$logoProduct->logo_id} ({$logoProduct->code}): {$e->getMessage()}";
                        $stats['errors'][] = $errorMsg;
                        Log::warning("New product sync error: {$errorMsg}");
                    }
                }

                DB::commit();

                if ($progressCallback) {
                    $progressCallback(['type' => 'done', 'created' => $stats['created'], 'errors' => count($stats['errors'])]);
                }
            } catch (Exception $e) {
                DB::rollBack();
                throw $e;
            }

            Log::info("New product sync: checked last {$checkCount}, found {$stats['total']} new, created {$stats['created']}");

            return ['success' => true, 'stats' => $stats];

        } catch (Exception $e) {
            Log::error('Logo new product sync error: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get sync statistics
     */
    public function getSyncStats(): array
    {
        try {
            $total = Product::whereNotNull('logo_id')->count();
            $active = Product::where('is_active', true)
                ->whereNotNull('logo_id')
                ->count();
            $inactive = Product::where('is_active', false)
                ->whereNotNull('logo_id')
                ->count();
            $purchasable = Product::where('can_be_purchased', true)
                ->whereNotNull('logo_id')
                ->count();
            $sellable = Product::where('can_be_sold', true)
                ->whereNotNull('logo_id')
                ->count();

            // Category, unit, and brand stats
            $withCategory = Product::whereNotNull('logo_id')
                ->whereNotNull('category_id')
                ->count();
            $withUnit = Product::whereNotNull('logo_id')
                ->whereNotNull('unit_id')
                ->count();
            $withBrand = Product::whereNotNull('logo_id')
                ->whereNotNull('brand_id')
                ->count();

            $lastSync = Product::whereNotNull('logo_synced_at')
                ->orderBy('logo_synced_at', 'desc')
                ->first();

            return [
                'success' => true,
                'total_synced' => $total,
                'active' => $active,
                'inactive' => $inactive,
                'can_be_purchased' => $purchasable,
                'can_be_sold' => $sellable,
                'with_category' => $withCategory,
                'with_unit' => $withUnit,
                'with_brand' => $withBrand,
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
