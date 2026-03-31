<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class PickingTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_number',
        'shipping_order_id',
        'assigned_to_id',
        'assigned_by_id',
        'status',
        'started_at',
        'completed_at',
        'cancelled_at',
        'total_items',
        'picked_items',
        'notes',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    protected $appends = ['status_label'];

    // Status constants
    const STATUS_ASSIGNED = 'assigned';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Get all possible statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_ASSIGNED => 'Atandı',
            self::STATUS_IN_PROGRESS => 'Devam Ediyor',
            self::STATUS_COMPLETED => 'Tamamlandı',
            self::STATUS_CANCELLED => 'İptal',
        ];
    }

    /**
     * Generate next task number
     */
    public static function generateTaskNumber(): string
    {
        $year = Carbon::now()->year;
        $prefix = "PT-{$year}-";

        $lastTask = self::where('task_number', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->first();

        if ($lastTask) {
            $lastNumber = intval(str_replace($prefix, '', $lastTask->task_number));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Boot method
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->task_number)) {
                $model->task_number = self::generateTaskNumber();
            }
        });
    }

    // Relationships

    public function shippingOrder(): BelongsTo
    {
        return $this->belongsTo(ShippingOrder::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PickingTaskItem::class);
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

    public function scopeAssigned($query)
    {
        return $query->where('status', self::STATUS_ASSIGNED);
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', self::STATUS_IN_PROGRESS);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_ASSIGNED, self::STATUS_IN_PROGRESS]);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('assigned_to_id', $userId);
    }

    // Attribute accessors

    public function getStatusLabelAttribute(): string
    {
        return self::getStatuses()[$this->status] ?? $this->status;
    }

    public function getProgressPercentageAttribute(): float
    {
        if ($this->total_items === 0) {
            return 0;
        }
        return round(($this->picked_items / $this->total_items) * 100, 1);
    }

    // Helper methods

    public function isAssigned(): bool
    {
        return $this->status === self::STATUS_ASSIGNED;
    }

    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function isActive(): bool
    {
        return in_array($this->status, [self::STATUS_ASSIGNED, self::STATUS_IN_PROGRESS]);
    }

    /**
     * Start the picking task
     */
    public function start(): bool
    {
        if ($this->status !== self::STATUS_ASSIGNED) {
            return false;
        }

        $this->status = self::STATUS_IN_PROGRESS;
        $this->started_at = now();
        $saved = $this->save();

        if ($saved) {
            // Update shipping order status
            $this->shippingOrder->updateStatus(ShippingOrder::STATUS_PICKING);
        }

        return $saved;
    }

    /**
     * Complete the picking task
     */
    public function complete(): bool
    {
        if ($this->status !== self::STATUS_IN_PROGRESS) {
            return false;
        }

        $this->status = self::STATUS_COMPLETED;
        $this->completed_at = now();
        $saved = $this->save();

        if ($saved) {
            // Check if all items are picked in shipping order
            if ($this->shippingOrder->allItemsPicked()) {
                $this->shippingOrder->updateStatus(ShippingOrder::STATUS_READY_TO_SHIP);
            }
        }

        return $saved;
    }

    /**
     * Cancel the picking task
     */
    public function cancel(): bool
    {
        if (!$this->isActive()) {
            return false;
        }

        $this->status = self::STATUS_CANCELLED;
        $this->cancelled_at = now();
        return $this->save();
    }

    /**
     * Update progress
     */
    public function updateProgress(): void
    {
        $this->total_items = $this->items()->count();
        $this->picked_items = $this->items()
            ->whereIn('status', [PickingTaskItem::STATUS_COMPLETED, PickingTaskItem::STATUS_PARTIAL])
            ->count();
        $this->save();
    }

    /**
     * Get duration in minutes
     */
    public function getDurationMinutes(): ?int
    {
        if (!$this->started_at) {
            return null;
        }

        $endTime = $this->completed_at ?? now();
        return $this->started_at->diffInMinutes($endTime);
    }
}
