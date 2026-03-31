<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LocationType extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    /**
     * Get locations with this type.
     */
    public function locations(): HasMany
    {
        return $this->hasMany(Location::class, 'location_type_id');
    }

    /**
     * Get active location types.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
