<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierOfferItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_offer_id', 'purchase_request_item_id', 'inventory_item_id',
        'item_code', 'item_name', 'description',
        'quantity', 'unit', 'unit_price',
        'discount_percentage', 'discount_amount',
        'tax_percentage', 'tax_amount',
        'line_total',
        'manufacturer', 'brand', 'model',
        'delivery_days', 'technical_specs', 'notes'
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'discount_percentage' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_percentage' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'line_total' => 'decimal:2',
        'delivery_days' => 'integer',
    ];

    // Relationships
    public function supplierOffer(): BelongsTo
    {
        return $this->belongsTo(SupplierOffer::class);
    }

    public function purchaseRequestItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequestItem::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    // Accessors
    public function getFormattedUnitPriceAttribute(): string
    {
        return number_format($this->unit_price, 2);
    }

    public function getFormattedLineTotalAttribute(): string
    {
        return number_format($this->line_total, 2);
    }

    public function getSubtotalBeforeDiscountAttribute(): float
    {
        return $this->quantity * $this->unit_price;
    }

    // Methods
    public function calculateLineTotal(): float
    {
        $subtotal = $this->quantity * $this->unit_price;
        $afterDiscount = $subtotal - $this->discount_amount;
        return $afterDiscount + $this->tax_amount;
    }
}
