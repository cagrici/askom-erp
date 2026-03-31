<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IntegrationLog extends Model
{
    protected $fillable = [
        'integration_id',
        'action',
        'entity_type',
        'status',
        'records_processed',
        'records_success',
        'records_failed',
        'message',
        'errors',
        'metadata',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'records_processed' => 'integer',
        'records_success' => 'integer',
        'records_failed' => 'integer',
        'errors' => 'array',
        'metadata' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the integration
     */
    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    /**
     * Scope for successful logs
     */
    public function scopeSuccess($query)
    {
        return $query->where('status', 'success');
    }

    /**
     * Scope for failed logs
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Get duration in seconds
     */
    public function getDurationAttribute(): ?int
    {
        if (!$this->started_at || !$this->completed_at) {
            return null;
        }

        return $this->completed_at->diffInSeconds($this->started_at);
    }

    /**
     * Get success rate percentage
     */
    public function getSuccessRateAttribute(): float
    {
        if ($this->records_processed === 0) {
            return 0;
        }

        return round(($this->records_success / $this->records_processed) * 100, 2);
    }
}
