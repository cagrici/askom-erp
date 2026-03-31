<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesOrderStatusHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_order_id', 'previous_status', 'new_status',
        'changed_by_id', 'changed_at', 'notes', 'reason', 'metadata'
    ];

    protected $casts = [
        'changed_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Relationships
     */
    
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_id');
    }

    /**
     * Scopes
     */
    
    public function scopeByOrder($query, $orderId)
    {
        return $query->where('sales_order_id', $orderId);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('new_status', $status);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('changed_by_id', $userId);
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('changed_at', '>=', now()->subDays($days));
    }

    /**
     * Helper methods
     */
    
    public function getPreviousStatusLabelAttribute(): ?string
    {
        if (!$this->previous_status) {
            return null;
        }
        
        return SalesOrder::getStatuses()[$this->previous_status] ?? $this->previous_status;
    }

    public function getNewStatusLabelAttribute(): string
    {
        return SalesOrder::getStatuses()[$this->new_status] ?? $this->new_status;
    }

    public function getFormattedChangeDateAttribute(): string
    {
        return $this->changed_at->format('d.m.Y H:i');
    }

    public function getTimeAgoAttribute(): string
    {
        return $this->changed_at->diffForHumans();
    }
}