<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

class Driver extends User
{
    protected $table = 'users';
    
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'username',
        'email',
        'password',
        'avatar',
        'status',
        'active_entity_id',
        'department_id',
        'manager_id',
        'location_id',
        'position',
        'employee_id',
        'join_date',
        'birth_date',
        'address',
        'phone',
        'emergency_contact_name',
        'emergency_contact_phone',
        'is_admin',
        'is_driver',
        'license_number',
        'license_type',
        'license_expiry_date',
        'medical_report_status',
        'medical_report_expiry_date',
        'psikoteknik_report_status',
        'psikoteknik_report_expiry_date',
        'driver_notes',
        'is_active_driver',
        'last_login_at',
        'dark_mode',
        'compact_mode',
        'language',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'status' => 'boolean',
        'dark_mode' => 'boolean',
        'compact_mode' => 'boolean',
        'is_admin' => 'boolean',
        'is_driver' => 'boolean',
        'is_active_driver' => 'boolean',
        'join_date' => 'date',
        'birth_date' => 'date',
        'license_expiry_date' => 'date',
        'medical_report_expiry_date' => 'date',
        'psikoteknik_report_expiry_date' => 'date',
        'last_login_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::addGlobalScope('drivers', function (Builder $builder) {
            $builder->where('is_driver', true);
        });
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active_driver', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active_driver', false);
    }

    public function scopeWithExpiredLicense($query)
    {
        return $query->whereNotNull('license_expiry_date')
                     ->where('license_expiry_date', '<', now());
    }

    public function scopeWithExpiringLicense($query, $days = 30)
    {
        return $query->whereNotNull('license_expiry_date')
                     ->whereBetween('license_expiry_date', [now(), now()->addDays($days)]);
    }

    public function scopeWithExpiredMedicalReport($query)
    {
        return $query->whereNotNull('medical_report_expiry_date')
                     ->where('medical_report_expiry_date', '<', now());
    }

    public function scopeWithExpiringMedicalReport($query, $days = 30)
    {
        return $query->whereNotNull('medical_report_expiry_date')
                     ->whereBetween('medical_report_expiry_date', [now(), now()->addDays($days)]);
    }

    public function scopeWithExpiredPsikoteknik($query)
    {
        return $query->whereNotNull('psikoteknik_report_expiry_date')
                     ->where('psikoteknik_report_expiry_date', '<', now());
    }

    public function scopeWithExpiringPsikoteknik($query, $days = 30)
    {
        return $query->whereNotNull('psikoteknik_report_expiry_date')
                     ->whereBetween('psikoteknik_report_expiry_date', [now(), now()->addDays($days)]);
    }

    // Helper methods
    public function isLicenseExpired(): bool
    {
        return $this->license_expiry_date && $this->license_expiry_date->isPast();
    }

    public function isLicenseExpiring($days = 30): bool
    {
        return $this->license_expiry_date && 
               $this->license_expiry_date->between(now(), now()->addDays($days));
    }

    public function isMedicalReportExpired(): bool
    {
        return $this->medical_report_expiry_date && $this->medical_report_expiry_date->isPast();
    }

    public function isMedicalReportExpiring($days = 30): bool
    {
        return $this->medical_report_expiry_date && 
               $this->medical_report_expiry_date->between(now(), now()->addDays($days));
    }

    public function isPsikoteknikExpired(): bool
    {
        return $this->psikoteknik_report_expiry_date && $this->psikoteknik_report_expiry_date->isPast();
    }

    public function isPsikoteknikExpiring($days = 30): bool
    {
        return $this->psikoteknik_report_expiry_date && 
               $this->psikoteknik_report_expiry_date->between(now(), now()->addDays($days));
    }

    public function getDriverStatusAttribute(): string
    {
        if (!$this->is_active_driver) {
            return 'inactive';
        }

        if ($this->isLicenseExpired() || $this->isMedicalReportExpired() || $this->isPsikoteknikExpired()) {
            return 'expired';
        }

        if ($this->isLicenseExpiring() || $this->isMedicalReportExpiring() || $this->isPsikoteknikExpiring()) {
            return 'expiring';
        }

        return 'active';
    }

    // Relationships
    public function vehicleReservations()
    {
        return $this->hasMany(VehicleReservation::class, 'user_id');
    }

    public function assignedVehicles()
    {
        return $this->hasMany(Vehicle::class, 'assigned_driver_id');
    }
}