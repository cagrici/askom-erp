<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Warehouse extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'name', 'description', 'address', 'city', 'state', 'postal_code', 'country',
        'total_area', 'storage_area', 'office_area', 'height',
        'max_capacity', 'max_weight', 'max_volume',
        'warehouse_type', 'status', 'is_default',
        'phone', 'email', 'contact_person',
        'operating_hours', 'special_hours',
        'features', 'equipment', 'integration_settings',
        'latitude', 'longitude',
        'created_by', 'updated_by', 'manager_id'
    ];

    protected $casts = [
        'operating_hours' => 'array',
        'special_hours' => 'array',
        'features' => 'array',
        'equipment' => 'array',
        'integration_settings' => 'array',
        'total_area' => 'decimal:2',
        'storage_area' => 'decimal:2',
        'office_area' => 'decimal:2',
        'height' => 'decimal:2',
        'max_weight' => 'decimal:2',
        'max_volume' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'is_default' => 'boolean',
    ];

    /**
     * Get warehouse zones
     */
    public function zones(): HasMany
    {
        return $this->hasMany(WarehouseZone::class);
    }

    /**
     * Get warehouse locations
     */
    public function locations(): HasMany
    {
        return $this->hasMany(WarehouseLocation::class);
    }

    /**
     * Get warehouse operations
     */
    public function operations(): HasMany
    {
        return $this->hasMany(WarehouseOperation::class);
    }

    /**
     * Get warehouse staff
     */
    public function staff(): HasMany
    {
        return $this->hasMany(WarehouseStaff::class);
    }

    /**
     * Get warehouse inventory stocks
     */
    public function stocks(): HasMany
    {
        return $this->hasMany(InventoryStock::class);
    }

    /**
     * Get warehouse manager
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
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
     * Scope for active warehouses
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for warehouses by type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('warehouse_type', $type);
    }

    /**
     * Get warehouse capacity utilization
     */
    public function getCapacityUtilizationAttribute()
    {
        $currentItems = $this->locations()->sum('current_items');
        return $this->max_capacity > 0 ? ($currentItems / $this->max_capacity) * 100 : 0;
    }

    /**
     * Get total locations count
     */
    public function getTotalLocationsAttribute()
    {
        return $this->locations()->count();
    }

    /**
     * Get occupied locations count
     */
    public function getOccupiedLocationsAttribute()
    {
        return $this->locations()->where('is_occupied', true)->count();
    }

    /**
     * Get available locations count
     */
    public function getAvailableLocationsAttribute()
    {
        return $this->locations()->where('is_occupied', false)->where('status', 'active')->count();
    }

    /**
     * Check if warehouse is operational
     */
    public function isOperational()
    {
        return $this->status === 'active';
    }

    /**
     * Get warehouse type text
     */
    public function getWarehouseTypeTextAttribute()
    {
        $types = [
            'main' => 'Ana Depo',
            'regional' => 'Bölgesel Depo',
            'distribution' => 'Dağıtım Merkezi',
            'retail' => 'Perakende Depo',
            'production' => 'Üretim Deposu',
            'cross_dock' => 'Cross-Dock',
            'cold_storage' => 'Soğuk Hava Deposu',
            'hazardous' => 'Tehlikeli Madde Deposu'
        ];

        return $types[$this->warehouse_type] ?? $this->warehouse_type;
    }

    /**
     * Get status text
     */
    public function getStatusTextAttribute()
    {
        $statuses = [
            'active' => 'Aktif',
            'inactive' => 'Pasif',
            'maintenance' => 'Bakımda',
            'planned' => 'Planlanan'
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
            'maintenance' => 'warning',
            'planned' => 'info'
        ];

        return $colors[$this->status] ?? 'secondary';
    }

    /**
     * Generate unique warehouse code
     */
    public static function generateCode($prefix = 'WH')
    {
        $lastWarehouse = static::withTrashed()
            ->where('code', 'like', $prefix . '%')
            ->orderBy('code', 'desc')
            ->first();

        if ($lastWarehouse) {
            $lastNumber = (int) substr($lastWarehouse->code, strlen($prefix));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }
}