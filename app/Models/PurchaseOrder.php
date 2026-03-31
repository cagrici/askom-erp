<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'title',
        'description',
        'status',
        'order_type',
        'purchase_request_id',
        'supplier_id',
        'location_id',
        'ordered_by',
        'approved_by',
        'order_date',
        'delivery_date',
        'approved_at',
        'total_amount',
        'currency',
        'exchange_rate',
        'terms_conditions',
        'delivery_terms',
        'notes',
        'reference_number',
        'is_urgent',
    ];

    protected $casts = [
        'order_date' => 'date',
        'delivery_date' => 'date',
        'approved_at' => 'datetime',
        'total_amount' => 'decimal:4',
        'exchange_rate' => 'decimal:6',
        'is_urgent' => 'boolean',
    ];

    // Relationships
    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class, 'supplier_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function orderedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ordered_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeBySupplier($query, $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    public function scopeByLocation($query, $locationId)
    {
        return $query->where('location_id', $locationId);
    }

    public function scopeUrgent($query)
    {
        return $query->where('is_urgent', true);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    // Accessors & Mutators
    public function getStatusTextAttribute(): string
    {
        $statuses = [
            'draft' => 'Taslak',
            'pending' => 'Bekliyor',
            'approved' => 'Onaylandı',
            'sent' => 'Gönderildi',
            'confirmed' => 'Onaylandı',
            'partially_received' => 'Kısmen Alındı',
            'received' => 'Alındı',
            'invoiced' => 'Faturalandı',
            'completed' => 'Tamamlandı',
            'cancelled' => 'İptal Edildi',
        ];

        return $statuses[$this->status] ?? $this->status;
    }

    public function getStatusBadgeColorAttribute(): string
    {
        $colors = [
            'draft' => 'secondary',
            'pending' => 'warning',
            'approved' => 'success',
            'sent' => 'info',
            'confirmed' => 'primary',
            'partially_received' => 'warning',
            'received' => 'success',
            'invoiced' => 'info',
            'completed' => 'success',
            'cancelled' => 'danger',
        ];

        return $colors[$this->status] ?? 'secondary';
    }

    public function getFormattedTotalAmountAttribute(): string
    {
        return number_format($this->total_amount, 2) . ' ' . $this->currency;
    }

    // Business Logic Methods
    public function canBeApproved(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeSent(): bool
    {
        return $this->status === 'approved';
    }

    public function canBeConfirmed(): bool
    {
        return $this->status === 'sent';
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['draft', 'pending', 'approved', 'sent']);
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, ['draft', 'pending']);
    }

    public function canBeDeleted(): bool
    {
        return $this->status === 'draft';
    }

    public function approve($approvedBy, $notes = null): bool
    {
        if (!$this->canBeApproved()) {
            return false;
        }

        $this->update([
            'status' => 'approved',
            'approved_by' => $approvedBy,
            'approved_at' => now(),
        ]);

        return true;
    }

    public function send(): bool
    {
        if (!$this->canBeSent()) {
            return false;
        }

        $this->update([
            'status' => 'sent',
        ]);

        return true;
    }

    public function confirm(): bool
    {
        if (!$this->canBeConfirmed()) {
            return false;
        }

        $this->update([
            'status' => 'confirmed',
        ]);

        return true;
    }

    public function cancel(): bool
    {
        if (!$this->canBeCancelled()) {
            return false;
        }

        $this->update([
            'status' => 'cancelled',
        ]);

        return true;
    }

    public function calculateTotalAmount(): void
    {
        $total = $this->items()->sum('net_price');
        
        $this->update([
            'total_amount' => $total,
        ]);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->order_number)) {
                $model->order_number = $model->generateOrderNumber();
            }
        });
    }

    private function generateOrderNumber(): string
    {
        $prefix = 'PO';
        $year = date('Y');
        $month = date('m');
        
        $lastOrder = static::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = $lastOrder ? (int)substr($lastOrder->order_number, -4) + 1 : 1;
        
        return sprintf('%s%s%s%04d', $prefix, $year, $month, $nextNumber);
    }
}