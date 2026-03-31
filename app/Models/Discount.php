<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class Discount extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'type',
        'calculation_type',
        'discount_value',
        'min_purchase_amount',
        'max_discount_amount',
        'start_date',
        'end_date',
        'is_active',
        'quantity_tiers',
        'customer_ids',
        'customer_group_ids',
        'product_ids',
        'category_ids',
        'excluded_product_ids',
        'excluded_category_ids',
        'priority',
        'can_combine',
        'applies_to_discounted_products',
        'payment_method_ids',
        'requires_cash_payment',
        'min_quantity',
        'usage_limit',
        'usage_limit_per_customer',
        'usage_count',
        'show_on_invoice',
        'show_on_website',
        'auto_apply',
        'status',
        'notes',
        'application_count',
        'total_discount_given',
        'total_revenue',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean',
        'discount_value' => 'decimal:2',
        'min_purchase_amount' => 'decimal:2',
        'max_discount_amount' => 'decimal:2',
        'quantity_tiers' => 'array',
        'customer_ids' => 'array',
        'customer_group_ids' => 'array',
        'product_ids' => 'array',
        'category_ids' => 'array',
        'excluded_product_ids' => 'array',
        'excluded_category_ids' => 'array',
        'payment_method_ids' => 'array',
        'priority' => 'integer',
        'can_combine' => 'boolean',
        'applies_to_discounted_products' => 'boolean',
        'requires_cash_payment' => 'boolean',
        'usage_count' => 'integer',
        'application_count' => 'integer',
        'show_on_invoice' => 'boolean',
        'show_on_website' => 'boolean',
        'auto_apply' => 'boolean',
        'total_discount_given' => 'decimal:2',
        'total_revenue' => 'decimal:2',
    ];

    // Relationships
    public function usages(): HasMany
    {
        return $this->hasMany(DiscountUsage::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Accessors
    public function getTypeLabelAttribute(): string
    {
        return match($this->type) {
            'customer' => 'Müşteriye Özel',
            'product' => 'Ürüne Özel',
            'quantity' => 'Miktara Dayalı',
            'cash' => 'Nakit İskonto',
            'general' => 'Genel İskonto',
            'category' => 'Kategoriye Özel',
            default => $this->type,
        };
    }

    public function getCalculationTypeLabelAttribute(): string
    {
        return match($this->calculation_type) {
            'percentage' => 'Yüzde',
            'fixed_amount' => 'Sabit Tutar',
            default => $this->calculation_type,
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'draft' => 'Taslak',
            'active' => 'Aktif',
            'inactive' => 'Pasif',
            'expired' => 'Süresi Dolmuş',
            default => $this->status,
        };
    }

    public function getIsCurrentlyActiveAttribute(): bool
    {
        if (!$this->is_active || $this->status !== 'active') {
            return false;
        }

        $now = Carbon::now();

        if ($this->start_date && $this->start_date > $now) {
            return false;
        }

        if ($this->end_date && $this->end_date < $now) {
            return false;
        }

        return true;
    }

    public function getDaysRemainingAttribute(): ?int
    {
        if (!$this->end_date) {
            return null;
        }

        if ($this->end_date < Carbon::now()) {
            return 0;
        }

        return Carbon::now()->diffInDays($this->end_date);
    }

    public function getUsagePercentageAttribute(): float
    {
        if (!$this->usage_limit) {
            return 0;
        }
        return ($this->usage_count / $this->usage_limit) * 100;
    }

    // Scopes
    public function scopeActive($query)
    {
        $now = Carbon::now();
        return $query->where('is_active', true)
            ->where('status', 'active')
            ->where(function ($q) use ($now) {
                $q->whereNull('start_date')
                    ->orWhere('start_date', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', $now);
            });
    }

    public function scopeExpired($query)
    {
        return $query->where('end_date', '<', Carbon::now());
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeAutoApply($query)
    {
        return $query->where('auto_apply', true);
    }

    // Methods
    public function canBeUsed(): bool
    {
        if (!$this->is_currently_active) {
            return false;
        }

        if ($this->usage_limit && $this->usage_count >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    public function canBeUsedByCustomer($customerId): bool
    {
        if (!$this->canBeUsed()) {
            return false;
        }

        if ($this->usage_limit_per_customer) {
            $customerUsageCount = $this->usages()
                ->where('customer_id', $customerId)
                ->count();

            if ($customerUsageCount >= $this->usage_limit_per_customer) {
                return false;
            }
        }

        // Check if customer is in target
        if ($this->type === 'customer' && $this->customer_ids) {
            return in_array($customerId, $this->customer_ids);
        }

        return true;
    }

    public function calculateDiscount($amount, $quantity = null): float
    {
        // For quantity-based discounts
        if ($this->type === 'quantity' && $quantity && $this->quantity_tiers) {
            foreach ($this->quantity_tiers as $tier) {
                $minQty = $tier['min_qty'] ?? 0;
                $maxQty = $tier['max_qty'] ?? PHP_INT_MAX;

                if ($quantity >= $minQty && $quantity <= $maxQty) {
                    $tierDiscount = $tier['discount'] ?? 0;

                    if ($this->calculation_type === 'percentage') {
                        $discount = ($amount * $tierDiscount) / 100;
                    } else {
                        $discount = $tierDiscount;
                    }

                    if ($this->max_discount_amount && $discount > $this->max_discount_amount) {
                        return $this->max_discount_amount;
                    }

                    return $discount;
                }
            }
            return 0;
        }

        // For other discount types
        if ($this->calculation_type === 'percentage') {
            $discount = ($amount * $this->discount_value) / 100;
        } else {
            $discount = $this->discount_value;
        }

        if ($this->max_discount_amount && $discount > $this->max_discount_amount) {
            return $this->max_discount_amount;
        }

        return $discount;
    }

    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    public function incrementApplication(): void
    {
        $this->increment('application_count');
    }

    public function addRevenue($amount): void
    {
        $this->increment('total_revenue', $amount);
    }

    public function addDiscountGiven($amount): void
    {
        $this->increment('total_discount_given', $amount);
    }
}
