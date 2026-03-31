<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\Brand;
use App\Models\Category;

class ImportProductsFromExcel extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'products:import-from-excel {--limit=100 : Number of records to process per batch} {--test : Test mode - process only first 10 records}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import products from products_excel table to products table with brand and category processing';

    private $brandCache = [];
    private $categoryCache = [];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting product import from products_excel table...');
        
        $limit = $this->option('test') ? 10 : $this->option('limit');
        $offset = 0;
        $totalProcessed = 0;
        $totalErrors = 0;

        // Get total record count
        $totalRecords = DB::table('products_excel')->count();
        $this->info("Total records to process: {$totalRecords}");

        if ($this->option('test')) {
            $this->warn('RUNNING IN TEST MODE - Processing only first 10 records');
        }

        while (true) {
            $excelProducts = DB::table('products_excel')
                ->limit($limit)
                ->offset($offset)
                ->get();

            if ($excelProducts->isEmpty()) {
                break;
            }

            $this->info("Processing batch: " . ($offset + 1) . " to " . ($offset + $excelProducts->count()));

            foreach ($excelProducts as $excelProduct) {
                try {
                    $this->processProduct($excelProduct);
                    $totalProcessed++;
                } catch (\Exception $e) {
                    $this->error("Error processing product ID {$excelProduct->id}: " . $e->getMessage());
                    $totalErrors++;
                }
            }

            $offset += $limit;

            if ($this->option('test')) {
                break;
            }

            // Show progress
            $this->info("Processed: {$totalProcessed}, Errors: {$totalErrors}");
        }

        $this->info("Import completed!");
        $this->info("Total processed: {$totalProcessed}");
        $this->info("Total errors: {$totalErrors}");
    }

    private function processProduct($excelProduct)
    {
        // Skip if required fields are missing
        if (empty($excelProduct->STOKKODU) || empty($excelProduct->URUNADI)) {
            throw new \Exception("Missing required fields: STOKKODU or URUNADI");
        }

        // Check if product already exists
        $existingProduct = Product::where('code', $excelProduct->STOKKODU)->first();
        if ($existingProduct) {
            // Update categories for existing product
            $this->updateExistingProductCategories($existingProduct, $excelProduct);
            return;
        }

        // Process brand
        $brandId = null;
        if (!empty($excelProduct->MARKA)) {
            $brandId = $this->getOrCreateBrand($excelProduct->MARKA);
        }

        // Process categories
        $categoryId = null;
        $categoryIds = [];
        
        if (!empty($excelProduct->KATEGORILER)) {
            $categoryId = $this->processCategories($excelProduct->KATEGORILER);
            $categoryIds = $this->processCategoriesForManyToMany($excelProduct->KATEGORILER);
        }
        
        // If no categories found, create a default category
        if (!$categoryId) {
            $categoryId = $this->getDefaultCategoryId();
            if (!in_array($categoryId, $categoryIds)) {
                $categoryIds[] = $categoryId;
            }
        }

        // Create product
        $product = new Product();
        $product->code = $excelProduct->STOKKODU;
        $product->name = $excelProduct->URUNADI;
        $product->slug = Str::slug($excelProduct->URUNADI . '-' . $excelProduct->STOKKODU);
        $product->sku = $excelProduct->VARYASYONKODU ?? $excelProduct->STOKKODU;
        $product->special_int_1 = $excelProduct->URUNKARTIID;
        $product->special_int_2 = $excelProduct->URUNID;
        $product->brand_id = $brandId;
        $product->category_id = $categoryId; // Main category (deepest level)
        $product->cost_price = 0.00;
        $product->sale_price = 0.00;
        $product->is_active = true;
        $product->save();

        // Attach all categories (including parent categories)
        if (!empty($categoryIds)) {
            $product->categories()->sync($categoryIds);
        }

        $this->line("Created product: {$product->name} (ID: {$product->id}) with " . count($categoryIds) . " categories");
    }

    private function getOrCreateBrand($brandName)
    {
        $brandName = trim($brandName);
        
        if (isset($this->brandCache[$brandName])) {
            return $this->brandCache[$brandName];
        }

        $brand = Brand::where('name', $brandName)->first();
        
        if (!$brand) {
            $brand = new Brand();
            $brand->name = $brandName;
            $brand->slug = Str::slug($brandName);
            $brand->is_active = true;
            $brand->save();
            
            $this->line("Created brand: {$brandName}");
        }

        $this->brandCache[$brandName] = $brand->id;
        return $brand->id;
    }

    private function processCategories($categoriesString)
    {
        $categoriesString = trim($categoriesString);
        
        if (isset($this->categoryCache[$categoriesString])) {
            return $this->categoryCache[$categoriesString];
        }

        // Split by semicolon and clean up
        $categoryPaths = array_filter(array_map('trim', explode(';', $categoriesString)));
        
        $lastCategoryId = null;
        
        foreach ($categoryPaths as $categoryPath) {
            if (empty($categoryPath)) continue;
            
            // Split by > to get category hierarchy
            $categoryNames = array_filter(array_map('trim', explode('>', $categoryPath)));
            
            $parentId = null;
            
            foreach ($categoryNames as $categoryName) {
                $categoryId = $this->getOrCreateCategory($categoryName, $parentId);
                $parentId = $categoryId;
                $lastCategoryId = $categoryId;
            }
        }

        $this->categoryCache[$categoriesString] = $lastCategoryId;
        return $lastCategoryId;
    }

    private function getOrCreateCategory($categoryName, $parentId = null)
    {
        $cacheKey = $categoryName . '_' . ($parentId ?? 'root');
        
        if (isset($this->categoryCache[$cacheKey])) {
            return $this->categoryCache[$cacheKey];
        }

        // First try to find exact match (name + parent_id + type)
        $category = Category::where('name', $categoryName)
            ->where('parent_id', $parentId)
            ->where('type', 'product')
            ->first();

        if (!$category) {
            // Generate unique slug
            $baseSlug = Str::slug($categoryName);
            $slug = $baseSlug;
            $counter = 1;
            
            // Check if slug exists and make it unique
            while (Category::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }
            
            $category = new Category();
            $category->name = $categoryName;
            $category->slug = $slug;
            $category->type = 'product';
            $category->parent_id = $parentId;
            $category->is_active = true;
            $category->save();
            
            $this->line("Created category: {$categoryName} (slug: {$slug})" . ($parentId ? " (parent: {$parentId})" : ""));
        }

        $this->categoryCache[$cacheKey] = $category->id;
        return $category->id;
    }

    private function processCategoriesForManyToMany($categoriesString)
    {
        $categoriesString = trim($categoriesString);
        $allCategoryIds = [];
        
        // Split by semicolon and clean up
        $categoryPaths = array_filter(array_map('trim', explode(';', $categoriesString)));
        
        foreach ($categoryPaths as $categoryPath) {
            if (empty($categoryPath)) continue;
            
            // Split by > to get category hierarchy
            $categoryNames = array_filter(array_map('trim', explode('>', $categoryPath)));
            
            $parentId = null;
            
            foreach ($categoryNames as $categoryName) {
                $categoryId = $this->getOrCreateCategory($categoryName, $parentId);
                
                // Add this category to the list if not already added
                if (!in_array($categoryId, $allCategoryIds)) {
                    $allCategoryIds[] = $categoryId;
                }
                
                $parentId = $categoryId;
            }
        }

        return $allCategoryIds;
    }

    private function updateExistingProductCategories($product, $excelProduct)
    {
        $updated = false;

        // Update brand if needed
        if (!empty($excelProduct->MARKA)) {
            $brandId = $this->getOrCreateBrand($excelProduct->MARKA);
            if ($product->brand_id != $brandId) {
                $product->brand_id = $brandId;
                $updated = true;
            }
        }

        // Update categories
        $mainCategoryId = null;
        $allCategoryIds = [];
        
        if (!empty($excelProduct->KATEGORILER)) {
            // Get main category (deepest level)
            $mainCategoryId = $this->processCategories($excelProduct->KATEGORILER);
            
            // Get all categories for many-to-many
            $allCategoryIds = $this->processCategoriesForManyToMany($excelProduct->KATEGORILER);
        }
        
        // If no categories found, use default
        if (!$mainCategoryId) {
            $mainCategoryId = $this->getDefaultCategoryId();
            if (!in_array($mainCategoryId, $allCategoryIds)) {
                $allCategoryIds[] = $mainCategoryId;
            }
        }
        
        // Update main category if different
        if ($product->category_id != $mainCategoryId) {
            $product->category_id = $mainCategoryId;
            $updated = true;
        }

        // Get current category IDs and update if different
        if (!empty($allCategoryIds)) {
            $currentCategoryIds = $product->categories()->pluck('category_id')->toArray();
            sort($currentCategoryIds);
            sort($allCategoryIds);

            // Check if categories are different
            if ($currentCategoryIds != $allCategoryIds) {
                $product->categories()->sync($allCategoryIds);
                $updated = true;
                $this->line("Updated categories for product: {$product->name} (ID: {$product->id})");
            }
        }

        // Update special fields if different
        if ($product->special_int_1 != $excelProduct->URUNKARTIID) {
            $product->special_int_1 = $excelProduct->URUNKARTIID;
            $updated = true;
        }

        if ($product->special_int_2 != $excelProduct->URUNID) {
            $product->special_int_2 = $excelProduct->URUNID;
            $updated = true;
        }

        // Save if any updates were made
        if ($updated) {
            $product->save();
            $this->line("Updated existing product: {$product->name} (ID: {$product->id})");
        } else {
            $this->line("No updates needed for product: {$product->name} (ID: {$product->id})");
        }
    }

    private function getDefaultCategoryId()
    {
        $defaultCategoryName = 'Genel Ürünler';
        
        if (isset($this->categoryCache[$defaultCategoryName . '_root'])) {
            return $this->categoryCache[$defaultCategoryName . '_root'];
        }

        $category = Category::where('name', $defaultCategoryName)
            ->where('type', 'product')
            ->whereNull('parent_id')
            ->first();

        if (!$category) {
            $category = new Category();
            $category->name = $defaultCategoryName;
            $category->slug = 'genel-urunler';
            $category->type = 'product';
            $category->parent_id = null;
            $category->is_active = true;
            $category->save();
            
            $this->line("Created default category: {$defaultCategoryName}");
        }

        $this->categoryCache[$defaultCategoryName . '_root'] = $category->id;
        return $category->id;
    }
}
