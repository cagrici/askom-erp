<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductPriceList extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'code', 'description', 'type', 'currency',
        'valid_from', 'valid_until', 'is_active', 'is_default',
        'customer_groups',
        'logo_id', 'logo_firm_no', 'logo_synced_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'customer_groups' => 'array',
        'valid_from' => 'date',
        'valid_until' => 'date',
        'logo_synced_at' => 'datetime'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($priceList) {
            if (empty($priceList->code)) {
                $priceList->code = 'PL-' . strtoupper(uniqid());
            }
        });
    }

    // Relationships
    public function prices(): HasMany
    {
        return $this->hasMany(ProductPrice::class, 'price_list_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeValid($query)
    {
        $now = now();
        
        return $query->where(function ($q) use ($now) {
            $q->whereNull('valid_from')
              ->orWhere('valid_from', '<=', $now);
        })->where(function ($q) use ($now) {
            $q->whereNull('valid_until')
              ->orWhere('valid_until', '>=', $now);
        });
    }

    // Methods
    public function isValidFor($date = null): bool
    {
        $date = $date ?: now();
        
        if ($this->valid_from && $date < $this->valid_from) {
            return false;
        }
        
        if ($this->valid_until && $date > $this->valid_until) {
            return false;
        }
        
        return $this->is_active;
    }

    public function appliesToCustomerGroup($groupId): bool
    {
        if (empty($this->customer_groups)) {
            return true; // Tüm gruplara uygulanır
        }
        
        return in_array($groupId, $this->customer_groups);
    }
}