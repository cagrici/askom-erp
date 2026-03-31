<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id', 'price_list_id', 'price', 'min_quantity',
        'discount_percentage', 'discount_amount',
        'logo_id', 'logo_firm_no', 'logo_synced_at'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'min_quantity' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'logo_synced_at' => 'datetime'
    ];

    // Relationships
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function priceList(): BelongsTo
    {
        return $this->belongsTo(ProductPriceList::class, 'price_list_id');
    }

    // Methods
    public function getFinalPrice(): float
    {
        $finalPrice = $this->price;
        
        if ($this->discount_percentage) {
            $finalPrice = $finalPrice * (1 - $this->discount_percentage / 100);
        }
        
        if ($this->discount_amount) {
            $finalPrice = max(0, $finalPrice - $this->discount_amount);
        }
        
        return $finalPrice;
    }

    public function appliesTo($quantity): bool
    {
        return $quantity >= $this->min_quantity;
    }
}