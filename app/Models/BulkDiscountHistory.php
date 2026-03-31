<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BulkDiscountHistory extends Model
{
    use HasFactory;

    protected $table = 'bulk_discount_history';

    protected $fillable = [
        'sales_order_id',
        'applied_by_user_id',
        'discount_type',
        'discount_target',
        'discount_target_name',
        'discount_percentage',
        'items_affected',
        'total_discount_amount',
        'applied_items',
        'discount_rules',
        'notes'
    ];

    protected $casts = [
        'discount_percentage' => 'decimal:2',
        'total_discount_amount' => 'decimal:2',
        'applied_items' => 'array',
        'discount_rules' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Discount type constants
    const TYPE_CATEGORY = 'category';
    const TYPE_BRAND = 'brand';
    const TYPE_SUPPLIER = 'supplier';

    /**
     * Get all possible discount types
     */
    public static function getDiscountTypes(): array
    {
        return [
            self::TYPE_CATEGORY => 'Kategori',
            self::TYPE_BRAND => 'Marka',
            self::TYPE_SUPPLIER => 'Tedarikçi',
        ];
    }

    /**
     * Get the sales order this discount was applied to
     */
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    /**
     * Get the user who applied this discount
     */
    public function appliedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applied_by_user_id');
    }

    /**
     * Get the discount type label
     */
    public function getDiscountTypeLabelAttribute(): string
    {
        return self::getDiscountTypes()[$this->discount_type] ?? $this->discount_type;
    }

    /**
     * Get formatted discount percentage
     */
    public function getFormattedDiscountPercentageAttribute(): string
    {
        return '%' . number_format($this->discount_percentage, 2);
    }

    /**
     * Get formatted total discount amount
     */
    public function getFormattedTotalDiscountAmountAttribute(): string
    {
        return '₺' . number_format($this->total_discount_amount, 2);
    }

    /**
     * Scope to filter by sales order
     */
    public function scopeForSalesOrder($query, $salesOrderId)
    {
        return $query->where('sales_order_id', $salesOrderId);
    }

    /**
     * Scope to filter by discount type
     */
    public function scopeByDiscountType($query, $type)
    {
        return $query->where('discount_type', $type);
    }

    /**
     * Scope to filter by user
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('applied_by_user_id', $userId);
    }
}