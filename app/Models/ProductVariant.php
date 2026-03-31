<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id', 'variant_code', 'variant_name', 'barcode',
        'price', 'cost_price', 'stock_quantity', 'image',
        'is_active', 'attributes'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'attributes' => 'array',
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($variant) {
            if (empty($variant->variant_code)) {
                $variant->variant_code = $variant->product->code . '-' . strtoupper(uniqid());
            }
        });
    }

    // Relationships
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Accessors
    public function getDisplayNameAttribute(): string
    {
        $attributes = [];
        
        if (is_array($this->attributes)) {
            foreach ($this->attributes as $key => $value) {
                $attributes[] = "$key: $value";
            }
        }
        
        return $this->product->name . ' - ' . implode(', ', $attributes);
    }

    public function getFinalPriceAttribute()
    {
        return $this->price ?? $this->product->sale_price;
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInStock($query)
    {
        return $query->where('stock_quantity', '>', 0);
    }

    // Methods
    public function updateStock(int $quantity, string $operation = 'add'): bool
    {
        if ($operation === 'add') {
            $this->stock_quantity += $quantity;
        } else {
            $this->stock_quantity -= $quantity;
        }

        return $this->save();
    }
}