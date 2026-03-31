<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class WarehouseLocation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'warehouse_id', 'zone_id', 'code', 'barcode', 'name', 'description',
        'aisle', 'rack', 'shelf', 'bin', 'level', 'location_type',
        'length', 'width', 'height', 'volume', 'max_weight',
        'max_items', 'current_items', 'utilization_percentage',
        'multi_sku', 'pick_location', 'replenishment_location', 'is_checkdigit_enabled',
        'product_restrictions', 'size_restrictions', 'weight_restrictions',
        'pick_sequence', 'travel_time', 'cycle_count_required', 'last_cycle_count',
        'status', 'is_occupied', 'is_reserved', 'reserved_until', 'reserved_by',
        'temperature', 'humidity',
        'created_by', 'updated_by'
    ];

    protected $casts = [
        'product_restrictions' => 'array',
        'size_restrictions' => 'array',
        'weight_restrictions' => 'array',
        'length' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
        'volume' => 'decimal:3',
        'max_weight' => 'decimal:2',
        'utilization_percentage' => 'decimal:2',
        'travel_time' => 'decimal:2',
        'temperature' => 'decimal:2',
        'humidity' => 'decimal:2',
        'multi_sku' => 'boolean',
        'pick_location' => 'boolean',
        'replenishment_location' => 'boolean',
        'is_checkdigit_enabled' => 'boolean',
        'cycle_count_required' => 'boolean',
        'is_occupied' => 'boolean',
        'is_reserved' => 'boolean',
        'reserved_until' => 'datetime',
        'last_cycle_count' => 'date',
    ];

    /**
     * Get warehouse
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get zone
     */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(WarehouseZone::class, 'zone_id');
    }

    /**
     * Get reserved by user
     */
    public function reservedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reserved_by');
    }

    /**
     * Get creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get updater
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get inventory stocks in this location
     */
    public function inventoryStocks()
    {
        return $this->hasMany(\App\Models\InventoryStock::class, 'warehouse_location_id');
    }

    /**
     * Scope for active locations
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for available locations
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'active')
                    ->where('is_occupied', false)
                    ->where('is_reserved', false);
    }

    /**
     * Scope for pick locations
     */
    public function scopePickable($query)
    {
        return $query->where('pick_location', true)->where('status', 'active');
    }

    /**
     * Scope for locations by type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('location_type', $type);
    }

    /**
     * Get location type text
     */
    public function getLocationTypeTextAttribute()
    {
        $types = [
            'bin' => 'Kutu',
            'shelf' => 'Raf',
            'rack' => 'Askı',
            'floor' => 'Zemin',
            'bulk' => 'Büyük Alan',
            'pick_face' => 'Toplama Yüzü',
            'reserve' => 'Rezerv',
            'staging' => 'Hazırlama',
            'dock' => 'Rampa'
        ];

        return $types[$this->location_type] ?? $this->location_type;
    }

    /**
     * Get status text
     */
    public function getStatusTextAttribute()
    {
        $statuses = [
            'active' => 'Aktif',
            'inactive' => 'Pasif',
            'blocked' => 'Bloklu',
            'maintenance' => 'Bakımda',
            'damaged' => 'Hasar Görmüş'
        ];

        return $statuses[$this->status] ?? $this->status;
    }

    /**
     * Get status color for UI
     */
    public function getStatusColorAttribute()
    {
        $colors = [
            'active' => 'success',
            'inactive' => 'secondary',
            'blocked' => 'danger',
            'maintenance' => 'warning',
            'damaged' => 'danger'
        ];

        return $colors[$this->status] ?? 'secondary';
    }

    /**
     * Check if location is available for use
     */
    public function isAvailable()
    {
        return $this->status === 'active' && 
               !$this->is_occupied && 
               (!$this->is_reserved || ($this->reserved_until && Carbon::parse($this->reserved_until)->isPast()));
    }

    /**
     * Check if location can accommodate item
     */
    public function canAccommodate($quantity = 1, $weight = null, $volume = null)
    {
        if (!$this->isAvailable()) {
            return false;
        }

        // Check quantity capacity
        if (($this->current_items + $quantity) > $this->max_items) {
            return false;
        }

        // Check weight capacity
        if ($weight && $this->max_weight && $weight > $this->max_weight) {
            return false;
        }

        // Check volume capacity
        if ($volume && $this->volume && $volume > ($this->volume * (1 - $this->utilization_percentage / 100))) {
            return false;
        }

        return true;
    }

    /**
     * Reserve location for specific time
     */
    public function reserve($userId, $duration = 60)
    {
        if (!$this->isAvailable()) {
            return false;
        }

        $this->update([
            'is_reserved' => true,
            'reserved_by' => $userId,
            'reserved_until' => Carbon::now()->addMinutes($duration)
        ]);

        return true;
    }

    /**
     * Release reservation
     */
    public function releaseReservation()
    {
        $this->update([
            'is_reserved' => false,
            'reserved_by' => null,
            'reserved_until' => null
        ]);
    }

    /**
     * Mark location as occupied
     */
    public function occupy($quantity = 1)
    {
        $this->increment('current_items', $quantity);
        $this->update([
            'is_occupied' => true,
            'utilization_percentage' => ($this->current_items / $this->max_items) * 100
        ]);
    }

    /**
     * Mark location as vacant
     */
    public function vacate($quantity = null)
    {
        $quantity = $quantity ?? $this->current_items;
        $this->decrement('current_items', $quantity);
        
        $this->update([
            'is_occupied' => $this->current_items > 0,
            'utilization_percentage' => $this->max_items > 0 ? ($this->current_items / $this->max_items) * 100 : 0
        ]);
    }

    /**
     * Get full location code (including aisle, rack, shelf)
     */
    public function getFullCodeAttribute()
    {
        $parts = array_filter([$this->aisle, $this->rack, $this->shelf, $this->bin]);
        return implode('-', $parts) ?: $this->code;
    }

    /**
     * Check if cycle count is due
     */
    public function isCycleCountDue()
    {
        if (!$this->cycle_count_required) {
            return false;
        }

        if (!$this->last_cycle_count) {
            return true;
        }

        // Check if 30 days have passed since last count
        return Carbon::parse($this->last_cycle_count)->addDays(30)->isPast();
    }

    /**
     * Generate location barcode
     */
    public function generateBarcode()
    {
        if (!$this->barcode) {
            $this->barcode = 'LOC' . str_pad($this->id, 8, '0', STR_PAD_LEFT);
            $this->save();
        }
        return $this->barcode;
    }
}