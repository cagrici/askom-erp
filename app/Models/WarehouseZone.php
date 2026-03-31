<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarehouseZone extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'warehouse_id', 'code', 'name', 'description', 'zone_type',
        'area', 'height', 'capacity', 'max_weight',
        'temperature_control', 'min_temperature', 'max_temperature',
        'climate_controlled', 'security_required', 'hazmat_approved',
        'access_restrictions', 'safety_requirements',
        'coordinates', 'floor_level', 'status',
        'created_by', 'updated_by'
    ];

    protected $casts = [
        'access_restrictions' => 'array',
        'safety_requirements' => 'array',
        'coordinates' => 'array',
        'area' => 'decimal:2',
        'height' => 'decimal:2',
        'max_weight' => 'decimal:2',
        'min_temperature' => 'decimal:2',
        'max_temperature' => 'decimal:2',
        'climate_controlled' => 'boolean',
        'security_required' => 'boolean',
        'hazmat_approved' => 'boolean',
    ];

    /**
     * Get warehouse
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get zone locations
     */
    public function locations(): HasMany
    {
        return $this->hasMany(WarehouseLocation::class, 'zone_id');
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
     * Scope for active zones
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for zones by type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('zone_type', $type);
    }

    /**
     * Get zone capacity utilization
     */
    public function getCapacityUtilizationAttribute()
    {
        $currentItems = $this->locations()->sum('current_items');
        return $this->capacity > 0 ? ($currentItems / $this->capacity) * 100 : 0;
    }

    /**
     * Get zone type text
     */
    public function getZoneTypeTextAttribute()
    {
        $types = [
            'receiving' => 'Teslim Alma',
            'storage' => 'Depolama',
            'picking' => 'Toplama',
            'packing' => 'Paketleme',
            'shipping' => 'Sevkiyat',
            'returns' => 'İadeler',
            'quarantine' => 'Karantina',
            'office' => 'Ofis',
            'maintenance' => 'Bakım',
            'staging' => 'Hazırlama'
        ];

        return $types[$this->zone_type] ?? $this->zone_type;
    }

    /**
     * Get temperature control text
     */
    public function getTemperatureControlTextAttribute()
    {
        $controls = [
            'none' => 'Yok',
            'ambient' => 'Oda Sıcaklığı',
            'refrigerated' => 'Soğutmalı',
            'frozen' => 'Dondurulmuş'
        ];

        return $controls[$this->temperature_control] ?? $this->temperature_control;
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
     * Check if zone requires special authorization
     */
    public function requiresAuthorization()
    {
        return $this->security_required || $this->hazmat_approved || !empty($this->access_restrictions);
    }

    /**
     * Get total locations in zone
     */
    public function getTotalLocationsAttribute()
    {
        return $this->locations()->count();
    }

    /**
     * Get occupied locations in zone
     */
    public function getOccupiedLocationsAttribute()
    {
        return $this->locations()->where('is_occupied', true)->count();
    }

    /**
     * Get available locations in zone
     */
    public function getAvailableLocationsAttribute()
    {
        return $this->locations()->where('is_occupied', false)->where('status', 'active')->count();
    }
}