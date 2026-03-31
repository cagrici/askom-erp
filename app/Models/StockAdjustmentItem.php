<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAdjustmentItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_adjustment_id',
        'product_id',
        'product_unit_id',
        'current_quantity',
        'adjusted_quantity',
        'difference_quantity',
        'unit_cost',
        'total_cost',
        'reason',
        'notes'
    ];

    protected $casts = [
        'stock_adjustment_id' => 'integer',
        'product_id' => 'integer',
        'product_unit_id' => 'integer',
        'current_quantity' => 'decimal:2',
        'adjusted_quantity' => 'decimal:2',
        'difference_quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2'
    ];

    // Boot method
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            // Calculate difference quantity
            if ($item->current_quantity && $item->adjusted_quantity) {
                $item->difference_quantity = $item->adjusted_quantity - $item->current_quantity;
            }

            // Calculate total cost
            if ($item->difference_quantity && $item->unit_cost) {
                $item->total_cost = abs($item->difference_quantity) * $item->unit_cost;
            }
        });

        static::updating(function ($item) {
            // Recalculate on update
            if ($item->isDirty(['current_quantity', 'adjusted_quantity'])) {
                $item->difference_quantity = $item->adjusted_quantity - $item->current_quantity;
            }

            if ($item->isDirty(['difference_quantity', 'unit_cost'])) {
                $item->total_cost = abs($item->difference_quantity) * $item->unit_cost;
            }
        });
    }

    // Relationships
    public function adjustment(): BelongsTo
    {
        return $this->belongsTo(StockAdjustment::class, 'stock_adjustment_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(ProductUnit::class, 'product_unit_id');
    }

    // Methods
    public function processAdjustment(): void
    {
        if (!$this->difference_quantity || $this->difference_quantity == 0) {
            return;
        }

        // Create inventory movement
        InventoryMovement::create([
            'product_id' => $this->product_id,
            'product_unit_id' => $this->product_unit_id,
            'movement_type' => 'adjustment',
            'quantity' => abs($this->difference_quantity),
            'unit_cost' => $this->unit_cost,
            'total_cost' => $this->total_cost,
            'reference_type' => 'stock_adjustment',
            'reference_id' => $this->stock_adjustment_id,
            'notes' => $this->notes ?: $this->reason,
            'created_by' => auth()->id(),
        ]);

        // Update product stock
        $product = $this->product;
        $baseQuantityChange = $this->difference_quantity;

        // Convert to base unit if necessary
        if ($this->unit && !$this->unit->is_base_unit) {
            $baseQuantityChange = $this->difference_quantity * $this->unit->conversion_factor;
        }

        if ($baseQuantityChange > 0) {
            $product->increment('stock_quantity', $baseQuantityChange);
        } else {
            $product->decrement('stock_quantity', abs($baseQuantityChange));
        }
    }

    // Attributes
    public function getAdjustmentTypeAttribute(): string
    {
        if ($this->difference_quantity > 0) {
            return 'increase';
        } elseif ($this->difference_quantity < 0) {
            return 'decrease';
        }
        return 'no_change';
    }

    public function getAdjustmentTypeTextAttribute(): string
    {
        return match($this->adjustment_type) {
            'increase' => 'Artış',
            'decrease' => 'Azalış',
            'no_change' => 'Değişiklik Yok',
            default => '-'
        };
    }

    public function getAdjustmentTypeColorAttribute(): string
    {
        return match($this->adjustment_type) {
            'increase' => 'success',
            'decrease' => 'danger',
            'no_change' => 'secondary',
            default => 'secondary'
        };
    }

    public function getFormattedCurrentQuantityAttribute(): string
    {
        $quantity = number_format($this->current_quantity, 2);
        if ($this->unit) {
            return "{$quantity} {$this->unit->unit_code}";
        }
        return $quantity;
    }

    public function getFormattedAdjustedQuantityAttribute(): string
    {
        $quantity = number_format($this->adjusted_quantity, 2);
        if ($this->unit) {
            return "{$quantity} {$this->unit->unit_code}";
        }
        return $quantity;
    }

    public function getFormattedDifferenceQuantityAttribute(): string
    {
        $sign = $this->difference_quantity >= 0 ? '+' : '';
        $quantity = number_format($this->difference_quantity, 2);
        if ($this->unit) {
            return "{$sign}{$quantity} {$this->unit->unit_code}";
        }
        return "{$sign}{$quantity}";
    }
}