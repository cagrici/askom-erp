<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesReturnItem extends Model
{
    protected $fillable = [
        'sales_return_id',
        'sales_order_item_id',
        'product_id',
        'product_name',
        'product_code',
        'quantity_returned',
        'unit_price',
        'line_total',
        'condition',
        'notes',
        'sort_order',
    ];

    protected $casts = [
        'quantity_returned' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    protected $appends = [
        'condition_label',
    ];

    // Condition constants
    const CONDITION_UNDAMAGED = 'undamaged';
    const CONDITION_MINOR_DAMAGE = 'minor_damage';
    const CONDITION_MAJOR_DAMAGE = 'major_damage';
    const CONDITION_UNUSABLE = 'unusable';

    /**
     * Relationships
     */
    public function salesReturn(): BelongsTo
    {
        return $this->belongsTo(SalesReturn::class);
    }

    public function salesOrderItem(): BelongsTo
    {
        return $this->belongsTo(SalesOrderItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(SalesReturnImage::class);
    }

    /**
     * Accessors
     */
    public function getConditionLabelAttribute(): string
    {
        return match($this->condition) {
            self::CONDITION_UNDAMAGED => 'Hasarsız',
            self::CONDITION_MINOR_DAMAGE => 'Hafif Hasarlı',
            self::CONDITION_MAJOR_DAMAGE => 'Ağır Hasarlı',
            self::CONDITION_UNUSABLE => 'Kullanılamaz',
            default => $this->condition,
        };
    }

    /**
     * Calculate line total
     */
    public function calculateTotal()
    {
        $this->line_total = $this->quantity_returned * $this->unit_price;
        $this->save();
    }

    /**
     * Static helper methods
     */
    public static function getConditions(): array
    {
        return [
            self::CONDITION_UNDAMAGED => 'Hasarsız',
            self::CONDITION_MINOR_DAMAGE => 'Hafif Hasarlı',
            self::CONDITION_MAJOR_DAMAGE => 'Ağır Hasarlı',
            self::CONDITION_UNUSABLE => 'Kullanılamaz',
        ];
    }
}
