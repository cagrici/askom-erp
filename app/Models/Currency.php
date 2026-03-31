<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    protected $fillable = [
        'cur_code',
        'name',
        'cur_symbol',
        'description',
        'exchange_rate',
        'is_default',
        'decimal_places',
        'thousand_separator',
        'decimal_separator',
        'symbol_position',
        'last_updated_at',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'exchange_rate' => 'decimal:6',
        'decimal_places' => 'integer',
        'last_updated_at' => 'datetime',
    ];

    protected $appends = [
        'code',
        'symbol',
    ];

    /**
     * Scope for active currencies (null veya true olanlar)
     */
    public function scopeActive($query)
    {
        return $query->where(function($q) {
            $q->where('is_active', true)
              ->orWhereNull('is_active');
        });
    }

    /**
     * Get currency code
     */
    public function getCodeAttribute(): string
    {
        return $this->cur_code;
    }

    /**
     * Get currency symbol or code
     */
    public function getSymbolAttribute(): string
    {
        return $this->cur_symbol ?: $this->cur_code;
    }
}
