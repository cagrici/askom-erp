<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shipment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'shipment_number',
        'location_id',
        'vehicle_id',
        'driver_id',
        'current_account_id',
        'shipment_date',
        'planned_delivery_date',
        'actual_delivery_date',
        'departure_time',
        'arrival_time',
        'status',
        'priority',
        'origin_address',
        'origin_city',
        'origin_postal_code',
        'origin_latitude',
        'origin_longitude',
        'destination_name',
        'destination_address',
        'destination_city',
        'destination_postal_code',
        'destination_latitude',
        'destination_longitude',
        'destination_contact_name',
        'destination_contact_phone',
        'estimated_distance_km',
        'actual_distance_km',
        'estimated_duration_minutes',
        'actual_duration_minutes',
        'route_notes',
        'total_weight_kg',
        'total_volume_m3',
        'total_packages',
        'cargo_description',
        'requires_signature',
        'requires_refrigeration',
        'is_fragile',
        'estimated_cost',
        'actual_cost',
        'fuel_cost',
        'toll_cost',
        'other_costs',
        'currency',
        'current_latitude',
        'current_longitude',
        'last_location_update',
        'completion_percentage',
        'waybill_number',
        'reference_number',
        'special_instructions',
        'delivery_notes',
        'internal_notes',
        'customer_rating',
        'customer_feedback',
    ];

    protected $casts = [
        'shipment_date' => 'date',
        'planned_delivery_date' => 'date',
        'actual_delivery_date' => 'date',
        'last_location_update' => 'datetime',
        'requires_signature' => 'boolean',
        'requires_refrigeration' => 'boolean',
        'is_fragile' => 'boolean',
        'estimated_distance_km' => 'decimal:2',
        'actual_distance_km' => 'decimal:2',
        'total_weight_kg' => 'decimal:2',
        'total_volume_m3' => 'decimal:2',
        'estimated_cost' => 'decimal:2',
        'actual_cost' => 'decimal:2',
        'fuel_cost' => 'decimal:2',
        'toll_cost' => 'decimal:2',
        'other_costs' => 'decimal:2',
        'origin_latitude' => 'decimal:8',
        'origin_longitude' => 'decimal:8',
        'destination_latitude' => 'decimal:8',
        'destination_longitude' => 'decimal:8',
        'current_latitude' => 'decimal:8',
        'current_longitude' => 'decimal:8',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($shipment) {
            if (empty($shipment->shipment_number)) {
                $shipment->shipment_number = static::generateShipmentNumber();
            }
        });
    }

    /**
     * Generate unique shipment number
     */
    public static function generateShipmentNumber(): string
    {
        $prefix = 'SHP';
        $date = now()->format('Ym');

        $lastShipment = static::whereRaw("shipment_number LIKE '{$prefix}-{$date}-%'")
            ->orderBy('shipment_number', 'desc')
            ->first();

        if ($lastShipment) {
            $lastNumber = (int) substr($lastShipment->shipment_number, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return "{$prefix}-{$date}-{$newNumber}";
    }

    /**
     * Relationships
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function currentAccount(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ShipmentItem::class);
    }

    /**
     * Scopes
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeInTransit($query)
    {
        return $query->where('status', 'in_transit');
    }

    public function scopePlanned($query)
    {
        return $query->where('status', 'planned');
    }

    public function scopeDelivered($query)
    {
        return $query->where('status', 'delivered');
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeByVehicle($query, $vehicleId)
    {
        return $query->where('vehicle_id', $vehicleId);
    }

    public function scopeByDriver($query, $driverId)
    {
        return $query->where('driver_id', $driverId);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('shipment_date', [$startDate, $endDate]);
    }

    /**
     * Accessors
     */
    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'draft' => 'Taslak',
            'planned' => 'Planlandı',
            'in_transit' => 'Yolda',
            'delivered' => 'Teslim Edildi',
            'cancelled' => 'İptal',
            'delayed' => 'Gecikmiş',
            default => 'Bilinmiyor'
        };
    }

    public function getPriorityTextAttribute(): string
    {
        return match($this->priority) {
            'low' => 'Düşük',
            'normal' => 'Normal',
            'high' => 'Yüksek',
            'urgent' => 'Acil',
            default => 'Normal'
        };
    }

    public function getTotalCostAttribute(): float
    {
        return ($this->fuel_cost ?? 0) +
               ($this->toll_cost ?? 0) +
               ($this->other_costs ?? 0);
    }

    public function getIsDelayedAttribute(): bool
    {
        if (!$this->planned_delivery_date) {
            return false;
        }

        if ($this->status === 'delivered' && $this->actual_delivery_date) {
            return $this->actual_delivery_date->gt($this->planned_delivery_date);
        }

        return now()->toDateString() > $this->planned_delivery_date->toDateString()
               && $this->status !== 'delivered';
    }
}
