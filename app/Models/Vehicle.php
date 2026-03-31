<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'user_id',
        'location_id',
        'plate_number',
        'make',
        'model',
        'year',
        'color',
        'vehicle_type',
        'capacity',
        'fuel_type',
        'registration_number',
        'insurance_expiry_date',
        'traffic_insurance_expiry',
        'inspection_date',
        'exhaust_inspection_date',
        'is_active',
        'is_available',
        'image_path',
        'sold_at',
        'have_winter_tires',
        'have_summer_tires',
        'tire_type',
        'hgs_label_number',
        'license_serial_number',
        'status', // available, in_use, maintenance, retired
        'notes',
        'mileage',
        'sold_notes'
    ];

    protected $casts = [
        'year' => 'integer',
        'is_available' => 'boolean',
        'is_active' => 'boolean',
        'have_winter_tires' => 'boolean',
        'have_summer_tires' => 'boolean',
        'inspection_date' => 'date',
        'exhaust_inspection_date' => 'date',
        'insurance_expiry_date' => 'date',
        'traffic_insurance_expiry' => 'date',
        'mileage' => 'integer',
        'sold_at' => 'datetime',
    ];

    /**
     * Get the location this vehicle is assigned to
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Get all calendar events for this vehicle (reservations)
     */
    public function events(): HasMany
    {
        return $this->hasMany(CalendarEvent::class, 'resource_id')
            ->where('resource_type', 'vehicle');
    }

    /**
     * Get all shipments for this vehicle
     */
    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    /**
     * Get the current active shipment (in transit)
     */
    public function currentShipment()
    {
        return $this->hasOne(Shipment::class)
            ->where('status', 'in_transit')
            ->latest();
    }

    /**
     * Check if vehicle is available at a specific time
     */
    public function isAvailable(\DateTime $start, \DateTime $end): bool
    {
        if ($this->status !== 'available') {
            return false;
        }

        return !$this->events()
            ->where(function ($query) use ($start, $end) {
                $query->where(function ($q) use ($start, $end) {
                    $q->where('start_time', '<', $end->format('Y-m-d H:i:s'))
                        ->where('end_time', '>', $start->format('Y-m-d H:i:s'));
                });
            })
            ->exists();
    }

    /**
     * Get the full name display of the vehicle
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->brand} {$this->model} ({$this->plate_number})";
    }

    /**
     * Check if maintenance is due soon (based on inspection date)
     */
    public function isMaintenanceDueSoon(): bool
    {
        if (!$this->inspection_date) {
            return true; // No inspection date means maintenance is needed
        }

        // Check if inspection date has passed
        return now()->greaterThan($this->inspection_date);
    }

    /**
     * Check if insurance is expiring soon (within 30 days)
     */
    public function isInsuranceExpiringSoon(): bool
    {
        if (!$this->insurance_expiry_date) {
            return false;
        }

        $daysUntilExpiry = now()->diffInDays($this->insurance_expiry_date, false);
        return $daysUntilExpiry >= 0 && $daysUntilExpiry <= 30;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: Active vehicles only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Available vehicles only
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available')->where('is_available', true);
    }

    /**
     * Scope: By status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: By location
     */
    public function scopeByLocation($query, $locationId)
    {
        return $query->where('location_id', $locationId);
    }

    /**
     * Scope: Maintenance due soon (within 7 days)
     * Based on inspection_date - returns vehicles with no inspection or overdue inspection
     */
    public function scopeMaintenanceDueSoon($query)
    {
        return $query->where(function($q) {
            $q->whereNull('inspection_date')
              ->orWhereRaw('DATEDIFF(inspection_date, NOW()) < 0');
        });
    }

    /**
     * Scope: Insurance expiring soon (within 30 days)
     */
    public function scopeInsuranceExpiringSoon($query)
    {
        return $query->whereNotNull('insurance_expiry_date')
            ->whereRaw('DATEDIFF(insurance_expiry_date, NOW()) BETWEEN 0 AND 30');
    }

    /**
     * Get status text in Turkish
     */
    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'available' => 'Müsait',
            'in_use' => 'Kullanımda',
            'maintenance' => 'Bakımda',
            'retired' => 'Hizmet Dışı',
            default => 'Bilinmiyor'
        };
    }

    /**
     * Get vehicle type text in Turkish
     */
    public function getVehicleTypeTextAttribute(): string
    {
        return match($this->vehicle_type) {
            'car' => 'Otomobil',
            'van' => 'Hafif Ticari',
            'truck' => 'Kamyon',
            'motorcycle' => 'Motosiklet',
            'bus' => 'Otobüs',
            'trailer' => 'Römork',
            'other' => 'Diğer',
            default => 'Bilinmiyor'
        };
    }

    /**
     * Get fuel type text in Turkish
     */
    public function getFuelTypeTextAttribute(): string
    {
        return match($this->fuel_type) {
            'gasoline' => 'Benzin',
            'diesel' => 'Dizel',
            'electric' => 'Elektrik',
            'hybrid' => 'Hibrit',
            'lpg' => 'LPG',
            'cng' => 'CNG',
            default => 'Belirtilmemiş'
        };
    }
}
