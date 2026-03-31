<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'symbol',
        'type',
        'conversion_factor',
        'base_unit_id',
        'is_active',
        'sort_order',
        'description',
        'logo_unit_ref'
    ];

    protected $casts = [
        'conversion_factor' => 'decimal:4',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'base_unit_id');
    }

    public function derivedUnits(): HasMany
    {
        return $this->hasMany(Unit::class, 'base_unit_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Methods
    public function isBaseUnit(): bool
    {
        return is_null($this->base_unit_id);
    }

    public function getConversionText(): string
    {
        if ($this->isBaseUnit()) {
            return 'Temel birim';
        }

        return "1 {$this->symbol} = {$this->conversion_factor} {$this->baseUnit->symbol}";
    }
}
