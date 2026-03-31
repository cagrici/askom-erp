<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Exception;

class LogoProductImageSyncService
{
    protected LogoService $logoService;
    protected string $connection = 'logo';

    // Possible table name patterns for product images
    protected array $possibleImageTablePatterns = [
        'LG_%03d_FIRMDOC',      // Document attachments
        'LG_%03d_01_FIRMDOC',   // Alternative format
        'LG_%s_FIRMDOC',        // Without leading zeros
    ];

    public function __construct(LogoService $logoService)
    {
        $this->logoService = $logoService;
    }

    /**
     * Sync product images in batches with progress callback
     */
    public function syncProductImagesInBatches(
        ?int $firmNo = null,
        int $batchSize = 100,
        ?string $tableName = null,
        ?callable $progressCallback = null,
        int $startOffset = 0
    ): array {
        $firmNo = $firmNo ?? LogoService::getDefaultFirmNo();

        try {
            // Find image table if not provided
            if (!$tableName) {
                $tableName = $this->findImageTable($firmNo);
                if (!$tableName) {
                    return [
                        'success' => false,
                        'error' => "Product image table not found for firm {$firmNo}",
                    ];
                }
            }

            // Get total count
            $countResult = $this->getLogoImageCount($firmNo, $tableName);
            if (!$countResult['success']) {
                return ['success' => false, 'error' => $countResult['error']];
            }

            $totalImages = $countResult['count'];
            Log::info("Starting batch sync: {$totalImages} total images, batch size: {$batchSize}");

            $stats = [
                'total' => 0,
                'synced' => 0,
                'skipped' => 0,
                'errors' => [],
                'batches_processed' => 0,
            ];

            $offset = $startOffset;
            $batchNumber = 0;

            while (true) {
                $batchNumber++;
                $logoImages = $this->getLogoProductImages($firmNo, $tableName, $batchSize, false, $offset);

                if (!$logoImages['success']) {
                    Log::error("Batch {$batchNumber} failed: " . $logoImages['error']);
                    break;
                }

                $images = $logoImages['data'];

                if ($images->isEmpty()) {
                    break; // No more images
                }

                // Process batch
                foreach ($images as $logoImage) {
                    $stats['total']++;

                    $result = $this->syncSingleProductImage($logoImage, $firmNo);

                    if ($result['action'] === 'synced') {
                        $stats['synced']++;
                    } elseif ($result['action'] === 'skipped') {
                        $stats['skipped']++;
                    } elseif ($result['action'] === 'error') {
                        $stats['skipped']++;
                        if (isset($result['error']) && count($stats['errors']) < 50) {
                            $stats['errors'][] = "Logo ID {$logoImage->logo_id}: {$result['error']}";
                        }
                    }
                }

                $stats['batches_processed'] = $batchNumber;
                $offset += $batchSize;

                // Call progress callback
                if ($progressCallback) {
                    $progressCallback([
                        'batch' => $batchNumber,
                        'processed' => $stats['total'],
                        'total' => $totalImages,
                        'synced' => $stats['synced'],
                        'skipped' => $stats['skipped'],
                        'offset' => $offset,
                    ]);
                }

                // Small delay to prevent overwhelming the database
                usleep(50000); // 50ms
            }

            Log::info('Batch sync completed', $stats);

            return [
                'success' => true,
                'stats' => $stats,
                'total_in_logo' => $totalImages,
            ];

        } catch (Exception $e) {
            Log::error('Batch sync error: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Sync product images from Logo database
     */
    public function syncProductImages(?int $firmNo = null, ?int $limit = null, ?string $tableName = null, bool $incrementalSync = false): array
    {
        $firmNo = $firmNo ?? LogoService::getDefaultFirmNo();

        try {
            Log::info("Starting Logo product image sync for firm {$firmNo}");

            // Find image table if not provided
            if (!$tableName) {
                $tableName = $this->findImageTable($firmNo);
                if (!$tableName) {
                    return [
                        'success' => false,
                        'error' => "Product image table not found for firm {$firmNo}",
                    ];
                }
            }

            Log::info("Using image table: {$tableName}");

            $stats = [
                'total' => 0,
                'synced' => 0,
                'skipped' => 0,
                'errors' => [],
            ];

            // Get images from Logo
            $logoImages = $this->getLogoProductImages($firmNo, $tableName, $limit, $incrementalSync);

            if (!$logoImages['success']) {
                return [
                    'success' => false,
                    'error' => $logoImages['error'],
                ];
            }

            $images = $logoImages['data'];
            $stats['total'] = count($images);

            Log::info("Found {$stats['total']} product images to sync");

            // Process each image
            DB::beginTransaction();

            try {
                foreach ($images as $logoImage) {
                    $result = $this->syncSingleProductImage($logoImage, $firmNo);

                    if ($result['action'] === 'synced') {
                        $stats['synced']++;
                    } elseif ($result['action'] === 'skipped') {
                        $stats['skipped']++;
                    } elseif ($result['action'] === 'error') {
                        $stats['skipped']++;
                        if (isset($result['error'])) {
                            $errorMsg = "Logo Image ID {$logoImage->logo_id}: {$result['error']}";
                            $stats['errors'][] = $errorMsg;
                            if (count($stats['errors']) <= 10) {
                                Log::warning($errorMsg);
                            }
                        }
                    }
                }

                DB::commit();

                Log::info('Logo product image sync completed', $stats);

                return [
                    'success' => true,
                    'stats' => $stats,
                ];

            } catch (Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (Exception $e) {
            Log::error('Logo product image sync error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Find the correct image table name
     */
    protected function findImageTable(int $firmNo): ?string
    {
        try {
            foreach ($this->possibleImageTablePatterns as $pattern) {
                $tableName = sprintf($pattern, $firmNo);

                $exists = DB::connection($this->connection)
                    ->selectOne("
                        SELECT COUNT(*) as count
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_NAME = ?
                    ", [$tableName]);

                if ($exists && $exists->count > 0) {
                    Log::info("Found image table: {$tableName}");
                    return $tableName;
                }
            }

            // Search for FIRMDOC table
            $tables = DB::connection($this->connection)
                ->select("
                    SELECT TABLE_NAME
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME LIKE ?
                ", ["LG_{$firmNo}%FIRMDOC%"]);

            if (!empty($tables)) {
                $tableName = $tables[0]->TABLE_NAME;
                Log::info("Found image table by search: {$tableName}");
                return $tableName;
            }

            return null;
        } catch (Exception $e) {
            Log::error("Error finding image table: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get total count of images in Logo database
     */
    public function getLogoImageCount(int $firmNo, ?string $tableName = null): array
    {
        try {
            if (!$tableName) {
                $tableName = $this->findImageTable($firmNo);
                if (!$tableName) {
                    return ['success' => false, 'error' => "Table not found for firm {$firmNo}", 'count' => 0];
                }
            }

            $count = DB::connection($this->connection)
                ->table($tableName)
                ->where('INFOTYP', 20)
                ->whereNotNull('INFOREF')
                ->whereNotNull('LDATA')
                ->count();

            return ['success' => true, 'count' => $count, 'table' => $tableName];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage(), 'count' => 0];
        }
    }

    /**
     * Get product images from Logo database
     *
     * Logo FIRMDOC table actual structure (LG_012_FIRMDOC):
     * - LREF: Primary key (logical reference)
     * - INFOTYP: Info type (20 = Items/Products document attachments)
     * - INFOREF: Reference to product (ITEMS.LOGICALREF)
     * - DOCTYP: Document type
     * - DOCNR: Document number/filename
     * - LDATA: Binary image data (VARBINARY)
     */
    protected function getLogoProductImages(int $firmNo, string $tableName, ?int $limit, bool $incrementalSync = false, int $offset = 0): array
    {
        try {
            $query = DB::connection($this->connection)
                ->table($tableName)
                ->select([
                    'LREF as logo_id',
                    'INFOREF as product_logo_id',
                    'DOCNR as filename',
                    'LDATA as image_data',
                ])
                ->where('INFOTYP', 20) // 20 = Items/Products document attachments
                ->whereNotNull('INFOREF') // Must have product reference
                ->whereNotNull('LDATA') // Must have binary image data
                ->orderBy('LREF'); // Consistent ordering for pagination

            if ($offset > 0) {
                $query->offset($offset);
            }

            if ($limit) {
                $query->limit($limit);
            }

            $images = $query->get();

            return [
                'success' => true,
                'data' => $images,
                'count' => $images->count(),
            ];

        } catch (Exception $e) {
            Log::error('Get Logo product images error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
            ];
        }
    }

    /**
     * Sync single product image
     */
    protected function syncSingleProductImage(object $logoImage, int $firmNo): array
    {
        try {
            // Find the product by Logo ID (don't filter by firm_no since table name already identifies the firm)
            $product = Product::where('logo_id', $logoImage->product_logo_id)->first();

            if (!$product) {
                return [
                    'action' => 'skipped',
                    'error' => "Product not found for Logo ID: {$logoImage->product_logo_id}",
                ];
            }

            // Process image data
            $imageData = $logoImage->image_data;
            $filename = $logoImage->filename;

            if (!$imageData) {
                return [
                    'action' => 'skipped',
                    'error' => 'No image data available',
                ];
            }

            // Determine file extension from filename or data
            $extension = pathinfo($filename, PATHINFO_EXTENSION) ?: 'jpg';
            $storagePath = "products/{$product->id}";
            $storageFilename = 'logo-' . $logoImage->logo_id . '.' . $extension;
            $fullPath = "{$storagePath}/{$storageFilename}";

            // Check if this image already exists (by logo_id in filename)
            $existingImage = ProductImage::where('product_id', $product->id)
                ->where('image_path', $fullPath)
                ->first();

            if ($existingImage) {
                return [
                    'action' => 'skipped',
                    'error' => 'Image already synced',
                ];
            }

            // Save image to storage
            Storage::disk('public')->put($fullPath, $imageData);

            // Check if product has any primary image
            $hasPrimary = ProductImage::where('product_id', $product->id)
                ->where('is_primary', true)
                ->exists();

            // Create ProductImage record
            ProductImage::create([
                'product_id' => $product->id,
                'image_path' => $fullPath,
                'alt_text' => $product->name,
                'is_primary' => !$hasPrimary, // Make primary if no other primary exists
                'sort_order' => ProductImage::where('product_id', $product->id)->count(),
            ]);

            // Update product sync timestamp
            $product->update(['logo_image_synced_at' => now()]);

            Log::info("Synced image for product {$product->id} (Logo ID: {$logoImage->product_logo_id})");

            return [
                'action' => 'synced',
                'product' => $product,
            ];

        } catch (Exception $e) {
            Log::error("Sync product image error for Logo Image ID {$logoImage->logo_id}: " . $e->getMessage());

            return [
                'action' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get last image sync session for incremental sync
     */
    protected function getLastImageSyncSession(int $firmNo): ?int
    {
        $lastSync = Product::where('logo_firm_no', $firmNo)
            ->whereNotNull('logo_image_synced_at')
            ->orderBy('logo_image_synced_at', 'desc')
            ->first();

        // Return a conservative estimate based on timestamp
        // Logo sessions are typically sequential integers
        return $lastSync ? 0 : null; // TODO: Map timestamp to Logo session if possible
    }

    /**
     * Get sync statistics
     */
    public function getSyncStats(): array
    {
        try {
            $totalWithImages = ProductImage::distinct('product_id')->count('product_id');
            $logoSyncedImages = ProductImage::where('image_path', 'like', '%logo-%')->count();
            $lastSync = Product::whereNotNull('logo_image_synced_at')
                ->orderBy('logo_image_synced_at', 'desc')
                ->first();

            return [
                'success' => true,
                'total_products_with_images' => $totalWithImages,
                'logo_synced_images' => $logoSyncedImages,
                'last_sync' => $lastSync?->logo_image_synced_at?->format('Y-m-d H:i:s'),
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
