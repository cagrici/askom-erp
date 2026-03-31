<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class ProductCategory extends Model
{
    use HasFactory;

    protected $table = 'categories';

    protected $fillable = [
        'name', 'slug', 'description', 'image', 'parent_id',
        'sort_order', 'is_active', 'is_featured', 'meta_data'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'meta_data' => 'array'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    // Relationships
    public function parent(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ProductCategory::class, 'parent_id')->orderBy('sort_order');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'category_id');
    }

    public function attributes(): BelongsToMany
    {
        return $this->belongsToMany(ProductAttribute::class, 'category_attributes', 'category_id', 'attribute_id')
            ->withPivot('is_required', 'sort_order')
            ->withTimestamps()
            ->orderBy('pivot_sort_order');
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

    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    // Methods
    public function getPathAttribute(): array
    {
        $path = [];
        $category = $this;

        while ($category) {
            array_unshift($path, $category);
            $category = $category->parent;
        }

        return $path;
    }

    public function getFullNameAttribute(): string
    {
        return collect($this->path)->pluck('name')->implode(' > ');
    }

    public function hasChildren(): bool
    {
        return $this->children()->exists();
    }

    public function getAllDescendants()
    {
        $descendants = collect();

        foreach ($this->children as $child) {
            $descendants->push($child);
            $descendants = $descendants->merge($child->getAllDescendants());
        }

        return $descendants;
    }

    public function getProductCount(): int
    {
        $count = $this->products()->count();

        foreach ($this->children as $child) {
            $count += $child->getProductCount();
        }

        return $count;
    }
}