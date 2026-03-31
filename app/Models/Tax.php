<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tax extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'rate',
        'fixed_amount',
        'code',
        'description',
        'is_active',
        'is_default',
        'country',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'fixed_amount' => 'decimal:4',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
    ];

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCountry($query, $country = 'TR')
    {
        return $query->where('country', $country);
    }

    public function scopePercentage($query)
    {
        return $query->where('type', 'percentage');
    }

    public function scopeFixed($query)
    {
        return $query->where('type', 'fixed');
    }

    // Accessors
    public function getDisplayNameAttribute(): string
    {
        if ($this->type === 'percentage') {
            return "{$this->name} (%{$this->rate})";
        } else {
            return "{$this->name} ({$this->fixed_amount} {$this->country})";
        }
    }

    public function getFormattedRateAttribute(): string
    {
        return $this->type === 'percentage' ? "%{$this->rate}" : "{$this->fixed_amount}";
    }

    // Methods
    public function calculateTax($amount): float
    {
        if ($this->type === 'percentage') {
            return $amount * ($this->rate / 100);
        } else {
            return (float) $this->fixed_amount;
        }
    }
}
