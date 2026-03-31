<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesOfferItem extends Model
{
    protected $fillable = [
        'sales_offer_id',
        'product_id',
        'product_name',
        'product_code',
        'description',
        'quantity',
        'unit_id',
        'unit_price',
        'discount_rate1',
        'discount_rate2',
        'discount_rate3',
        'discount_amount',
        'tax_rate',
        'tax_amount',
        'total_amount',
        'sort_order',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'discount_rate1' => 'decimal:2',
        'discount_rate2' => 'decimal:2',
        'discount_rate3' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    protected $appends = [
        'product_display_name',
    ];

    /**
     * İlişkiler
     */
    public function salesOffer(): BelongsTo
    {
        return $this->belongsTo(SalesOffer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * Calculate total for this item (3 kademeli iskonto)
     */
    public function calculateTotal(): void
    {
        $subtotal = $this->quantity * $this->unit_price;

        // Kademeli iskonto: önce %d1, sonra %d2, sonra %d3
        $d1 = (float) ($this->discount_rate1 ?? 0);
        $d2 = (float) ($this->discount_rate2 ?? 0);
        $d3 = (float) ($this->discount_rate3 ?? 0);

        $afterD1 = $subtotal * (1 - $d1 / 100);
        $afterD2 = $afterD1 * (1 - $d2 / 100);
        $afterD3 = $afterD2 * (1 - $d3 / 100);

        $this->discount_amount = $subtotal - $afterD3;

        $this->tax_amount = ($afterD3 * $this->tax_rate) / 100;
        $this->total_amount = $afterD3 + $this->tax_amount;
    }

    /**
     * Accessor for product display name
     */
    public function getProductDisplayNameAttribute(): string
    {
        if ($this->product_id && $this->product) {
            return $this->product->name ?? $this->product_name ?? 'N/A';
        }
        return $this->product_name ?? 'N/A';
    }
}
