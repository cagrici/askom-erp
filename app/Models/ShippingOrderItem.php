<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShippingOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'shipping_order_id',
        'sales_order_item_id',
        'product_id',
        'ordered_quantity',
        'shipping_quantity',
        'picked_quantity',
        'status',
        'corridor',
        'shelf',
        'bin_location',
        'notes',
    ];

    protected $casts = [
        'ordered_quantity' => 'decimal:3',
        'shipping_quantity' => 'decimal:3',
        'picked_quantity' => 'decimal:3',
    ];

    protected $appends = ['status_label'];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_PICKING = 'picking';
    const STATUS_PICKED = 'picked';
    const STATUS_SHIPPED = 'shipped';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Get all possible statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_PENDING => 'Beklemede',
            self::STATUS_PICKING => 'Toplanıyor',
            self::STATUS_PICKED => 'Toplandı',
            self::STATUS_SHIPPED => 'Sevk Edildi',
            self::STATUS_CANCELLED => 'İptal',
        ];
    }

    // Relationships

    public function shippingOrder(): BelongsTo
    {
        return $this->belongsTo(ShippingOrder::class);
    }

    public function salesOrderItem(): BelongsTo
    {
        return $this->belongsTo(SalesOrderItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function pickingTaskItems(): HasMany
    {
        return $this->hasMany(PickingTaskItem::class);
    }

    // Scopes

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopePicked($query)
    {
        return $query->where('status', self::STATUS_PICKED);
    }

    // Attribute accessors

    public function getStatusLabelAttribute(): string
    {
        return self::getStatuses()[$this->status] ?? $this->status;
    }

    // Helper methods

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isPicking(): bool
    {
        return $this->status === self::STATUS_PICKING;
    }

    public function isPicked(): bool
    {
        return $this->status === self::STATUS_PICKED;
    }

    public function getRemainingQuantity(): float
    {
        return $this->shipping_quantity - $this->picked_quantity;
    }

    public function isFullyPicked(): bool
    {
        return $this->picked_quantity >= $this->shipping_quantity;
    }

    /**
     * Add picked quantity
     */
    public function addPickedQuantity(float $quantity): bool
    {
        $this->picked_quantity += $quantity;

        if ($this->isFullyPicked()) {
            $this->status = self::STATUS_PICKED;
        } else {
            $this->status = self::STATUS_PICKING;
        }

        return $this->save();
    }
}
