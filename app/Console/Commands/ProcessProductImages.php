<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Intervention\Image\Laravel\Facades\Image;

class ProcessProductImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'products:process-images {--limit= : Number of images to process (all if not specified)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process product images from urunler_resimler table and save them to storage';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $limit = $this->option('limit');
        
        if ($limit) {
            $this->info("Processing {$limit} product image(s)...");
            $images = DB::table('urunler_resimler')
                ->whereNull('ok')
                ->limit($limit)
                ->get();
        } else {
            $this->info("Processing all unprocessed product images...");
            $images = DB::table('urunler_resimler')
                ->whereNull('ok')
                ->get();
        }
            
        if ($images->isEmpty()) {
            $this->info('No images to process.');
            return;
        }
        
        $processed = 0;
        $failed = 0;
        
        foreach ($images as $imageRecord) {
            try {
                $this->processImage($imageRecord);
                $processed++;
                $this->line("Processed image ID: {$imageRecord->idd}");
                
                // Short delay to prevent overwhelming the server
               // sleep(1);
                
            } catch (\Exception $e) {
                $failed++;
                $this->error("Failed to process image ID: {$imageRecord->idd} - {$e->getMessage()}");
                
                // Mark as failed
                DB::table('urunler_resimler')
                    ->where('idd', $imageRecord->idd)
                    ->update(['ok' => 2]);
            }
        }
        
        $this->info("Processing complete. Processed: {$processed}, Failed: {$failed}");
    }
    
    private function processImage($imageRecord)
    {
        // Find the corresponding product
        $product = DB::table('products')
            ->where('special_int_1', $imageRecord->idd)
            ->first();
            
        if (!$product) {
            throw new \Exception("Product not found for image ID: {$imageRecord->idd}");
        }
        
        // Create directory structure
        $saveDir = storage_path("app/public/products/{$product->id}");
        if (!is_dir($saveDir)) {
            mkdir($saveDir, 0777, true);
        }
        
        // Prepare file paths
        $fileName = basename($imageRecord->static);
        $savePath = $saveDir . DIRECTORY_SEPARATOR . $fileName;
        $thumbPath = $saveDir . DIRECTORY_SEPARATOR . 'thumb_' . $fileName;
        
        $imagePath = "products/{$product->id}/{$fileName}";
        $thumbnailPath = "products/{$product->id}/thumb_{$fileName}";
        
        // Download and save the image
        $imageData = file_get_contents($imageRecord->static);
        
        if ($imageData === false) {
            throw new \Exception("Failed to download image from URL: {$imageRecord->static}");
        }
        
        // Save original image
        file_put_contents($savePath, $imageData);
        
        // Create thumbnail
        $thumb = Image::read($imageData)
            ->contain(150, 150, 'ffffff');
        $thumb->toJpeg(80)->save($thumbPath);
        
        // Save to database
        DB::table('product_images')->insert([
            'product_id' => $product->id,
            'image_path' => $imagePath,
            'thumbnail_path' => $thumbnailPath,
            'is_primary' => 1,
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Mark as processed
        DB::table('urunler_resimler')
            ->where('idd', $imageRecord->idd)
            ->update(['ok' => 1]);
    }
}
