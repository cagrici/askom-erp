<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Integration extends Model
{
    protected $fillable = [
        'name',
        'code',
        'type',
        'description',
        'is_active',
        'is_configured',
        'config',
        'sync_settings',
        'last_sync_at',
        'last_sync_status',
        'last_sync_message',
        'sync_count',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_configured' => 'boolean',
        'config' => 'encrypted:array',
        'sync_settings' => 'array',
        'last_sync_at' => 'datetime',
        'sync_count' => 'integer',
    ];

    /**
     * Get integration logs
     */
    public function logs(): HasMany
    {
        return $this->hasMany(IntegrationLog::class);
    }

    /**
     * Scope for active integrations
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope by type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Check if integration is ready to sync
     */
    public function isReadyToSync(): bool
    {
        return $this->is_active && $this->is_configured;
    }
}
