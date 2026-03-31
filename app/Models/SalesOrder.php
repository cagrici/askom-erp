<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class SalesOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'logo_id', 'logo_firm_no', 'logo_ficheno', 'logo_synced_at',
        'order_number', 'order_date', 'delivery_date', 'requested_delivery_date',
        'customer_id', 'salesperson_id', 'created_by_id',
        'status', 'shipping_status', 'total_shipped_quantity',
        'priority', 'payment_term_days', 'payment_method',
        'subtotal', 'tax_amount', 'discount_amount', 'shipping_cost', 'total_amount',
        'currency', 'exchange_rate', 'pricing_currency',
        'billing_address', 'shipping_address',
        'notes', 'internal_notes', 'terms_and_conditions', 'custom_fields',
        'reference_number', 'external_order_number',
        'confirmed_at', 'shipped_at', 'delivered_at', 'cancelled_at',
        'cancelled_by_id', 'cancellation_reason'
    ];

    protected $casts = [
        'order_date' => 'date:Y-m-d',
        'delivery_date' => 'date:Y-m-d',
        'requested_delivery_date' => 'date:Y-m-d',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'billing_address' => 'array',
        'shipping_address' => 'array',
        'custom_fields' => 'array',
        'confirmed_at' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    protected $appends = [
        'status_label',
        'priority_label',
        'payment_method_label'
    ];

    // Status constants
    const STATUS_DRAFT = 'draft';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_IN_PRODUCTION = 'in_production';
    const STATUS_READY_TO_SHIP = 'ready_to_ship';
    const STATUS_SHIPPED = 'shipped';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_RETURNED = 'returned';

    // Shipping status constants
    const SHIPPING_STATUS_NOT_READY = 'not_ready';
    const SHIPPING_STATUS_PENDING = 'pending';
    const SHIPPING_STATUS_PARTIALLY_SHIPPED = 'partially_shipped';
    const SHIPPING_STATUS_SHIPPED = 'shipped';
    const SHIPPING_STATUS_DELIVERED = 'delivered';

    // Priority constants
    const PRIORITY_LOW = 'low';
    const PRIORITY_NORMAL = 'normal';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_URGENT = 'urgent';

    // Payment method constants
    const PAYMENT_CASH = 'cash';
    const PAYMENT_BANK_TRANSFER = 'bank_transfer';
    const PAYMENT_CREDIT_CARD = 'credit_card';
    const PAYMENT_CHECK = 'check';
    const PAYMENT_OTHER = 'other';

    /**
     * Get all possible statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_DRAFT => 'Taslak',
            self::STATUS_CONFIRMED => 'Onaylandı',
            self::STATUS_IN_PRODUCTION => 'Üretimde',
            self::STATUS_READY_TO_SHIP => 'Sevke Hazır',
            self::STATUS_SHIPPED => 'Sevk Edildi',
            self::STATUS_DELIVERED => 'Teslim Edildi',
            self::STATUS_CANCELLED => 'İptal Edildi',
            self::STATUS_RETURNED => 'İade Edildi',
        ];
    }

    /**
     * Get all possible priorities
     */
    public static function getPriorities(): array
    {
        return [
            self::PRIORITY_LOW => 'Düşük',
            self::PRIORITY_NORMAL => 'Normal',
            self::PRIORITY_HIGH => 'Yüksek',
            self::PRIORITY_URGENT => 'Acil',
        ];
    }

    /**
     * Get all possible payment methods
     */
    public static function getPaymentMethods(): array
    {
        return [
            self::PAYMENT_CASH => 'Nakit',
            self::PAYMENT_BANK_TRANSFER => 'Banka Havalesi',
            self::PAYMENT_CREDIT_CARD => 'Kredi Kartı',
            self::PAYMENT_CHECK => 'Çek',
            self::PAYMENT_OTHER => 'Diğer',
        ];
    }

    /**
     * Generate next order number
     */
    public static function generateOrderNumber(): string
    {
        $year = Carbon::now()->year;
        $prefix = "SO-{$year}-";

        // En yüksek sipariş numarasını bul (silinmiş kayıtlar dahil - withTrashed)
        $lastOrder = self::withTrashed()
            ->where('order_number', 'like', $prefix . '%')
            ->orderByRaw("CAST(SUBSTRING(order_number, " . (strlen($prefix) + 1) . ") AS UNSIGNED) DESC")
            ->first();

        if ($lastOrder) {
            $lastNumber = intval(str_replace($prefix, '', $lastOrder->order_number));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        // Benzersizlik kontrolü - silinmiş kayıtlar dahil kontrol et
        $orderNumber = $prefix . str_pad($newNumber, 6, '0', STR_PAD_LEFT);
        while (self::withTrashed()->where('order_number', $orderNumber)->exists()) {
            $newNumber++;
            $orderNumber = $prefix . str_pad($newNumber, 6, '0', STR_PAD_LEFT);
        }

        return $orderNumber;
    }

    /**
     * Boot method to set order number automatically
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->order_number)) {
                $model->order_number = self::generateOrderNumber();
            }
            if (empty($model->order_date)) {
                $model->order_date = Carbon::now()->toDateString();
            }
        });
    }

    /**
     * Relationships
     */
    
    public function customer(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class, 'customer_id');
    }

    public function salesperson(): BelongsTo
    {
        return $this->belongsTo(SalesRepresentative::class, 'salesperson_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class)->orderBy('sort_order');
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(SalesOrderStatusHistory::class)->orderBy('changed_at', 'desc');
    }

    public function bulkDiscountHistory(): HasMany
    {
        return $this->hasMany(BulkDiscountHistory::class)->orderBy('created_at', 'desc');
    }

    public function returns(): HasMany
    {
        return $this->hasMany(SalesReturn::class)->orderBy('created_at', 'desc');
    }

    public function shippingOrders(): HasMany
    {
        return $this->hasMany(ShippingOrder::class)->orderBy('created_at', 'desc');
    }

    /**
     * Scopes
     */
    
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByCustomer($query, $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    public function scopeBySalesperson($query, $salespersonId)
    {
        return $query->where('salesperson_id', $salespersonId);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('order_date', [$startDate, $endDate]);
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', [self::STATUS_DRAFT, self::STATUS_CONFIRMED, self::STATUS_IN_PRODUCTION]);
    }

    public function scopeCompleted($query)
    {
        return $query->whereIn('status', [self::STATUS_DELIVERED]);
    }

    /**
     * Helper methods
     */
    
    public function getStatusLabelAttribute(): string
    {
        return self::getStatuses()[$this->status] ?? $this->status ?? '';
    }

    public function getPriorityLabelAttribute(): string
    {
        return self::getPriorities()[$this->priority] ?? $this->priority ?? '';
    }

    public function getPaymentMethodLabelAttribute(): string
    {
        return self::getPaymentMethods()[$this->payment_method] ?? $this->payment_method ?? '';
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_CONFIRMED]);
    }

    public function canBeCancelled(): bool
    {
        return !in_array($this->status, [self::STATUS_DELIVERED, self::STATUS_CANCELLED, self::STATUS_RETURNED]);
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isConfirmed(): bool
    {
        return $this->status === self::STATUS_CONFIRMED;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_DELIVERED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Calculate and update totals
     */
    public function calculateTotals(): void
    {
        $this->load('items');

        // Ham verilerden hesapla — line_total/tax_amount tutarsızlığından kaçınmak için
        $netSubtotal = $this->items->sum(function ($item) {
            $qty = (float) $item->quantity;
            $price = (float) $item->unit_price;
            $d1 = (float) ($item->discount_rate1 ?? 0);
            $d2 = (float) ($item->discount_rate2 ?? 0);
            $d3 = (float) ($item->discount_rate3 ?? 0);
            return $qty * $price * (1 - $d1 / 100) * (1 - $d2 / 100) * (1 - $d3 / 100);
        });

        $orderDiscount = (float) ($this->discount_amount ?? 0);
        $discountedNet = $netSubtotal - $orderDiscount;

        // KDV: iskontolu net tutar üzerinden her kalemin tax_rate'iyle oransal hesapla
        $taxAmount = $this->items->sum(function ($item) use ($netSubtotal, $orderDiscount) {
            $qty = (float) $item->quantity;
            $price = (float) $item->unit_price;
            $d1 = (float) ($item->discount_rate1 ?? 0);
            $d2 = (float) ($item->discount_rate2 ?? 0);
            $d3 = (float) ($item->discount_rate3 ?? 0);
            $taxRate = (float) ($item->tax_rate ?? 0);
            $lineNet = $qty * $price * (1 - $d1 / 100) * (1 - $d2 / 100) * (1 - $d3 / 100);

            // Sipariş iskontosu oransal olarak düşülür
            $discountRatio = ($netSubtotal > 0 && $orderDiscount > 0) ? (1 - $orderDiscount / $netSubtotal) : 1;
            return $lineNet * $discountRatio * ($taxRate / 100);
        });

        $this->subtotal = round($netSubtotal, 2);
        $this->tax_amount = round($taxAmount, 2);
        $this->total_amount = round($discountedNet + $taxAmount + (float) ($this->shipping_cost ?? 0), 2);
        $this->save();
    }

    /**
     * Update status with history tracking and inventory management
     */
    public function updateStatus(string $newStatus, ?string $notes = null, ?string $reason = null): bool
    {
        $oldStatus = $this->status;
        
        if ($oldStatus === $newStatus) {
            return false;
        }
        
        // Handle inventory movements based on status changes
        $inventoryService = app(\App\Services\InventoryService::class);
        
        // Reserve stock when order is confirmed
        if ($newStatus === self::STATUS_CONFIRMED && $oldStatus === self::STATUS_DRAFT) {
            $stockCheck = $inventoryService->checkStockAvailability($this);
            if (!$stockCheck['all_available']) {
                \Log::warning('Insufficient stock for order confirmation', [
                    'order_id' => $this->id,
                    'stock_check' => $stockCheck
                ]);
                // Still allow confirmation but log the issue
            }
            $inventoryService->reserveStock($this);
        }
        
        // Commit stock when order is shipped
        if ($newStatus === self::STATUS_SHIPPED && in_array($oldStatus, [self::STATUS_CONFIRMED, self::STATUS_IN_PRODUCTION, self::STATUS_READY_TO_SHIP])) {
            $inventoryService->commitStock($this);
        }
        
        // Handle stock return
        if ($newStatus === self::STATUS_RETURNED) {
            $inventoryService->returnStock($this);
        }
        
        // Release reserved stock when order is cancelled
        if ($newStatus === self::STATUS_CANCELLED && in_array($oldStatus, [self::STATUS_DRAFT, self::STATUS_CONFIRMED, self::STATUS_IN_PRODUCTION, self::STATUS_READY_TO_SHIP])) {
            $inventoryService->releaseStock($this);
        }
        
        // Record status change in history
        $this->statusHistory()->create([
            'previous_status' => $oldStatus,
            'new_status' => $newStatus,
            'changed_by_id' => auth()->id(),
            'changed_at' => now(),
            'notes' => $notes,
            'reason' => $reason,
        ]);
        
        // Update timestamps based on status
        switch ($newStatus) {
            case self::STATUS_CONFIRMED:
                $this->confirmed_at = now();
                break;
            case self::STATUS_SHIPPED:
                $this->shipped_at = now();
                break;
            case self::STATUS_DELIVERED:
                $this->delivered_at = now();
                break;
            case self::STATUS_CANCELLED:
                $this->cancelled_at = now();
                $this->cancelled_by_id = auth()->id();
                $this->cancellation_reason = $reason;
                break;
        }
        
        $this->status = $newStatus;
        return $this->save();
    }

    /**
     * Check stock availability for this order
     */
    public function checkStockAvailability(): array
    {
        $inventoryService = app(\App\Services\InventoryService::class);
        return $inventoryService->checkStockAvailability($this);
    }

    /**
     * Siparisi Logo'ya senkronize et
     */
    public function syncToLogo(int $firmNo = 1): array
    {
        $logoWriteService = app(\App\Services\LogoOrderWriteService::class);
        return $logoWriteService->syncOrderToLogo($this, $firmNo);
    }

    /**
     * Siparisi Logo'dan sil
     */
    public function deleteFromLogo(int $firmNo = 1): array
    {
        $logoWriteService = app(\App\Services\LogoOrderWriteService::class);
        return $logoWriteService->deleteOrderFromLogo($this, $firmNo);
    }

    /**
     * Logo'ya senkronize edilmis mi?
     */
    public function isSyncedToLogo(): bool
    {
        return $this->logo_id !== null;
    }

    /**
     * Logo senkronizasyonu gerekli mi?
     */
    public function needsLogoSync(): bool
    {
        // Logo ID yok veya son guncelleme senkronizasyondan sonra
        if (!$this->logo_id) {
            return true;
        }

        if (!$this->logo_synced_at) {
            return true;
        }

        return $this->updated_at > $this->logo_synced_at;
    }

    /**
     * Get shipping statuses
     */
    public static function getShippingStatuses(): array
    {
        return [
            self::SHIPPING_STATUS_NOT_READY => 'Sevke Hazır Değil',
            self::SHIPPING_STATUS_PENDING => 'Sevk Bekliyor',
            self::SHIPPING_STATUS_PARTIALLY_SHIPPED => 'Kısmi Sevk',
            self::SHIPPING_STATUS_SHIPPED => 'Tam Sevk',
            self::SHIPPING_STATUS_DELIVERED => 'Teslim Edildi',
        ];
    }

    /**
     * Get shipping status label
     */
    public function getShippingStatusLabelAttribute(): string
    {
        return self::getShippingStatuses()[$this->shipping_status] ?? $this->shipping_status ?? 'Belirsiz';
    }

    /**
     * Check if order can have shipping order created
     */
    public function canCreateShippingOrder(): bool
    {
        return in_array($this->status, [
            self::STATUS_CONFIRMED,
            self::STATUS_IN_PRODUCTION,
            self::STATUS_READY_TO_SHIP,
        ]) && $this->hasShippableItems();
    }

    /**
     * Check if order has items that can be shipped
     */
    public function hasShippableItems(): bool
    {
        return $this->items()->get()->contains(function ($item) {
            return $item->shippable_quantity > 0;
        });
    }

    /**
     * Update shipping status based on shipped quantities
     */
    public function updateShippingStatus(): void
    {
        $totalQuantity = $this->items()->sum('quantity');
        $shippedQuantity = $this->items()->sum('shipped_quantity');

        $this->total_shipped_quantity = $shippedQuantity;

        if ($shippedQuantity == 0) {
            // Check if there are any pending shipping orders
            $hasPendingShipping = $this->shippingOrders()
                ->whereNotIn('status', [ShippingOrder::STATUS_CANCELLED, ShippingOrder::STATUS_DELIVERED])
                ->exists();

            $this->shipping_status = $hasPendingShipping
                ? self::SHIPPING_STATUS_PENDING
                : self::SHIPPING_STATUS_NOT_READY;
        } elseif ($shippedQuantity >= $totalQuantity) {
            $this->shipping_status = self::SHIPPING_STATUS_SHIPPED;
        } else {
            $this->shipping_status = self::SHIPPING_STATUS_PARTIALLY_SHIPPED;
        }

        $this->save();
    }

    /**
     * Get active shipping orders
     */
    public function getActiveShippingOrders()
    {
        return $this->shippingOrders()
            ->whereNotIn('status', [ShippingOrder::STATUS_CANCELLED, ShippingOrder::STATUS_DELIVERED])
            ->get();
    }
}