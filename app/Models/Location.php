<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Location extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'location_type_id',
        'company_id',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'phone',
        'email',
        'website',
        'timezone',
        'latitude',
        'longitude',
        'is_headquarters',
        'is_active',
        'status',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'is_headquarters' => 'boolean',
        'status' => 'boolean',
    ];

    /**
     * Get the company that owns the location.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the departments at this location.
     */
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    /**
     * Get the users at this location.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the users associated with the location.
     */
    public function userLocations(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_location')
            ->withPivot('is_primary', 'is_admin')
            ->withTimestamps();
    }

    /**
     * Get only active locations.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function creator ()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function parent ()
    {
        return $this->belongsTo(Location::class, 'parent_id');
    }

    public function locationType ()
    {
        return $this->belongsTo(LocationType::class, 'location_type_id');
    }

    public function children ()
    {
        return $this->hasMany(Location::class, 'parent_id');
    }
}
