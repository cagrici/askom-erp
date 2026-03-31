<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplierOffer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'offer_number', 'purchase_request_id', 'supplier_id', 'location_id',
        'offer_date', 'valid_until', 'status',
        'subtotal', 'tax_total', 'discount_total', 'total_amount',
        'currency', 'exchange_rate',
        'terms_conditions', 'payment_terms', 'delivery_terms', 'notes',
        'contact_person', 'contact_email', 'contact_phone',
        'requested_by', 'approved_by', 'approved_at', 'rejection_reason',
        'created_by', 'updated_by'
    ];

    protected $casts = [
        'offer_date' => 'date',
        'valid_until' => 'date',
        'approved_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'exchange_rate' => 'decimal:6',
    ];

    // Relationships
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class, 'supplier_id');
    }

    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SupplierOfferItem::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeValid($query)
    {
        return $query->where('valid_until', '>=', now());
    }

    public function scopeExpired($query)
    {
        return $query->where('valid_until', '<', now())->where('status', '!=', 'converted');
    }

    // Accessors
    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Beklemede',
            'approved' => 'Onaylandı',
            'rejected' => 'Reddedildi',
            'expired' => 'Süresi Doldu',
            'converted' => 'Siparişe Dönüştürüldü',
            default => $this->status
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'warning',
            'approved' => 'success',
            'rejected' => 'danger',
            'expired' => 'secondary',
            'converted' => 'info',
            default => 'secondary'
        };
    }

    public function getIsValidAttribute(): bool
    {
        return $this->valid_until >= now();
    }

    // Methods
    public static function generateOfferNumber(): string
    {
        $prefix = 'SO-' . date('Ym') . '-';
        $lastOffer = static::where('offer_number', 'like', $prefix . '%')
            ->orderBy('offer_number', 'desc')
            ->first();

        if ($lastOffer) {
            $lastNumber = (int) substr($lastOffer->offer_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($offer) {
            if (empty($offer->offer_number)) {
                $offer->offer_number = self::generateOfferNumber();
            }
        });
    }
}
