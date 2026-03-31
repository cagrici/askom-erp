<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class Campaign extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'type',
        'target_type',
        'start_date',
        'end_date',
        'is_active',
        'discount_value',
        'min_purchase_amount',
        'max_discount_amount',
        'buy_quantity',
        'get_quantity',
        'usage_limit',
        'usage_limit_per_customer',
        'usage_count',
        'product_ids',
        'category_ids',
        'excluded_product_ids',
        'excluded_category_ids',
        'customer_ids',
        'customer_group_ids',
        'location_ids',
        'gift_product_id',
        'gift_quantity',
        'priority',
        'can_stack',
        'requires_coupon',
        'coupon_code',
        'show_on_website',
        'banner_image',
        'terms_conditions',
        'status',
        'notes',
        'view_count',
        'total_revenue',
        'total_discount_given',
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
        'usage_count' => 'integer',
        'product_ids' => 'array',
        'category_ids' => 'array',
        'excluded_product_ids' => 'array',
        'excluded_category_ids' => 'array',
        'customer_ids' => 'array',
        'customer_group_ids' => 'array',
        'location_ids' => 'array',
        'priority' => 'integer',
        'can_stack' => 'boolean',
        'requires_coupon' => 'boolean',
        'show_on_website' => 'boolean',
        'view_count' => 'integer',
        'total_revenue' => 'decimal:2',
        'total_discount_given' => 'decimal:2',
    ];

    // Relationships
    public function usages(): HasMany
    {
        return $this->hasMany(CampaignUsage::class);
    }

    public function giftProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'gift_product_id');
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
            'discount_percentage' => 'İndirim Yüzdesi',
            'discount_amount' => 'İndirim Tutarı',
            'buy_x_get_y' => 'X Al Y Öde',
            'free_shipping' => 'Ücretsiz Kargo',
            'bundle' => 'Paket Kampanya',
            'gift' => 'Hediye',
            'cashback' => 'Para İadesi',
            default => $this->type,
        };
    }

    public function getTargetTypeLabelAttribute(): string
    {
        return match($this->target_type) {
            'all' => 'Tüm Müşteriler',
            'customer' => 'Belirli Müşteri',
            'customer_group' => 'Müşteri Grubu',
            'new_customer' => 'Yeni Müşteriler',
            'location' => 'Belirli Lokasyon',
            default => $this->target_type,
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'draft' => 'Taslak',
            'scheduled' => 'Planlanmış',
            'active' => 'Aktif',
            'paused' => 'Duraklatılmış',
            'expired' => 'Süresi Dolmuş',
            'completed' => 'Tamamlanmış',
            default => $this->status,
        };
    }

    public function getIsCurrentlyActiveAttribute(): bool
    {
        $now = Carbon::now();
        return $this->is_active
            && $this->status === 'active'
            && $this->start_date <= $now
            && $this->end_date >= $now;
    }

    public function getDaysRemainingAttribute(): int
    {
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
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now);
    }

    public function scopeExpired($query)
    {
        return $query->where('end_date', '<', Carbon::now());
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled')
            ->where('start_date', '>', Carbon::now());
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeRequiresCoupon($query)
    {
        return $query->where('requires_coupon', true);
    }

    public function scopeWithCouponCode($query, $code)
    {
        return $query->where('coupon_code', $code);
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
        if ($this->target_type === 'customer' && $this->customer_ids) {
            return in_array($customerId, $this->customer_ids);
        }

        return true;
    }

    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    public function addRevenue($amount): void
    {
        $this->increment('total_revenue', $amount);
    }

    public function addDiscountGiven($amount): void
    {
        $this->increment('total_discount_given', $amount);
    }

    public function incrementViewCount(): void
    {
        $this->increment('view_count');
    }
}
