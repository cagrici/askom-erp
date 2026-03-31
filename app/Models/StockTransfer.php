<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockTransfer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'transfer_number',
        'title',
        'description',
        'from_location_id',
        'to_location_id',
        'transfer_type',
        'status',
        'priority',
        'total_items',
        'total_value',
        'expected_date',
        'shipped_date',
        'received_date',
        'tracking_number',
        'carrier',
        'notes',
        'requested_by',
        'approved_by',
        'shipped_by',
        'received_by',
        'approved_at',
        'shipped_at',
        'received_at',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'total_items' => 'integer',
        'total_value' => 'decimal:2',
        'expected_date' => 'date',
        'shipped_date' => 'date',
        'received_date' => 'date',
        'approved_at' => 'datetime',
        'shipped_at' => 'datetime',
        'received_at' => 'datetime',
        'requested_by' => 'integer',
        'approved_by' => 'integer',
        'shipped_by' => 'integer',
        'received_by' => 'integer',
        'created_by' => 'integer',
        'updated_by' => 'integer'
    ];

    // Boot method
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transfer) {
            if (empty($transfer->transfer_number)) {
                $transfer->transfer_number = self::generateTransferNumber();
            }
            $transfer->created_by = auth()->id();
            $transfer->requested_by = auth()->id();
        });

        static::updating(function ($transfer) {
            $transfer->updated_by = auth()->id();
        });
    }

    /**
     * Generate unique transfer number
     */
    public static function generateTransferNumber(): string
    {
        $prefix = 'TRF';
        $date = now()->format('Ymd');
        $sequence = self::whereDate('created_at', today())->count() + 1;
        
        return $prefix . '-' . $date . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    // Relationships
    public function items(): HasMany
    {
        return $this->hasMany(StockTransferItem::class);
    }

    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'from_location_id');
    }

    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'to_location_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function shipper(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shipped_by');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeShipped($query)
    {
        return $query->where('status', 'shipped');
    }

    public function scopeReceived($query)
    {
        return $query->where('status', 'received');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('transfer_type', $type);
    }

    public function scopeFromLocation($query, $locationId)
    {
        return $query->where('from_location_id', $locationId);
    }

    public function scopeToLocation($query, $locationId)
    {
        return $query->where('to_location_id', $locationId);
    }

    // Methods
    public function approve($userId = null): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        $this->update([
            'status' => 'approved',
            'approved_by' => $userId ?? auth()->id(),
            'approved_at' => now()
        ]);

        return true;
    }

    public function ship($userId = null, $trackingNumber = null, $carrier = null): bool
    {
        if ($this->status !== 'approved') {
            return false;
        }

        $updateData = [
            'status' => 'shipped',
            'shipped_by' => $userId ?? auth()->id(),
            'shipped_at' => now(),
            'shipped_date' => now()->toDateString()
        ];

        if ($trackingNumber) {
            $updateData['tracking_number'] = $trackingNumber;
        }
        if ($carrier) {
            $updateData['carrier'] = $carrier;
        }

        $this->update($updateData);

        // Create outbound inventory movements
        $this->createOutboundMovements();

        return true;
    }

    public function receive($userId = null, $receivedItems = []): bool
    {
        if ($this->status !== 'shipped') {
            return false;
        }

        \DB::beginTransaction();

        try {
            $this->update([
                'status' => 'received',
                'received_by' => $userId ?? auth()->id(),
                'received_at' => now(),
                'received_date' => now()->toDateString()
            ]);

            // Create inbound inventory movements
            $this->createInboundMovements($receivedItems);

            // Check if all items are fully received
            $allReceived = $this->items()->where('received_quantity', '<', \DB::raw('transferred_quantity'))->count() === 0;
            
            if ($allReceived) {
                $this->update(['status' => 'completed']);
            }

            \DB::commit();
            return true;

        } catch (\Exception $e) {
            \DB::rollBack();
            throw $e;
        }
    }

    public function cancel($reason = null): bool
    {
        if (!in_array($this->status, ['pending', 'approved'])) {
            return false;
        }

        $this->update([
            'status' => 'cancelled',
            'notes' => $this->notes . "\n\nİptal edildi: " . ($reason ?: 'Sebep belirtilmedi')
        ]);

        return true;
    }

    /**
     * Create outbound inventory movements (from source location)
     */
    private function createOutboundMovements(): void
    {
        foreach ($this->items as $item) {
            InventoryMovement::create([
                'product_id' => $item->product_id,
                'product_unit_id' => $item->product_unit_id,
                'movement_type' => 'out',
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost,
                'total_cost' => $item->total_cost,
                'reference_type' => 'stock_transfer_out',
                'reference_id' => $this->id,
                'location_id' => $this->from_location_id,
                'notes' => "Transfer çıkışı: {$this->transfer_number} -> {$this->toLocation->name}",
                'created_by' => $this->shipped_by,
            ]);
        }
    }

    /**
     * Create inbound inventory movements (to destination location)
     */
    private function createInboundMovements($receivedItems = []): void
    {
        foreach ($this->items as $item) {
            $receivedQty = $receivedItems[$item->id]['received_quantity'] ?? $item->quantity;
            
            if ($receivedQty > 0) {
                InventoryMovement::create([
                    'product_id' => $item->product_id,
                    'product_unit_id' => $item->product_unit_id,
                    'movement_type' => 'in',
                    'quantity' => $receivedQty,
                    'unit_cost' => $item->unit_cost,
                    'total_cost' => $receivedQty * $item->unit_cost,
                    'reference_type' => 'stock_transfer_in',
                    'reference_id' => $this->id,
                    'location_id' => $this->to_location_id,
                    'notes' => "Transfer girişi: {$this->transfer_number} <- {$this->fromLocation->name}",
                    'created_by' => $this->received_by,
                ]);

                // Update received quantity
                $item->update(['received_quantity' => $receivedQty]);
            }
        }
    }

    // Attributes
    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Beklemede',
            'approved' => 'Onaylandı',
            'shipped' => 'Gönderildi',
            'received' => 'Teslim Alındı',
            'completed' => 'Tamamlandı',
            'cancelled' => 'İptal Edildi',
            default => $this->status
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'warning',
            'approved' => 'info',
            'shipped' => 'primary',
            'received' => 'success',
            'completed' => 'success',
            'cancelled' => 'danger',
            default => 'secondary'
        };
    }

    public function getTransferTypeTextAttribute(): string
    {
        return match($this->transfer_type) {
            'internal' => 'İç Transfer',
            'external' => 'Dış Transfer',
            'warehouse_to_store' => 'Depo → Mağaza',
            'store_to_warehouse' => 'Mağaza → Depo',
            'store_to_store' => 'Mağaza → Mağaza',
            'emergency' => 'Acil Transfer',
            'return' => 'İade Transfer',
            default => $this->transfer_type
        };
    }

    public function getPriorityTextAttribute(): string
    {
        return match($this->priority) {
            'low' => 'Düşük',
            'normal' => 'Normal',
            'high' => 'Yüksek',
            'urgent' => 'Acil',
            default => 'Normal'
        };
    }

    public function getPriorityColorAttribute(): string
    {
        return match($this->priority) {
            'low' => 'secondary',
            'normal' => 'primary',
            'high' => 'warning',
            'urgent' => 'danger',
            default => 'primary'
        };
    }

    // Status checks
    public function canBeApproved(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeShipped(): bool
    {
        return $this->status === 'approved';
    }

    public function canBeReceived(): bool
    {
        return $this->status === 'shipped';
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'approved']);
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, ['pending']);
    }

    public function canBeDeleted(): bool
    {
        return in_array($this->status, ['pending', 'cancelled']);
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isInTransit(): bool
    {
        return in_array($this->status, ['shipped', 'received']);
    }
}