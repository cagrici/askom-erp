<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class SalesReturn extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'return_no',
        'sales_order_id',
        'customer_id',
        'return_date',
        'status',
        'return_reason',
        'return_description',
        'total_amount',
        'refund_method',
        'approved_by_id',
        'approved_at',
        'rejected_by_id',
        'rejected_at',
        'rejection_reason',
        'driver_id',
        'pickup_date',
        'pickup_notes',
        'picked_up_at',
        'warehouse_notes',
        'processed_by_id',
        'processed_at',
        'created_by_id',
        'location_id',
    ];

    protected $casts = [
        'return_date' => 'date',
        'pickup_date' => 'date',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'picked_up_at' => 'datetime',
        'processed_at' => 'datetime',
        'total_amount' => 'decimal:2',
    ];

    protected $appends = [
        'status_label',
        'reason_label',
        'refund_method_label',
    ];

    // Status constants
    const STATUS_PENDING_APPROVAL = 'pending_approval';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    // Reason constants
    const REASON_DAMAGED = 'damaged';
    const REASON_WRONG_PRODUCT = 'wrong_product';
    const REASON_QUALITY_ISSUE = 'quality_issue';
    const REASON_EXPIRED = 'expired';
    const REASON_OTHER = 'other';

    // Refund method constants
    const REFUND_CREDIT_NOTE = 'credit_note';
    const REFUND_BANK_TRANSFER = 'bank_transfer';
    const REFUND_CASH = 'cash';
    const REFUND_REPLACEMENT = 'replacement';

    /**
     * Boot function for generating return number
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($return) {
            if (empty($return->return_no)) {
                $return->return_no = static::generateReturnNo();
            }
        });
    }

    /**
     * Generate unique return number
     */
    public static function generateReturnNo(): string
    {
        $year = date('Y');
        $prefix = 'IR-' . $year . '-';

        $lastReturn = static::where('return_no', 'like', $prefix . '%')
            ->orderBy('return_no', 'desc')
            ->first();

        if ($lastReturn) {
            $lastNumber = (int) substr($lastReturn->return_no, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return $prefix . $newNumber;
    }

    /**
     * Relationships
     */
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class, 'customer_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SalesReturnItem::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(SalesReturnImage::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Accessors
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PENDING_APPROVAL => 'Onay Bekliyor',
            self::STATUS_APPROVED => 'Onaylandı',
            self::STATUS_REJECTED => 'Reddedildi',
            self::STATUS_PROCESSING => 'İşleniyor',
            self::STATUS_COMPLETED => 'Tamamlandı',
            self::STATUS_CANCELLED => 'İptal Edildi',
            default => $this->status,
        };
    }

    public function getReasonLabelAttribute(): string
    {
        return match($this->return_reason) {
            self::REASON_DAMAGED => 'Hasarlı Ürün',
            self::REASON_WRONG_PRODUCT => 'Yanlış Ürün',
            self::REASON_QUALITY_ISSUE => 'Kalite Sorunu',
            self::REASON_EXPIRED => 'Son Kullanma Tarihi Geçmiş',
            self::REASON_OTHER => 'Diğer',
            default => $this->return_reason,
        };
    }

    public function getRefundMethodLabelAttribute(): ?string
    {
        if (!$this->refund_method) {
            return null;
        }

        return match($this->refund_method) {
            self::REFUND_CREDIT_NOTE => 'Kredi Notu',
            self::REFUND_BANK_TRANSFER => 'Banka Transferi',
            self::REFUND_CASH => 'Nakit',
            self::REFUND_REPLACEMENT => 'Ürün Değişimi',
            default => $this->refund_method,
        };
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING_APPROVAL);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Business logic methods
     */
    public function approve($userId, $refundMethod = null)
    {
        $this->update([
            'status' => self::STATUS_APPROVED,
            'approved_by_id' => $userId,
            'approved_at' => now(),
            'refund_method' => $refundMethod ?? $this->refund_method,
        ]);
    }

    public function reject($userId, $reason)
    {
        $this->update([
            'status' => self::STATUS_REJECTED,
            'rejected_by_id' => $userId,
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    public function assignDriver($driverId, $pickupDate)
    {
        $this->update([
            'driver_id' => $driverId,
            'pickup_date' => $pickupDate,
            'status' => self::STATUS_PROCESSING,
        ]);
    }

    public function markAsPickedUp($notes = null)
    {
        $this->update([
            'picked_up_at' => now(),
            'pickup_notes' => $notes,
        ]);
    }

    public function complete($userId, $warehouseNotes = null)
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'processed_by_id' => $userId,
            'processed_at' => now(),
            'warehouse_notes' => $warehouseNotes,
        ]);
    }

    public function calculateTotal()
    {
        $this->total_amount = $this->items()->sum('line_total');
        $this->save();
    }

    /**
     * Check if return can be approved
     */
    public function canBeApproved(): bool
    {
        return $this->status === self::STATUS_PENDING_APPROVAL;
    }

    /**
     * Check if return can be rejected
     */
    public function canBeRejected(): bool
    {
        return $this->status === self::STATUS_PENDING_APPROVAL;
    }

    /**
     * Check if return can be processed
     */
    public function canBeProcessed(): bool
    {
        return in_array($this->status, [self::STATUS_APPROVED, self::STATUS_PROCESSING]);
    }

    /**
     * Check if driver can be assigned
     */
    public function canAssignDriver(): bool
    {
        return $this->status === self::STATUS_APPROVED && !$this->driver_id;
    }

    /**
     * Static helper methods
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_PENDING_APPROVAL => 'Onay Bekliyor',
            self::STATUS_APPROVED => 'Onaylandı',
            self::STATUS_REJECTED => 'Reddedildi',
            self::STATUS_PROCESSING => 'İşleniyor',
            self::STATUS_COMPLETED => 'Tamamlandı',
            self::STATUS_CANCELLED => 'İptal Edildi',
        ];
    }

    public static function getReasons(): array
    {
        return [
            self::REASON_DAMAGED => 'Hasarlı Ürün',
            self::REASON_WRONG_PRODUCT => 'Yanlış Ürün',
            self::REASON_QUALITY_ISSUE => 'Kalite Sorunu',
            self::REASON_EXPIRED => 'Son Kullanma Tarihi Geçmiş',
            self::REASON_OTHER => 'Diğer',
        ];
    }

    public static function getRefundMethods(): array
    {
        return [
            self::REFUND_CREDIT_NOTE => 'Kredi Notu',
            self::REFUND_BANK_TRANSFER => 'Banka Transferi',
            self::REFUND_CASH => 'Nakit',
            self::REFUND_REPLACEMENT => 'Ürün Değişimi',
        ];
    }
}
