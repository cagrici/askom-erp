<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CurrentAccountDeliveryAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'current_account_id',
        'name',
        'contact_person',
        'contact_phone',
        'address',
        'country_id',
        'city_id',
        'district_id',
        'postal_code',
        'latitude',
        'longitude',
        'type',
        'is_default',
        'is_active',
        'delivery_notes',
        'delivery_hours'
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function currentAccount(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class);
    }


    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address,
            $this->district?->name,
            $this->city?->name,
            $this->postal_code
        ]);
        
        return implode(', ', $parts);
    }
}