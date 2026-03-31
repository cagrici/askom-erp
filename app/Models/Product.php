<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'barcode', 'name', 'slug', 'description', 'short_description',
        'category_id', 'brand_id', 'supplier_id', 'tax_id', 'unit_id',
        'cost_price', 'sale_price', 'wholesale_price', 'min_sale_price',
        'cost_price_try', 'sale_price_try', 'price_converted_at',
        'tax_rate', 'currency',
        'sku', 'stock_quantity', 'min_stock_level', 'max_stock_level',
        'track_inventory', 'allow_backorder',
        'weight', 'width', 'height', 'depth', 'volume', 'unit_of_measure',
        'items_per_package', 'items_per_box', 'boxes_per_pallet', 'package_type',
        'product_type', 'is_active', 'is_featured', 'is_digital', 'is_new',
        'can_be_purchased', 'can_be_sold', 'is_stockable', 'is_serialized',
        'lead_time_days', 'purchase_uom', 'sales_uom',
        'meta_title', 'meta_description', 'meta_keywords',
        'specifications', 'tags', 'sort_order',
        'logo_id', 'logo_firm_no', 'logo_producer_code', 'logo_specode', 'logo_synced_at',
        'logo_sale_price', 'logo_purchase_price', 'logo_currency', 'logo_price_synced_at',
        'country_of_origin', 'expiry_date', 'warranty_period', 'warranty_info'
    ];

    protected $casts = [
        'specifications' => 'array',
        'tags' => 'array',
        'cost_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'min_sale_price' => 'decimal:2',
        'cost_price_try' => 'decimal:4',
        'sale_price_try' => 'decimal:4',
        'price_converted_at' => 'date',
        'logo_sale_price' => 'decimal:4',
        'logo_purchase_price' => 'decimal:4',
        'logo_price_synced_at' => 'datetime',
        'lead_time_days' => 'decimal:2',
        'weight' => 'decimal:3',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
        'depth' => 'decimal:2',
        'volume' => 'decimal:3',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'is_digital' => 'boolean',
        'is_new' => 'boolean',
        'can_be_purchased' => 'boolean',
        'can_be_sold' => 'boolean',
        'is_stockable' => 'boolean',
        'is_serialized' => 'boolean',
        'track_inventory' => 'boolean',
        'allow_backorder' => 'boolean',
        'expiry_date' => 'date'
    ];

    protected $appends = [
        'primary_image_url'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
            if (empty($product->code)) {
                $product->code = 'PRD-' . strtoupper(Str::random(8));
            }
            if (empty($product->sku)) {
                $product->sku = 'SKU-' . strtoupper(Str::random(8));
            }
        });
    }

    // Relationships
    public function units(): HasMany
    {
        return $this->hasMany(ProductUnit::class)->orderBy('sort_order');
    }

    public function activeUnits(): HasMany
    {
        return $this->hasMany(ProductUnit::class)->where('is_active', true)->orderBy('sort_order');
    }

    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'product_categories');
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class, 'supplier_id');
    }

    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function attributes(): BelongsToMany
    {
        return $this->belongsToMany(ProductAttribute::class, 'product_attributes_mapping', 'product_id', 'attribute_id')
            ->withPivot('attribute_value_id', 'value')
            ->withTimestamps();
    }

    public function bundleItems(): HasMany
    {
        return $this->hasMany(ProductBundle::class, 'bundle_product_id');
    }

    public function prices(): HasMany
    {
        return $this->hasMany(ProductPrice::class);
    }

    // Accessors

    public function getInStockAttribute(): bool
    {
        if (!$this->track_inventory) {
            return true;
        }
        return $this->stock_quantity > 0 || $this->allow_backorder;
    }

    public function getLowStockAttribute(): bool
    {
        if (!$this->track_inventory) {
            return false;
        }
        return $this->stock_quantity <= $this->min_stock_level;
    }

    public function getFinalPriceAttribute()
    {
        // Burada fiyat listesi mantığı eklenebilir
        return $this->sale_price;
    }

    /**
     * Get price for specific customer and quantity using PricingService
     */
    public function getPriceFor($customer = null, $quantity = 1, $currency = 'TRY')
    {
        $pricingService = app(\App\Services\PricingService::class);
        return $pricingService->getBestPrice($this, $quantity, $customer, $currency);
    }

    /**
     * Get quantity-based pricing tiers
     */
    public function getQuantityTiers($customer = null, $currency = 'TRY')
    {
        $pricingService = app(\App\Services\PricingService::class);
        return $pricingService->getQuantityTiers($this, $customer, $currency);
    }

    /**
     * Check if product has special pricing
     */
    public function hasSpecialPricing($customer = null)
    {
        $pricingService = app(\App\Services\PricingService::class);
        return $pricingService->hasSpecialPricing($this, $customer);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeInStock($query)
    {
        return $query->where(function ($q) {
            $q->where('track_inventory', false)
              ->orWhere('stock_quantity', '>', 0)
              ->orWhere('allow_backorder', true);
        });
    }

    public function scopeLowStock($query)
    {
        return $query->where('track_inventory', true)
            ->whereColumn('stock_quantity', '<=', 'min_stock_level');
    }

    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeByCategories($query, $categoryIds)
    {
        if (is_array($categoryIds)) {
            return $query->whereHas('categories', function ($q) use ($categoryIds) {
                $q->whereIn('category_id', $categoryIds);
            });
        }

        return $query->whereHas('categories', function ($q) use ($categoryIds) {
            $q->where('category_id', $categoryIds);
        });
    }

    public function scopeByBrand($query, $brandId)
    {
        return $query->where('brand_id', $brandId);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('product_type', $type);
    }

    // ERP Scopes
    public function scopePurchasable($query)
    {
        return $query->where('can_be_purchased', true);
    }

    public function scopeSaleable($query)
    {
        return $query->where('can_be_sold', true);
    }

    public function scopeStockable($query)
    {
        return $query->where('is_stockable', true);
    }

    public function scopeRawMaterials($query)
    {
        return $query->where('product_type', 'raw_material');
    }

    public function scopeFinishedGoods($query)
    {
        return $query->where('product_type', 'finished_goods');
    }

    public function scopeServices($query)
    {
        return $query->where('product_type', 'service');
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('code', 'like', "%{$search}%")
              ->orWhere('sku', 'like', "%{$search}%")
              ->orWhere('barcode', 'like', "%{$search}%");
        });
    }

    // Methods
    public function updateStock(int $quantity, string $operation = 'add'): bool
    {
        if (!$this->track_inventory) {
            return true;
        }

        if ($operation === 'add') {
            $this->stock_quantity += $quantity;
        } else {
            $this->stock_quantity -= $quantity;
        }

        return $this->save();
    }

    public function canBePurchased(int $quantity = 1): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if (!$this->track_inventory) {
            return true;
        }

        return $this->stock_quantity >= $quantity || $this->allow_backorder;
    }

    // Translation Relationships
    public function translations(): HasMany
    {
        return $this->hasMany(ProductTranslation::class);
    }

    public function translation($locale = null): HasOne
    {
        $locale = $locale ?? app()->getLocale();
        return $this->hasOne(ProductTranslation::class)->where('locale', $locale);
    }

    public function currentTranslation(): HasOne
    {
        return $this->translation();
    }

    // Translation Helper Methods
    public function getTranslatedName($locale = null): string
    {
        $translation = $this->translations()->where('locale', $locale ?? app()->getLocale())->first();
        return $translation?->name ?? $this->name ?? '';
    }

    public function getTranslatedDescription($locale = null): ?string
    {
        $translation = $this->translations()->where('locale', $locale ?? app()->getLocale())->first();
        return $translation?->description ?? $this->description;
    }

    public function getTranslatedShortDescription($locale = null): ?string
    {
        $translation = $this->translations()->where('locale', $locale ?? app()->getLocale())->first();
        return $translation?->short_description ?? $this->short_description;
    }

    public function hasTranslation($locale = null): bool
    {
        $locale = $locale ?? app()->getLocale();
        return $this->translations()->where('locale', $locale)->exists();
    }

    public function getAvailableLocales(): array
    {
        return $this->translations()->pluck('locale')->unique()->values()->toArray();
    }

    // Scope for products with translations in specific locale
    public function scopeWithTranslation($query, $locale = null)
    {
        $locale = $locale ?? app()->getLocale();
        return $query->whereHas('translations', function($q) use ($locale) {
            $q->where('locale', $locale);
        });
    }

    // Scope to eager load current translation
    public function scopeWithCurrentTranslation($query, $locale = null)
    {
        $locale = $locale ?? app()->getLocale();
        return $query->with(['translation' => function($q) use ($locale) {
            $q->where('locale', $locale);
        }]);
    }

    // Accessors
    public function getPrimaryImageUrlAttribute()
    {
        if ($this->primaryImage) {
            return $this->primaryImage->thumbnail_url;
        }

        return asset('images/no-image.png');
    }
}
