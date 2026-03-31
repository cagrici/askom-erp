<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id',
        'purchase_request_item_id',
        'product_id',
        'item_code',
        'item_name',
        'description',
        'specifications',
        'ordered_quantity',
        'received_quantity',
        'remaining_quantity',
        'unit_id',
        'unit_name',
        'unit_price',
        'total_price',
        'discount_percentage',
        'discount_amount',
        'net_price',
        'currency',
        'status',
        'delivery_date',
        'notes',
        'supplier_item_code',
        'brand',
        'model',
        'sort_order',
    ];

    protected $casts = [
        'delivery_date' => 'date',
        'ordered_quantity' => 'decimal:4',
        'received_quantity' => 'decimal:4',
        'remaining_quantity' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'total_price' => 'decimal:4',
        'discount_percentage' => 'decimal:2',
        'discount_amount' => 'decimal:4',
        'net_price' => 'decimal:4',
        'sort_order' => 'integer',
    ];

    // Relationships
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function purchaseRequestItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequestItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePartiallyReceived($query)
    {
        return $query->where('status', 'partially_received');
    }

    public function scopeNotFullyReceived($query)
    {
        return $query->where('remaining_quantity', '>', 0);
    }

    // Accessors & Mutators
    public function getStatusTextAttribute(): string
    {
        $statuses = [
            'pending' => 'Bekliyor',
            'confirmed' => 'Onaylandı',
            'partially_received' => 'Kısmen Alındı',
            'received' => 'Alındı',
            'cancelled' => 'İptal Edildi',
        ];

        return $statuses[$this->status] ?? $this->status;
    }

    public function getStatusBadgeColorAttribute(): string
    {
        $colors = [
            'pending' => 'warning',
            'confirmed' => 'primary',
            'partially_received' => 'info',
            'received' => 'success',
            'cancelled' => 'danger',
        ];

        return $colors[$this->status] ?? 'secondary';
    }

    public function getFormattedUnitPriceAttribute(): string
    {
        return number_format($this->unit_price, 2) . ' ' . $this->currency;
    }

    public function getFormattedTotalPriceAttribute(): string
    {
        return number_format($this->total_price, 2) . ' ' . $this->currency;
    }

    public function getFormattedNetPriceAttribute(): string
    {
        return number_format($this->net_price, 2) . ' ' . $this->currency;
    }

    public function getReceiptPercentageAttribute(): float
    {
        if ($this->ordered_quantity == 0) {
            return 0;
        }

        return ($this->received_quantity / $this->ordered_quantity) * 100;
    }

    public function getIsFullyReceivedAttribute(): bool
    {
        return $this->remaining_quantity <= 0;
    }

    public function getIsPartiallyReceivedAttribute(): bool
    {
        return $this->received_quantity > 0 && $this->remaining_quantity > 0;
    }

    // Business Logic Methods
    public function canReceiveQuantity($quantity): bool
    {
        return $quantity > 0 && $quantity <= $this->remaining_quantity;
    }

    public function receiveQuantity($quantity): bool
    {
        if (!$this->canReceiveQuantity($quantity)) {
            return false;
        }

        $newReceivedQuantity = $this->received_quantity + $quantity;
        $newRemainingQuantity = $this->ordered_quantity - $newReceivedQuantity;

        $this->update([
            'received_quantity' => $newReceivedQuantity,
            'remaining_quantity' => $newRemainingQuantity,
            'status' => $newRemainingQuantity <= 0 ? 'received' : 'partially_received',
        ]);

        // Update purchase request item if linked
        if ($this->purchaseRequestItem) {
            $this->purchaseRequestItem->convertQuantity($quantity);
        }

        return true;
    }

    public function calculatePrices(): void
    {
        $total = $this->unit_price * $this->ordered_quantity;
        $discountAmount = $this->discount_percentage > 0 
            ? $total * ($this->discount_percentage / 100) 
            : $this->discount_amount;
        $net = $total - $discountAmount;

        $this->update([
            'total_price' => $total,
            'discount_amount' => $discountAmount,
            'net_price' => $net,
        ]);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->remaining_quantity) {
                $model->remaining_quantity = $model->ordered_quantity;
            }
        });

        static::saved(function ($model) {
            // Update parent order total when item changes
            if ($model->purchaseOrder) {
                $model->purchaseOrder->calculateTotalAmount();
            }
        });
    }
}