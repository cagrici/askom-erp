<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransferItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_transfer_id',
        'product_id',
        'product_unit_id',
        'quantity',
        'transferred_quantity',
        'received_quantity',
        'unit_cost',
        'total_cost',
        'notes',
        'serial_numbers',
        'batch_numbers',
        'expiry_date'
    ];

    protected $casts = [
        'stock_transfer_id' => 'integer',
        'product_id' => 'integer',
        'product_unit_id' => 'integer',
        'quantity' => 'decimal:2',
        'transferred_quantity' => 'decimal:2',
        'received_quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'serial_numbers' => 'array',
        'batch_numbers' => 'array',
        'expiry_date' => 'date'
    ];

    // Boot method
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            // Set transferred quantity equal to quantity initially
            if (!isset($item->transferred_quantity)) {
                $item->transferred_quantity = $item->quantity;
            }

            // Calculate total cost
            if ($item->quantity && $item->unit_cost) {
                $item->total_cost = $item->quantity * $item->unit_cost;
            }
        });

        static::updating(function ($item) {
            // Recalculate total cost if quantity or unit cost changes
            if ($item->isDirty(['quantity', 'unit_cost'])) {
                $item->total_cost = $item->quantity * $item->unit_cost;
            }
        });
    }

    // Relationships
    public function transfer(): BelongsTo
    {
        return $this->belongsTo(StockTransfer::class, 'stock_transfer_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(ProductUnit::class, 'product_unit_id');
    }

    // Attributes
    public function getFormattedQuantityAttribute(): string
    {
        $quantity = number_format($this->quantity, 2);
        if ($this->unit) {
            return "{$quantity} {$this->unit->unit_code}";
        }
        return $quantity;
    }

    public function getFormattedTransferredQuantityAttribute(): string
    {
        $quantity = number_format($this->transferred_quantity, 2);
        if ($this->unit) {
            return "{$quantity} {$this->unit->unit_code}";
        }
        return $quantity;
    }

    public function getFormattedReceivedQuantityAttribute(): string
    {
        $quantity = number_format($this->received_quantity, 2);
        if ($this->unit) {
            return "{$quantity} {$this->unit->unit_code}";
        }
        return $quantity;
    }

    public function getTransferStatusAttribute(): string
    {
        if ($this->received_quantity >= $this->transferred_quantity) {
            return 'completed';
        } elseif ($this->received_quantity > 0) {
            return 'partial';
        } elseif ($this->transferred_quantity > 0) {
            return 'shipped';
        }
        return 'pending';
    }

    public function getTransferStatusTextAttribute(): string
    {
        return match($this->transfer_status) {
            'completed' => 'Tamamlandı',
            'partial' => 'Kısmen Alındı',
            'shipped' => 'Gönderildi',
            'pending' => 'Beklemede',
            default => '-'
        };
    }

    public function getTransferStatusColorAttribute(): string
    {
        return match($this->transfer_status) {
            'completed' => 'success',
            'partial' => 'warning',
            'shipped' => 'info',
            'pending' => 'secondary',
            default => 'secondary'
        };
    }

    public function getPendingQuantityAttribute(): float
    {
        return $this->transferred_quantity - $this->received_quantity;
    }

    public function getFormattedPendingQuantityAttribute(): string
    {
        $quantity = number_format($this->pending_quantity, 2);
        if ($this->unit) {
            return "{$quantity} {$this->unit->unit_code}";
        }
        return $quantity;
    }

    public function getReceivePercentageAttribute(): float
    {
        if ($this->transferred_quantity == 0) {
            return 0;
        }
        return round(($this->received_quantity / $this->transferred_quantity) * 100, 1);
    }

    // Methods
    public function isFullyReceived(): bool
    {
        return $this->received_quantity >= $this->transferred_quantity;
    }

    public function isPartiallyReceived(): bool
    {
        return $this->received_quantity > 0 && $this->received_quantity < $this->transferred_quantity;
    }

    public function isNotReceived(): bool
    {
        return $this->received_quantity == 0;
    }

    public function canReceiveMore(): bool
    {
        return $this->received_quantity < $this->transferred_quantity;
    }

    public function getRemainingQuantity(): float
    {
        return max(0, $this->transferred_quantity - $this->received_quantity);
    }
}