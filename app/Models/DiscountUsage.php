<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiscountUsage extends Model
{
    protected $fillable = [
        'discount_id',
        'sales_order_id',
        'customer_id',
        'user_id',
        'order_amount',
        'discount_amount',
        'discount_type',
        'quantity',
        'applied_products',
        'notes',
    ];

    protected $casts = [
        'order_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'quantity' => 'integer',
        'applied_products' => 'array',
    ];

    // Relationships
    public function discount(): BelongsTo
    {
        return $this->belongsTo(Discount::class);
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class, 'customer_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
