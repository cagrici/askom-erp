<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseRequest extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'request_number',
        'title',
        'description',
        'status',
        'priority',
        'request_type',
        'location_id',
        'department_id',
        'requested_by',
        'approved_by',
        'requested_date',
        'required_date',
        'approved_at',
        'total_amount',
        'currency',
        'exchange_rate',
        'total_amount_base_currency',
        'approval_notes',
        'rejection_reason',
        'budget_code',
        'is_urgent',
        'requires_approval',
        'custom_fields',
    ];

    protected $casts = [
        'requested_date' => 'date',
        'required_date' => 'date',
        'approved_at' => 'datetime',
        'total_amount' => 'decimal:4',
        'exchange_rate' => 'decimal:6',
        'total_amount_base_currency' => 'decimal:4',
        'is_urgent' => 'boolean',
        'requires_approval' => 'boolean',
        'custom_fields' => 'array',
    ];

    // Relationships
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByLocation($query, $locationId)
    {
        return $query->where('location_id', $locationId);
    }

    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
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
            'rejected' => 'Reddedildi',
            'converted' => 'Dönüştürüldü',
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
            'rejected' => 'danger',
            'converted' => 'info',
            'cancelled' => 'dark',
        ];

        return $colors[$this->status] ?? 'secondary';
    }

    public function getPriorityTextAttribute(): string
    {
        $priorities = [
            'low' => 'Düşük',
            'medium' => 'Orta',
            'high' => 'Yüksek',
            'urgent' => 'Acil',
        ];

        return $priorities[$this->priority] ?? $this->priority;
    }

    public function getPriorityBadgeColorAttribute(): string
    {
        $colors = [
            'low' => 'success',
            'medium' => 'info',
            'high' => 'warning',
            'urgent' => 'danger',
        ];

        return $colors[$this->priority] ?? 'secondary';
    }

    public function getFormattedTotalAmountAttribute(): string
    {
        return number_format($this->total_amount, 2) . ' ' . $this->currency;
    }

    // Business Logic Methods
    public function canBeApproved(): bool
    {
        return $this->status === 'pending' && $this->requires_approval;
    }

    public function canBeRejected(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeConverted(): bool
    {
        return $this->status === 'approved' && $this->items()->exists();
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, ['draft', 'rejected']);
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
            'approval_notes' => $notes,
        ]);

        return true;
    }

    public function reject($rejectedBy, $reason = null): bool
    {
        if (!$this->canBeRejected()) {
            return false;
        }

        $this->update([
            'status' => 'rejected',
            'approved_by' => $rejectedBy,
            'approved_at' => now(),
            'rejection_reason' => $reason,
        ]);

        return true;
    }

    public function calculateTotalAmount(): void
    {
        $total = $this->items()->sum('estimated_total_price');
        
        $this->update([
            'total_amount' => $total,
            'total_amount_base_currency' => $total * $this->exchange_rate,
        ]);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->request_number)) {
                $model->request_number = $model->generateRequestNumber();
            }
        });
    }

    private function generateRequestNumber(): string
    {
        $prefix = 'PR';
        $year = date('Y');
        $month = date('m');
        
        $lastRequest = static::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = $lastRequest ? (int)substr($lastRequest->request_number, -4) + 1 : 1;
        
        return sprintf('%s%s%s%04d', $prefix, $year, $month, $nextNumber);
    }
}