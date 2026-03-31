<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class ShippingOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'shipping_number',
        'sales_order_id',
        'created_by_id',
        'vehicle_id',
        'driver_id',
        'status',
        'priority',
        'requested_ship_date',
        'shipped_at',
        'delivered_at',
        'cancelled_at',
        'cancelled_by_id',
        'cancellation_reason',
        'total_items',
        'total_quantity',
        'total_weight',
        'total_volume',
        'logo_dispatch_id',
        'logo_dispatch_number',
        'logo_synced_at',
        'notes',
        'shipping_notes',
        'shipping_address',
    ];

    protected $casts = [
        'requested_ship_date' => 'date',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'logo_synced_at' => 'datetime',
        'total_quantity' => 'decimal:3',
        'total_weight' => 'decimal:3',
        'total_volume' => 'decimal:3',
        'shipping_address' => 'array',
    ];

    protected $appends = ['status_label', 'priority_label'];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_PICKING_ASSIGNED = 'picking_assigned';
    const STATUS_PICKING = 'picking';
    const STATUS_READY_TO_SHIP = 'ready_to_ship';
    const STATUS_SHIPPED = 'shipped';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_CANCELLED = 'cancelled';

    // Priority constants
    const PRIORITY_LOW = 'low';
    const PRIORITY_NORMAL = 'normal';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_URGENT = 'urgent';

    /**
     * Get all possible statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_PENDING => 'Beklemede',
            self::STATUS_PICKING_ASSIGNED => 'Toplama Atandı',
            self::STATUS_PICKING => 'Toplanıyor',
            self::STATUS_READY_TO_SHIP => 'Sevke Hazır',
            self::STATUS_SHIPPED => 'Sevk Edildi',
            self::STATUS_DELIVERED => 'Teslim Edildi',
            self::STATUS_CANCELLED => 'İptal Edildi',
        ];
    }

    /**
     * Get all possible priorities
     */
    public static function getPriorities(): array
    {
        return [
            self::PRIORITY_LOW => 'Düşük',
            self::PRIORITY_NORMAL => 'Normal',
            self::PRIORITY_HIGH => 'Yüksek',
            self::PRIORITY_URGENT => 'Acil',
        ];
    }

    /**
     * Generate next shipping number
     */
    public static function generateShippingNumber(): string
    {
        $year = Carbon::now()->year;
        $prefix = "SH-{$year}-";

        $lastOrder = self::where('shipping_number', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->first();

        if ($lastOrder) {
            $lastNumber = intval(str_replace($prefix, '', $lastOrder->shipping_number));
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
            if (empty($model->shipping_number)) {
                $model->shipping_number = self::generateShippingNumber();
            }
        });
    }

    // Relationships

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ShippingOrderItem::class);
    }

    public function pickingTasks(): HasMany
    {
        return $this->hasMany(PickingTask::class);
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

    public function scopeInWarehouse($query)
    {
        return $query->whereIn('status', [
            self::STATUS_PENDING,
            self::STATUS_PICKING_ASSIGNED,
            self::STATUS_PICKING,
            self::STATUS_READY_TO_SHIP,
        ]);
    }

    public function scopeReadyToShip($query)
    {
        return $query->where('status', self::STATUS_READY_TO_SHIP);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    // Attribute accessors

    public function getStatusLabelAttribute(): string
    {
        return self::getStatuses()[$this->status] ?? $this->status;
    }

    public function getPriorityLabelAttribute(): string
    {
        return self::getPriorities()[$this->priority] ?? $this->priority;
    }

    // Helper methods

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isPicking(): bool
    {
        return in_array($this->status, [self::STATUS_PICKING_ASSIGNED, self::STATUS_PICKING]);
    }

    public function isReadyToShip(): bool
    {
        return $this->status === self::STATUS_READY_TO_SHIP;
    }

    public function isShipped(): bool
    {
        return $this->status === self::STATUS_SHIPPED;
    }

    public function isDelivered(): bool
    {
        return $this->status === self::STATUS_DELIVERED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function canBeCancelled(): bool
    {
        return !in_array($this->status, [
            self::STATUS_SHIPPED,
            self::STATUS_DELIVERED,
            self::STATUS_CANCELLED,
        ]);
    }

    public function canAssignPicking(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function canStartPicking(): bool
    {
        return $this->status === self::STATUS_PICKING_ASSIGNED;
    }

    public function canMarkReadyToShip(): bool
    {
        return $this->status === self::STATUS_PICKING;
    }

    public function canShip(): bool
    {
        return $this->status === self::STATUS_READY_TO_SHIP;
    }

    /**
     * Calculate totals from items
     */
    public function calculateTotals(): void
    {
        $this->total_items = $this->items()->count();
        $this->total_quantity = $this->items()->sum('shipping_quantity');
        $this->save();
    }

    /**
     * Update status
     */
    public function updateStatus(string $newStatus, ?string $notes = null): bool
    {
        $oldStatus = $this->status;

        if ($oldStatus === $newStatus) {
            return false;
        }

        // Update timestamps based on status
        switch ($newStatus) {
            case self::STATUS_SHIPPED:
                $this->shipped_at = now();
                break;
            case self::STATUS_DELIVERED:
                $this->delivered_at = now();
                break;
            case self::STATUS_CANCELLED:
                $this->cancelled_at = now();
                $this->cancelled_by_id = auth()->id();
                break;
        }

        if ($notes) {
            $this->shipping_notes = ($this->shipping_notes ? $this->shipping_notes . "\n" : '') . $notes;
        }

        $this->status = $newStatus;
        return $this->save();
    }

    /**
     * Get active picking task
     */
    public function getActivePickingTask(): ?PickingTask
    {
        return $this->pickingTasks()
            ->whereIn('status', [PickingTask::STATUS_ASSIGNED, PickingTask::STATUS_IN_PROGRESS])
            ->first();
    }

    /**
     * Check if all items are picked
     */
    public function allItemsPicked(): bool
    {
        return $this->items()
            ->where('status', '!=', ShippingOrderItem::STATUS_PICKED)
            ->doesntExist();
    }
}
