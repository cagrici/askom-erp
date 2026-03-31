<?php

namespace App\Services;

use App\Models\ExchangeRate;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductPriceList;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class LogoPriceSyncService
{
    protected LogoService $logoService;
    protected string $connection = 'logo';

    // Logo para birimi kodları (Logo Tiger standart CURRENCY field)
    protected array $currencyMap = [
        0 => 'TRY',    // Turk Lirasi (Yerel Para Birimi - eski)
        1 => 'USD',    // Amerikan Dolari
        2 => 'EUR',    // Euro
        3 => 'GBP',    // Ingiliz Sterlini
        4 => 'CHF',    // Isvicre Frangi
        5 => 'JPY',    // Japon Yeni
        6 => 'CAD',    // Kanada Dolari
        7 => 'AUD',    // Avustralya Dolari
        8 => 'DKK',    // Danimarka Kronu
        9 => 'SEK',    // Isvec Kronu
        10 => 'NOK',   // Norvec Kronu
        11 => 'SAR',   // Suudi Arabistan Riyali
        12 => 'KWD',   // Kuveyt Dinari
        13 => 'RUB',   // Rus Rublesi
        14 => 'CNY',   // Cin Yuani
        15 => 'BGN',   // Bulgar Levasi
        16 => 'RON',   // Romanya Leyi
        20 => 'EUR',   // Bazi Logo versiyonlari EUR icin 20 kullanir
        160 => 'TRY',  // Turk Lirasi (Logo Tiger PRCLIST)
    ];

    public function __construct(LogoService $logoService)
    {
        $this->logoService = $logoService;
    }

    /**
     * Logo'dan ürün fiyatlarını senkronize et
     * PRCLIST tablosundan fiyatları çeker ve Product tablosuna yazar
     */
    public function syncProductPrices(?int $firmNo = null, ?int $limit = null, bool $continueOnError = true): array
    {
        $firmNo = $firmNo ?? LogoService::getDefaultFirmNo();

        try {
            Log::info("Starting Logo price sync for firm {$firmNo}");

            $stats = [
                'total' => 0,
                'updated' => 0,
                'skipped' => 0,
                'errors' => [],
            ];

            // PRCLIST tablosu - fiyat kayıtları
            $tableName = sprintf('LG_%03d_PRCLIST', $firmNo);

            if (!$this->tableExists($tableName)) {
                $tableName = sprintf('LG_%03d_01_PRCLIST', $firmNo);
                if (!$this->tableExists($tableName)) {
                    return [
                        'success' => false,
                        'error' => "Price table (PRCLIST) not found for firm {$firmNo}",
                    ];
                }
            }

            Log::info("Using price table: {$tableName}");

            // Pagination
            $pageSize = 500;
            $offset = 0;
            $totalRecords = $this->getPrclistRecordCount($tableName, $limit);

            Log::info("Total price records to sync: {$totalRecords}");

            while ($offset < $totalRecords) {
                $currentPageSize = min($pageSize, $totalRecords - $offset);

                $prices = $this->getLogoPricesFromPrclist($tableName, $offset, $currentPageSize);

                if (!$prices['success']) {
                    Log::error("Failed to fetch prices at offset {$offset}: {$prices['error']}");
                    if (!$continueOnError) {
                        return [
                            'success' => false,
                            'error' => $prices['error'],
                        ];
                    }
                    break;
                }

                $stats['total'] += count($prices['data']);

                DB::beginTransaction();

                try {
                    foreach ($prices['data'] as $logoPrice) {
                        $result = $this->syncSinglePriceFromPrclist($logoPrice, $firmNo);

                        if ($result['action'] === 'updated') {
                            $stats['updated']++;
                        } elseif ($result['action'] === 'error') {
                            $stats['skipped']++;
                            if (isset($result['error'])) {
                                $stats['errors'][] = $result['error'];
                            }
                        } else {
                            $stats['skipped']++;
                        }
                    }

                    DB::commit();

                    $progress = round(($offset + $currentPageSize) / $totalRecords * 100, 1);
                    Log::info("Price sync progress: {$progress}% - Updated={$stats['updated']}, Skipped={$stats['skipped']}");

                } catch (Exception $e) {
                    DB::rollBack();

                    if (!$continueOnError) {
                        throw $e;
                    }

                    Log::error("Page processing error at offset {$offset}: " . $e->getMessage());
                }

                $offset += $pageSize;
                unset($prices);
            }

            Log::info('Logo price sync completed', $stats);

            return [
                'success' => true,
                'stats' => $stats,
            ];

        } catch (Exception $e) {
            Log::error('Logo price sync error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * PRCLIST tablosundan fiyatları al
     * Her ürün için en yüksek satış fiyatını (T.Satış Fiyatı) alır
     * ROW_NUMBER() window function ile her CARDREF+PTYPE için tek kayıt seçilir
     */
    protected function getLogoPricesFromPrclist(string $tableName, int $offset, int $limit): array
    {
        try {
            // ROW_NUMBER() ile her ürün (CARDREF) ve fiyat tipi (PTYPE) için
            // en yüksek fiyatlı kaydı seç. Bu yaklaşım:
            // 1. Duplicate kayıtları önler (aynı MAX fiyata sahip birden fazla kayıt varsa)
            // 2. Tutarlı pagination sağlar (ORDER BY ile deterministic sıralama)
            // 3. SQL Server'da OFFSET/FETCH ile sorunsuz çalışır
            $sql = "
                WITH RankedPrices AS (
                    SELECT
                        LOGICALREF as logo_id,
                        CARDREF as item_ref,
                        PRICE as price,
                        CURRENCY as currency,
                        PTYPE as price_type,
                        ROW_NUMBER() OVER (
                            PARTITION BY CARDREF, PTYPE
                            ORDER BY LOGICALREF DESC
                        ) as rn
                    FROM {$tableName}
                    WHERE ACTIVE = 0 AND PRICE > 0
                )
                SELECT logo_id, item_ref, price, currency, price_type
                FROM RankedPrices
                WHERE rn = 1
                ORDER BY item_ref, price_type
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            ";

            $prices = DB::connection($this->connection)
                ->select($sql, [$offset, $limit]);

            return [
                'success' => true,
                'data' => collect($prices),
                'count' => count($prices),
            ];

        } catch (Exception $e) {
            Log::error('Get Logo prices from PRCLIST error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
            ];
        }
    }

    /**
     * PRCLIST kaydından tek bir ürünün fiyatını senkronize et
     *
     * Fiyatlar orijinal para biriminde saklanır, TL karşılığı ayrı hesaplanır.
     */
    protected function syncSinglePriceFromPrclist(object $logoPrice, int $firmNo): array
    {
        try {
            // Logo item ref ile yerel ürünü bul (firma kontrolü kaldırıldı - ürünler farklı firma ile kayıtlı olabilir)
            $product = Product::where('logo_id', $logoPrice->item_ref)->first();

            if (!$product) {
                return [
                    'action' => 'skipped',
                    'reason' => 'Product not found',
                ];
            }

            $price = $logoPrice->price ?? 0;
            $currency = $this->currencyMap[$logoPrice->currency ?? 0] ?? 'TRY';
            $priceType = $logoPrice->price_type ?? 2; // Default to sales price

            $updateData = [
                'logo_price_synced_at' => now(),
                'logo_currency' => $currency,
                'currency' => $currency,
            ];

            // TL dönüşümü için kur bilgisi al
            $tryPrice = $this->convertToTry($price, $currency);
            $today = now()->format('Y-m-d');

            if ($priceType == 1) {
                // Alış fiyatı - orijinal değer saklanır
                $updateData['logo_purchase_price'] = $price;
                $updateData['cost_price'] = $price;

                // TL karşılığı
                if ($tryPrice !== null) {
                    $updateData['cost_price_try'] = $tryPrice;
                }
            } else {
                // Satış fiyatı - orijinal değer saklanır
                $updateData['logo_sale_price'] = $price;
                $updateData['sale_price'] = $price;

                // TL karşılığı
                if ($tryPrice !== null) {
                    $updateData['sale_price_try'] = $tryPrice;
                    $updateData['price_converted_at'] = $today;
                }
            }

            $product->update($updateData);

            return [
                'action' => 'updated',
                'product' => $product,
            ];

        } catch (Exception $e) {
            Log::error("Sync price error for Logo item ref {$logoPrice->item_ref}: " . $e->getMessage());

            return [
                'action' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Fiyatı TL'ye dönüştür
     */
    protected function convertToTry(float $amount, string $currency): ?float
    {
        if ($currency === 'TRY') {
            return $amount;
        }

        $tryAmount = ExchangeRate::convert($amount, $currency, 'TRY');

        return $tryAmount !== null ? round($tryAmount, 4) : null;
    }

    /**
     * PRCLIST kayıt sayısını al
     * Benzersiz ürün-fiyat tipi kombinasyonlarını sayar (her ürün için tek fiyat)
     */
    protected function getPrclistRecordCount(string $tableName, ?int $limit = null): int
    {
        try {
            // Benzersiz CARDREF + PTYPE kombinasyonlarını say
            $count = DB::connection($this->connection)
                ->table($tableName)
                ->select(DB::raw('COUNT(DISTINCT CONCAT(CARDREF, \'-\', PTYPE)) as cnt'))
                ->where('ACTIVE', 0)
                ->where('PRICE', '>', 0)
                ->value('cnt');

            return $limit ? min($count, $limit) : $count;
        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * Logo'dan fiyat listelerini senkronize et
     * PRCLIST tablosundan fiyat listelerini çeker
     */
    public function syncPriceLists(?int $firmNo = null): array
    {
        $firmNo = $firmNo ?? LogoService::getDefaultFirmNo();

        try {
            Log::info("Starting Logo price list sync for firm {$firmNo}");

            $stats = [
                'total' => 0,
                'created' => 0,
                'updated' => 0,
                'skipped' => 0,
                'errors' => [],
            ];

            // PRCLIST tablosu - fiyat listeleri
            $tableName = sprintf('LG_%03d_PRCLIST', $firmNo);

            if (!$this->tableExists($tableName)) {
                $tableName = sprintf('LG_%03d_01_PRCLIST', $firmNo);
                if (!$this->tableExists($tableName)) {
                    Log::warning("Price list table not found, skipping price list sync");
                    return [
                        'success' => true,
                        'stats' => $stats,
                        'message' => 'Price list table not found',
                    ];
                }
            }

            $priceLists = DB::connection($this->connection)
                ->table($tableName)
                ->select([
                    'LOGICALREF as logo_id',
                    'CODE as code',
                    'DEFINITION_ as name',
                    'CURRENCY as currency_type',
                    'BEGDATE as valid_from',
                    'ENDDATE as valid_until',
                    'ACTIVE as is_active',
                ])
                ->where('ACTIVE', 0) // 0 = Active in Logo
                ->get();

            $stats['total'] = $priceLists->count();

            DB::beginTransaction();

            try {
                foreach ($priceLists as $logoPriceList) {
                    $existing = ProductPriceList::where('logo_id', $logoPriceList->logo_id)
                        ->where('logo_firm_no', $firmNo)
                        ->first();

                    $data = [
                        'logo_id' => $logoPriceList->logo_id,
                        'logo_firm_no' => $firmNo,
                        'code' => $logoPriceList->code,
                        'name' => $logoPriceList->name ?: $logoPriceList->code,
                        'currency' => $this->currencyMap[$logoPriceList->currency_type] ?? 'TRY',
                        'valid_from' => $logoPriceList->valid_from ? date('Y-m-d', strtotime($logoPriceList->valid_from)) : null,
                        'valid_until' => $logoPriceList->valid_until ? date('Y-m-d', strtotime($logoPriceList->valid_until)) : null,
                        'is_active' => $logoPriceList->is_active == 0,
                        'type' => 'logo',
                        'logo_synced_at' => now(),
                    ];

                    if ($existing) {
                        $existing->update($data);
                        $stats['updated']++;
                    } else {
                        ProductPriceList::create($data);
                        $stats['created']++;
                    }
                }

                DB::commit();

            } catch (Exception $e) {
                DB::rollBack();
                throw $e;
            }

            Log::info('Logo price list sync completed', $stats);

            return [
                'success' => true,
                'stats' => $stats,
            ];

        } catch (Exception $e) {
            Log::error('Logo price list sync error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Logo'dan fiyat listesi detaylarını (ürün fiyatları) senkronize et
     * PRCCARD tablosundan fiyat listesi detaylarını çeker
     */
    public function syncPriceListDetails(?int $firmNo = null, ?int $priceListId = null): array
    {
        $firmNo = $firmNo ?? LogoService::getDefaultFirmNo();

        try {
            Log::info("Starting Logo price list details sync for firm {$firmNo}");

            $stats = [
                'total' => 0,
                'created' => 0,
                'updated' => 0,
                'skipped' => 0,
                'errors' => [],
            ];

            // PRCCARD tablosu - fiyat kartları
            $tableName = sprintf('LG_%03d_PRCCARD', $firmNo);

            if (!$this->tableExists($tableName)) {
                $tableName = sprintf('LG_%03d_01_PRCCARD', $firmNo);
                if (!$this->tableExists($tableName)) {
                    Log::warning("Price card table not found, skipping price card sync");
                    return [
                        'success' => true,
                        'stats' => $stats,
                        'message' => 'Price card table not found',
                    ];
                }
            }

            $query = DB::connection($this->connection)
                ->table($tableName)
                ->select([
                    'LOGICALREF as logo_id',
                    'CARDREF as item_ref',       // ITEMS tablosundaki LOGICALREF
                    'PRCLISTREF as pricelist_ref', // PRCLIST tablosundaki LOGICALREF
                    'PRICE as price',
                    'UOMREF as unit_ref',
                    'CURRENCY as currency',
                    'MTRLCOST as material_cost',
                ])
                ->where('ACTIVE', 0); // 0 = Active

            if ($priceListId) {
                $query->where('PRCLISTREF', $priceListId);
            }

            $priceCards = $query->get();

            $stats['total'] = $priceCards->count();

            DB::beginTransaction();

            try {
                foreach ($priceCards as $priceCard) {
                    // Yerel ürünü bul
                    $product = Product::where('logo_id', $priceCard->item_ref)
                        ->where('logo_firm_no', $firmNo)
                        ->first();

                    if (!$product) {
                        $stats['skipped']++;
                        continue;
                    }

                    // Yerel fiyat listesini bul
                    $priceList = ProductPriceList::where('logo_id', $priceCard->pricelist_ref)
                        ->where('logo_firm_no', $firmNo)
                        ->first();

                    if (!$priceList) {
                        $stats['skipped']++;
                        continue;
                    }

                    $existing = ProductPrice::where('logo_id', $priceCard->logo_id)
                        ->first();

                    $data = [
                        'logo_id' => $priceCard->logo_id,
                        'logo_firm_no' => $firmNo,
                        'product_id' => $product->id,
                        'price_list_id' => $priceList->id,
                        'price' => $priceCard->price ?? 0,
                        'min_quantity' => 1,
                        'logo_synced_at' => now(),
                    ];

                    if ($existing) {
                        $existing->update($data);
                        $stats['updated']++;
                    } else {
                        ProductPrice::create($data);
                        $stats['created']++;
                    }
                }

                DB::commit();

            } catch (Exception $e) {
                DB::rollBack();
                throw $e;
            }

            Log::info('Logo price list details sync completed', $stats);

            return [
                'success' => true,
                'stats' => $stats,
            ];

        } catch (Exception $e) {
            Log::error('Logo price list details sync error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Tek bir ürünün fiyatını senkronize et (ITMUNITA tablosundan)
     *
     * Fiyatlar orijinal para biriminde saklanır, TL karşılığı ayrı hesaplanır.
     */
    protected function syncSinglePrice(object $logoPrice, int $firmNo): array
    {
        try {
            // Logo item ref ile yerel ürünü bul (firma kontrolü kaldırıldı)
            $product = Product::where('logo_id', $logoPrice->item_ref)->first();

            if (!$product) {
                return [
                    'action' => 'skipped',
                    'reason' => 'Product not found',
                ];
            }

            // Fiyat tipi kontrolü (1 = Alış, 2 = Satış)
            $priceType = $logoPrice->ptype ?? 2;
            $price = $logoPrice->price ?? 0;
            $currency = $this->currencyMap[$logoPrice->currency ?? 0] ?? 'TRY';

            $updateData = [
                'logo_price_synced_at' => now(),
                'logo_currency' => $currency,
                'currency' => $currency,
            ];

            // TL dönüşümü için kur bilgisi al
            $tryPrice = $this->convertToTry($price, $currency);
            $today = now()->format('Y-m-d');

            if ($priceType == 1) {
                // Alış fiyatı - orijinal değer saklanır
                $updateData['logo_purchase_price'] = $price;
                $updateData['cost_price'] = $price;

                // TL karşılığı
                if ($tryPrice !== null) {
                    $updateData['cost_price_try'] = $tryPrice;
                }
            } else {
                // Satış fiyatı - orijinal değer saklanır
                $updateData['logo_sale_price'] = $price;
                $updateData['sale_price'] = $price;

                // TL karşılığı
                if ($tryPrice !== null) {
                    $updateData['sale_price_try'] = $tryPrice;
                    $updateData['price_converted_at'] = $today;
                }
            }

            $product->update($updateData);

            return [
                'action' => 'updated',
                'product' => $product,
            ];

        } catch (Exception $e) {
            Log::error("Sync price error for Logo item ref {$logoPrice->item_ref}: " . $e->getMessage());

            return [
                'action' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Logo'dan fiyatları al (ITMUNITA tablosundan)
     */
    protected function getLogoPrices(string $tableName, int $offset, int $limit): array
    {
        try {
            $prices = DB::connection($this->connection)
                ->table($tableName)
                ->select([
                    'LOGICALREF as logo_id',
                    'ITEMREF as item_ref',      // ITEMS tablosundaki LOGICALREF
                    'UNITLINEREF as unit_ref',
                    'LIESSION as ptype',        // Fiyat tipi: 1=Alış, 2=Satış
                    'PRICE as price',
                    'CURRENCY as currency',
                ])
                ->where('PRICE', '>', 0)
                ->offset($offset)
                ->limit($limit)
                ->get();

            return [
                'success' => true,
                'data' => $prices,
                'count' => $prices->count(),
            ];

        } catch (Exception $e) {
            Log::error('Get Logo prices error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
            ];
        }
    }

    /**
     * Belirli bir ürünün Logo fiyatını getir
     */
    public function getProductLogoPrice(int $productId, ?int $firmNo = null): ?array
    {
        $firmNo = $firmNo ?? LogoService::getDefaultFirmNo();

        try {
            $product = Product::find($productId);

            if (!$product || !$product->logo_id) {
                return null;
            }

            $tableName = sprintf('LG_%03d_ITMUNITA', $firmNo);

            if (!$this->tableExists($tableName)) {
                $tableName = sprintf('LG_%03d_01_ITMUNITA', $firmNo);
                if (!$this->tableExists($tableName)) {
                    return null;
                }
            }

            $prices = DB::connection($this->connection)
                ->table($tableName)
                ->select([
                    'LIESSION as ptype',
                    'PRICE as price',
                    'CURRENCY as currency',
                ])
                ->where('ITEMREF', $product->logo_id)
                ->where('PRICE', '>', 0)
                ->get();

            $result = [
                'purchase_price' => null,
                'sale_price' => null,
                'currency' => 'TRY',
            ];

            foreach ($prices as $price) {
                $currency = $this->currencyMap[$price->currency ?? 0] ?? 'TRY';
                $result['currency'] = $currency;

                if ($price->ptype == 1) {
                    $result['purchase_price'] = $price->price;
                } else {
                    $result['sale_price'] = $price->price;
                }
            }

            return $result;

        } catch (Exception $e) {
            Log::error('Get product Logo price error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Tablo var mı kontrol et
     */
    protected function tableExists(string $tableName): bool
    {
        try {
            $exists = DB::connection($this->connection)
                ->selectOne("
                    SELECT COUNT(*) as count
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME = ?
                ", [$tableName]);

            return $exists && $exists->count > 0;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Kayıt sayısını al
     */
    protected function getRecordCount(string $tableName, ?int $limit = null): int
    {
        try {
            $count = DB::connection($this->connection)
                ->table($tableName)
                ->where('PRICE', '>', 0)
                ->count();

            return $limit ? min($count, $limit) : $count;
        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * Senkronizasyon istatistiklerini al
     */
    public function getSyncStats(): array
    {
        try {
            $totalProducts = Product::whereNotNull('logo_id')->count();
            $productsWithPrice = Product::whereNotNull('logo_sale_price')
                ->whereNotNull('logo_id')
                ->count();
            $lastPriceSync = Product::whereNotNull('logo_price_synced_at')
                ->orderBy('logo_price_synced_at', 'desc')
                ->first();

            $totalPriceLists = ProductPriceList::whereNotNull('logo_id')->count();
            $totalPriceCards = ProductPrice::whereNotNull('logo_id')->count();

            return [
                'success' => true,
                'total_synced_products' => $totalProducts,
                'products_with_logo_price' => $productsWithPrice,
                'total_price_lists' => $totalPriceLists,
                'total_price_cards' => $totalPriceCards,
                'last_price_sync' => $lastPriceSync?->logo_price_synced_at?->format('Y-m-d H:i:s'),
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
