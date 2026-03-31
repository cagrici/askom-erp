<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class ProductAttribute extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'type', 'unit', 'is_required',
        'is_filterable', 'is_variant', 'sort_order'
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_filterable' => 'boolean',
        'is_variant' => 'boolean'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($attribute) {
            if (empty($attribute->slug)) {
                $attribute->slug = Str::slug($attribute->name);
            }
        });
    }

    // Relationships
    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class, 'attribute_id')->orderBy('sort_order');
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_attributes_mapping', 'attribute_id', 'product_id')
            ->withPivot('attribute_value_id', 'value')
            ->withTimestamps();
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(ProductCategory::class, 'category_attributes', 'attribute_id', 'category_id')
            ->withPivot('is_required', 'sort_order')
            ->withTimestamps();
    }

    // Scopes
    public function scopeFilterable($query)
    {
        return $query->where('is_filterable', true);
    }

    public function scopeVariant($query)
    {
        return $query->where('is_variant', true);
    }

    // Methods
    public function isSelect(): bool
    {
        return in_array($this->type, ['select', 'multiselect']);
    }

    public function getFormattedValue($value)
    {
        switch ($this->type) {
            case 'boolean':
                return $value ? 'Evet' : 'Hayır';
            case 'number':
                return number_format($value, 2) . ($this->unit ? ' ' . $this->unit : '');
            case 'date':
                return $value instanceof \DateTime ? $value->format('d.m.Y') : $value;
            default:
                return $value;
        }
    }
}