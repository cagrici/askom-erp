<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockAdjustment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'adjustment_number',
        'title',
        'description',
        'adjustment_type',
        'status',
        'total_items',
        'total_value',
        'reason_code',
        'notes',
        'approved_by',
        'approved_at',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'total_items' => 'integer',
        'total_value' => 'decimal:2',
        'approved_at' => 'datetime',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'approved_by' => 'integer'
    ];

    // Boot method
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($adjustment) {
            if (empty($adjustment->adjustment_number)) {
                $adjustment->adjustment_number = self::generateAdjustmentNumber();
            }
            $adjustment->created_by = auth()->id();
        });

        static::updating(function ($adjustment) {
            $adjustment->updated_by = auth()->id();
        });
    }

    /**
     * Generate unique adjustment number
     */
    public static function generateAdjustmentNumber(): string
    {
        $prefix = 'ADJ';
        $date = now()->format('Ymd');
        $sequence = self::whereDate('created_at', today())->count() + 1;
        
        return $prefix . '-' . $date . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    // Relationships
    public function items(): HasMany
    {
        return $this->hasMany(StockAdjustmentItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
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

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('adjustment_type', $type);
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

    public function reject($userId = null): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        $this->update([
            'status' => 'rejected',
            'approved_by' => $userId ?? auth()->id(),
            'approved_at' => now()
        ]);

        return true;
    }

    public function complete(): bool
    {
        if ($this->status !== 'approved') {
            return false;
        }

        \DB::beginTransaction();

        try {
            // Process each adjustment item
            foreach ($this->items as $item) {
                $item->processAdjustment();
            }

            $this->update(['status' => 'completed']);

            \DB::commit();
            return true;

        } catch (\Exception $e) {
            \DB::rollBack();
            throw $e;
        }
    }

    // Attributes
    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Beklemede',
            'approved' => 'Onaylandı',
            'rejected' => 'Reddedildi',
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
            'rejected' => 'danger',
            'completed' => 'success',
            'cancelled' => 'secondary',
            default => 'secondary'
        };
    }

    public function getAdjustmentTypeTextAttribute(): string
    {
        return match($this->adjustment_type) {
            'increase' => 'Stok Artırma',
            'decrease' => 'Stok Azaltma',
            'count_adjustment' => 'Sayım Düzeltmesi',
            'damage' => 'Hasar/Zayi',
            'expiry' => 'Son Kullanma Tarihi',
            'transfer_correction' => 'Transfer Düzeltmesi',
            'other' => 'Diğer',
            default => $this->adjustment_type
        };
    }

    public function canBeApproved(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeRejected(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeCompleted(): bool
    {
        return $this->status === 'approved';
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, ['pending']);
    }

    public function canBeDeleted(): bool
    {
        return in_array($this->status, ['pending', 'rejected']);
    }
}