<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Models\Permission as SpatiePermission;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends SpatiePermission
{
    use HasFactory;

    protected $fillable = [
        'name',
        'guard_name',
        'slug',
        'description',
        'module',
        'display_name',
        'group',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];


    /**
     * The users that are directly assigned this permission.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('forbidden')
            ->withTimestamps();
    }

    /**
     * Scope a query to filter by module.
     */
    public function scopeByModule($query, $module)
    {
        return $query->where('module', $module);
    }

    /**
     * Get the module for this permission.
     */
    public function permissionModule()
    {
        return $this->belongsTo(PermissionModule::class, 'module', 'slug');
    }

    /**
     * Scope for active permissions.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for ordering permissions.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('module')->orderBy('order')->orderBy('name');
    }
}
