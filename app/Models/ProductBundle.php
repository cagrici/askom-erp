<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductBundle extends Model
{
    use HasFactory;

    protected $fillable = [
        'bundle_product_id', 'product_id', 'quantity',
        'discount_amount', 'discount_percentage'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'discount_amount' => 'decimal:2',
        'discount_percentage' => 'decimal:2'
    ];

    // Relationships
    public function bundleProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'bundle_product_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Methods
    public function getDiscountedPrice(): float
    {
        $originalPrice = $this->product->sale_price * $this->quantity;
        
        if ($this->discount_percentage) {
            return $originalPrice * (1 - $this->discount_percentage / 100);
        }
        
        if ($this->discount_amount) {
            return max(0, $originalPrice - $this->discount_amount);
        }
        
        return $originalPrice;
    }
}