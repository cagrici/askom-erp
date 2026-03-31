<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesOrderItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'logo_id', 'logo_firm_no', 'logo_order_ref', 'logo_synced_at',
        'sales_order_id', 'product_id', 'unit_id', 'sort_order',
        'quantity', 'unit_price',
        'discount_rate1', 'discount_rate2', 'discount_rate3',
        'discount_percentage', 'discount_amount',
        'tax_rate', 'tax_amount', 'line_total',
        'pricing_currency', 'foreign_unit_price', 'foreign_line_total',
        'product_code', 'product_name', 'product_description', 'unit_of_measure',
        'requested_delivery_date', 'promised_delivery_date', 'actual_delivery_date',
        'delivered_quantity', 'shipped_quantity', 'reserved_quantity', 'remaining_quantity', 'status',
        'notes', 'special_instructions', 'custom_fields',
        'serial_numbers', 'lot_numbers', 'production_date', 'expiry_date',
        'corridor'
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'discount_rate1' => 'decimal:2',
        'discount_rate2' => 'decimal:2',
        'discount_rate3' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'line_total' => 'decimal:2',
        'foreign_unit_price' => 'decimal:4',
        'foreign_line_total' => 'decimal:2',
        'delivered_quantity' => 'decimal:3',
        'shipped_quantity' => 'decimal:3',
        'reserved_quantity' => 'decimal:3',
        'remaining_quantity' => 'decimal:3',
        'requested_delivery_date' => 'date:Y-m-d',
        'promised_delivery_date' => 'date:Y-m-d',
        'actual_delivery_date' => 'date:Y-m-d',
        'production_date' => 'date:Y-m-d',
        'expiry_date' => 'date:Y-m-d',
        'custom_fields' => 'array',
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_IN_PRODUCTION = 'in_production';
    const STATUS_READY = 'ready';
    const STATUS_SHIPPED = 'shipped';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_RETURNED = 'returned';

    /**
     * Get all possible statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_PENDING => 'Beklemede',
            self::STATUS_CONFIRMED => 'Onaylandı',
            self::STATUS_IN_PRODUCTION => 'Üretimde',
            self::STATUS_READY => 'Hazır',
            self::STATUS_SHIPPED => 'Sevk Edildi',
            self::STATUS_DELIVERED => 'Teslim Edildi',
            self::STATUS_CANCELLED => 'İptal Edildi',
            self::STATUS_RETURNED => 'İade Edildi',
        ];
    }

    /**
     * Boot method for automatic calculations
     */
    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($model) {
            $model->calculateLineTotals();
            $model->updateRemainingQuantity();
        });

        static::saved(function ($model) {
            // Update parent order totals when item is saved
            $model->salesOrder->calculateTotals();
        });

        static::deleted(function ($model) {
            // Update parent order totals when item is deleted
            $model->salesOrder->calculateTotals();
        });
    }

    /**
     * Relationships
     */
    
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function shippingOrderItems(): HasMany
    {
        return $this->hasMany(ShippingOrderItem::class);
    }

    /**
     * Scopes
     */
    
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
        return $query->whereIn('status', [
            self::STATUS_PENDING, 
            self::STATUS_CONFIRMED, 
            self::STATUS_IN_PRODUCTION
        ]);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_DELIVERED);
    }

    /**
     * Helper methods
     */
    
    public function getStatusLabelAttribute(): string
    {
        return self::getStatuses()[$this->status] ?? $this->status;
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_CONFIRMED]);
    }

    public function canBeCancelled(): bool
    {
        return !in_array($this->status, [self::STATUS_DELIVERED, self::STATUS_CANCELLED, self::STATUS_RETURNED]);
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_DELIVERED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function getCompletionPercentageAttribute(): float
    {
        if ($this->quantity <= 0) {
            return 0;
        }
        
        return round(($this->delivered_quantity / $this->quantity) * 100, 2);
    }

    public function isPartiallyDelivered(): bool
    {
        return $this->delivered_quantity > 0 && $this->delivered_quantity < $this->quantity;
    }

    public function isFullyDelivered(): bool
    {
        return $this->delivered_quantity >= $this->quantity;
    }

    /**
     * Calculate line totals based on quantity, price, discount, and tax
     */
    public function calculateLineTotals(): void
    {
        $subtotal = $this->quantity * $this->unit_price;

        // Kademeli iskonto: önce %d1, sonra %d2, sonra %d3
        $d1 = (float) ($this->discount_rate1 ?? 0);
        $d2 = (float) ($this->discount_rate2 ?? 0);
        $d3 = (float) ($this->discount_rate3 ?? 0);

        $afterD1 = $subtotal * (1 - $d1 / 100);
        $afterD2 = $afterD1 * (1 - $d2 / 100);
        $afterD3 = $afterD2 * (1 - $d3 / 100);

        $this->discount_amount = round($subtotal - $afterD3, 2);

        // KDV hesapla
        $this->tax_amount = round($afterD3 * ($this->tax_rate / 100), 2);

        // Toplam = iskontolu net + KDV
        $this->line_total = round($afterD3 + $this->tax_amount, 2);
    }

    /**
     * Update remaining quantity based on delivered quantity
     */
    public function updateRemainingQuantity(): void
    {
        $this->remaining_quantity = $this->quantity - $this->delivered_quantity;
        
        // Ensure remaining quantity doesn't go below zero
        if ($this->remaining_quantity < 0) {
            $this->remaining_quantity = 0;
        }
    }

    /**
     * Record a delivery for this item
     */
    public function recordDelivery(float $deliveredQty, ?string $notes = null): bool
    {
        if ($deliveredQty <= 0 || $deliveredQty > $this->remaining_quantity) {
            return false;
        }

        $this->delivered_quantity += $deliveredQty;
        $this->updateRemainingQuantity();

        // Update status based on delivery completion
        if ($this->isFullyDelivered()) {
            $this->status = self::STATUS_DELIVERED;
            $this->actual_delivery_date = now()->toDateString();
        } else {
            $this->status = self::STATUS_SHIPPED;
        }

        if ($notes) {
            $this->notes = ($this->notes ? $this->notes . "\n" : '') . 
                           "Delivery recorded: {$deliveredQty} units on " . now()->format('Y-m-d H:i') . 
                           ($notes ? " - {$notes}" : '');
        }

        return $this->save();
    }

    /**
     * Check stock availability for this item
     */
    public function checkStockAvailability(): array
    {
        $product = $this->product;
        
        if (!$product || !$product->track_inventory) {
            return [
                'available' => true,
                'current_stock' => null,
                'required' => $this->quantity,
                'shortage' => 0
            ];
        }

        $currentStock = $product->stock_quantity;
        $shortage = max(0, $this->quantity - $currentStock);
        
        return [
            'available' => $shortage == 0,
            'current_stock' => $currentStock,
            'required' => $this->quantity,
            'shortage' => $shortage
        ];
    }

    /**
     * Populate product details from the Product model
     */
    public function populateProductDetails(): void
    {
        $product = $this->product;
        
        if ($product) {
            $this->product_code = $product->code;
            $this->product_name = $product->name;
            $this->product_description = $product->short_description;
            $this->unit_of_measure = $product->sales_uom ?? $product->unit->symbol ?? null;
            
            // Set default price if not already set
            if (empty($this->unit_price)) {
                $this->unit_price = $product->sale_price;
            }
            
            // Set default tax rate if not already set
            if (empty($this->tax_rate)) {
                $this->tax_rate = $product->tax_rate;
            }
        }
    }

    /**
     * Get shippable quantity (not yet assigned to shipping orders)
     */
    public function getShippableQuantityAttribute(): float
    {
        $assignedQuantity = $this->shippingOrderItems()
            ->whereHas('shippingOrder', function ($query) {
                $query->whereNotIn('status', [ShippingOrder::STATUS_CANCELLED]);
            })
            ->sum('shipping_quantity');

        return max(0, $this->quantity - $assignedQuantity);
    }

    /**
     * Reserve stock for shipping
     */
    public function reserveStock(float $quantity): bool
    {
        $this->reserved_quantity = ($this->reserved_quantity ?? 0) + $quantity;
        return $this->save();
    }

    /**
     * Release reserved stock
     */
    public function releaseReservedStock(float $quantity): bool
    {
        $this->reserved_quantity = max(0, ($this->reserved_quantity ?? 0) - $quantity);
        return $this->save();
    }

    /**
     * Record shipped quantity
     */
    public function recordShippedQuantity(float $quantity): bool
    {
        $this->shipped_quantity = ($this->shipped_quantity ?? 0) + $quantity;

        // Release from reserved
        $this->reserved_quantity = max(0, ($this->reserved_quantity ?? 0) - $quantity);

        return $this->save();
    }

    /**
     * Check if item can be shipped
     */
    public function canBeShipped(): bool
    {
        return $this->shippable_quantity > 0 &&
               in_array($this->salesOrder->status, [
                   SalesOrder::STATUS_CONFIRMED,
                   SalesOrder::STATUS_IN_PRODUCTION,
                   SalesOrder::STATUS_READY_TO_SHIP
               ]);
    }
}