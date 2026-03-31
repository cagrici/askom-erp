<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PickingTaskItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'picking_task_id',
        'shipping_order_item_id',
        'product_id',
        'required_quantity',
        'picked_quantity',
        'status',
        'corridor',
        'shelf',
        'bin_location',
    ];

    protected $casts = [
        'required_quantity' => 'decimal:3',
        'picked_quantity' => 'decimal:3',
    ];

    protected $appends = ['status_label', 'remaining_quantity'];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_PARTIAL = 'partial';
    const STATUS_SKIPPED = 'skipped';

    /**
     * Get all possible statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_PENDING => 'Beklemede',
            self::STATUS_IN_PROGRESS => 'Toplanıyor',
            self::STATUS_COMPLETED => 'Tamamlandı',
            self::STATUS_PARTIAL => 'Kısmi',
            self::STATUS_SKIPPED => 'Atlandı',
        ];
    }

    // Relationships

    public function pickingTask(): BelongsTo
    {
        return $this->belongsTo(PickingTask::class);
    }

    public function shippingOrderItem(): BelongsTo
    {
        return $this->belongsTo(ShippingOrderItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function scans(): HasMany
    {
        return $this->hasMany(PickingScan::class);
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

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeNotCompleted($query)
    {
        return $query->whereNotIn('status', [self::STATUS_COMPLETED, self::STATUS_SKIPPED]);
    }

    // Attribute accessors

    public function getStatusLabelAttribute(): string
    {
        return self::getStatuses()[$this->status] ?? $this->status;
    }

    public function getRemainingQuantityAttribute(): float
    {
        return max(0, $this->required_quantity - $this->picked_quantity);
    }

    public function getProgressPercentageAttribute(): float
    {
        if ($this->required_quantity == 0) {
            return 0;
        }
        return round(($this->picked_quantity / $this->required_quantity) * 100, 1);
    }

    // Helper methods

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isPartial(): bool
    {
        return $this->status === self::STATUS_PARTIAL;
    }

    public function isSkipped(): bool
    {
        return $this->status === self::STATUS_SKIPPED;
    }

    public function isFullyPicked(): bool
    {
        return $this->picked_quantity >= $this->required_quantity;
    }

    /**
     * Record a barcode scan
     */
    public function recordScan(string $barcode, float $quantity, User $user, string $result = 'success', ?string $errorMessage = null): PickingScan
    {
        $scan = $this->scans()->create([
            'picking_task_id' => $this->picking_task_id,
            'product_id' => $this->product_id,
            'scanned_by_id' => $user->id,
            'barcode' => $barcode,
            'quantity' => $quantity,
            'scan_result' => $result,
            'error_message' => $errorMessage,
            'corridor' => $this->corridor,
            'shelf' => $this->shelf,
        ]);

        if ($result === 'success') {
            $this->addPickedQuantity($quantity);
        }

        return $scan;
    }

    /**
     * Add picked quantity
     */
    public function addPickedQuantity(float $quantity): bool
    {
        $this->picked_quantity += $quantity;

        // Update status based on picked quantity
        if ($this->isFullyPicked()) {
            $this->status = self::STATUS_COMPLETED;
        } elseif ($this->picked_quantity > 0) {
            $this->status = self::STATUS_IN_PROGRESS;
        }

        $saved = $this->save();

        if ($saved) {
            // Update shipping order item
            $this->shippingOrderItem->addPickedQuantity($quantity);

            // Update picking task progress
            $this->pickingTask->updateProgress();
        }

        return $saved;
    }

    /**
     * Skip this item
     */
    public function skip(?string $reason = null): bool
    {
        if ($this->isFullyPicked()) {
            return false;
        }

        $this->status = self::STATUS_SKIPPED;
        return $this->save();
    }

    /**
     * Mark as partial (cannot pick full quantity)
     */
    public function markAsPartial(): bool
    {
        if ($this->picked_quantity == 0 || $this->isFullyPicked()) {
            return false;
        }

        $this->status = self::STATUS_PARTIAL;
        return $this->save();
    }
}
