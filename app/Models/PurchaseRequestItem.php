<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseRequestItem extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'purchase_request_id',
        'product_id',
        'item_code',
        'item_name',
        'description',
        'specifications',
        'requested_quantity',
        'approved_quantity',
        'unit_id',
        'unit_name',
        'estimated_unit_price',
        'estimated_total_price',
        'currency',
        'preferred_supplier_id',
        'preferred_brand',
        'preferred_model',
        'status',
        'priority',
        'required_date',
        'notes',
        'budget_code',
        'gl_account',
        'custom_fields',
        'converted_quantity',
        'remaining_quantity',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'required_date' => 'date',
        'requested_quantity' => 'decimal:4',
        'approved_quantity' => 'decimal:4',
        'estimated_unit_price' => 'decimal:4',
        'estimated_total_price' => 'decimal:4',
        'converted_quantity' => 'decimal:4',
        'remaining_quantity' => 'decimal:4',
        'sort_order' => 'integer',
        'custom_fields' => 'array',
    ];

    // Relationships
    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function preferredSupplier(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class, 'preferred_supplier_id');
    }

    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeNotConverted($query)
    {
        return $query->where('remaining_quantity', '>', 0);
    }

    // Accessors & Mutators
    public function getStatusTextAttribute(): string
    {
        $statuses = [
            'pending' => 'Bekliyor',
            'approved' => 'Onaylandı',
            'rejected' => 'Reddedildi',
            'converted' => 'Dönüştürüldü',
            'partially_converted' => 'Kısmen Dönüştürüldü',
        ];

        return $statuses[$this->status] ?? $this->status;
    }

    public function getStatusBadgeColorAttribute(): string
    {
        $colors = [
            'pending' => 'warning',
            'approved' => 'success',
            'rejected' => 'danger',
            'converted' => 'info',
            'partially_converted' => 'primary',
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

    public function getFormattedEstimatedTotalPriceAttribute(): string
    {
        if (!$this->estimated_total_price) {
            return '-';
        }

        return number_format($this->estimated_total_price, 2) . ' ' . $this->currency;
    }

    public function getFormattedEstimatedUnitPriceAttribute(): string
    {
        if (!$this->estimated_unit_price) {
            return '-';
        }

        return number_format($this->estimated_unit_price, 2) . ' ' . $this->currency;
    }

    public function getConversionPercentageAttribute(): float
    {
        if ($this->requested_quantity == 0) {
            return 0;
        }

        return ($this->converted_quantity / $this->requested_quantity) * 100;
    }

    public function getIsFullyConvertedAttribute(): bool
    {
        return $this->remaining_quantity <= 0;
    }

    public function getIsPartiallyConvertedAttribute(): bool
    {
        return $this->converted_quantity > 0 && $this->remaining_quantity > 0;
    }

    // Business Logic Methods
    public function canBeConverted(): bool
    {
        return $this->status === 'approved' && $this->remaining_quantity > 0;
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, ['pending', 'rejected']) && 
               in_array($this->purchaseRequest->status, ['draft', 'rejected']);
    }

    public function approve($approvedQuantity = null): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        $this->update([
            'status' => 'approved',
            'approved_quantity' => $approvedQuantity ?? $this->requested_quantity,
        ]);

        return true;
    }

    public function reject(): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        $this->update([
            'status' => 'rejected',
            'approved_quantity' => 0,
        ]);

        return true;
    }

    public function convertQuantity($quantity): bool
    {
        if (!$this->canBeConverted() || $quantity > $this->remaining_quantity) {
            return false;
        }

        $newConvertedQuantity = $this->converted_quantity + $quantity;
        $newRemainingQuantity = $this->requested_quantity - $newConvertedQuantity;

        $this->update([
            'converted_quantity' => $newConvertedQuantity,
            'remaining_quantity' => $newRemainingQuantity,
            'status' => $newRemainingQuantity <= 0 ? 'converted' : 'partially_converted',
        ]);

        return true;
    }

    public function calculateEstimatedTotal(): void
    {
        if ($this->estimated_unit_price && $this->requested_quantity) {
            $this->update([
                'estimated_total_price' => $this->estimated_unit_price * $this->requested_quantity,
            ]);
        }
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->remaining_quantity) {
                $model->remaining_quantity = $model->requested_quantity;
            }
        });

        static::saved(function ($model) {
            // Update parent request total when item changes
            if ($model->purchaseRequest) {
                $model->purchaseRequest->calculateTotalAmount();
            }
        });
    }
}