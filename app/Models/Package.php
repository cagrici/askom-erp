<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Package extends Model
{
    use HasFactory;

    protected $fillable = [
        'tracking_number',
        'courier_name',
        'package_type',
        'recipient_user_id',
        'received_by_user_id',
        'delivered_by_user_id',
        'location_id',
        'description',
        'received_at',
        'delivered_at',
        'status', // received, delivered, returned, lost
        'notes',
        'is_urgent',
        'is_fragile',
        'sender_name',
        'sender_company',
        'photo_path',
    ];

    protected $casts = [
        'received_at' => 'datetime',
        'delivered_at' => 'datetime',
        'is_urgent' => 'boolean',
        'is_fragile' => 'boolean',
    ];

    /**
     * Get the recipient user
     */
    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }

    /**
     * Get the user who received the package
     */
    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by_user_id');
    }

    /**
     * Get the user who delivered the package
     */
    public function deliveredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delivered_by_user_id');
    }

    /**
     * Get the location
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Mark the package as delivered
     */
    public function deliver(int $deliveredByUserId): void
    {
        $this->update([
            'status' => 'delivered',
            'delivered_at' => now(),
            'delivered_by_user_id' => $deliveredByUserId,
        ]);
    }

    /**
     * Mark the package as returned
     */
    public function markAsReturned(string $notes = null): void
    {
        $this->update([
            'status' => 'returned',
            'notes' => $notes ? $this->notes . "\n" . $notes : $this->notes,
        ]);
    }

    /**
     * Mark the package as lost
     */
    public function markAsLost(string $notes = null): void
    {
        $this->update([
            'status' => 'lost',
            'notes' => $notes ? $this->notes . "\n" . $notes : $this->notes,
        ]);
    }

    /**
     * Get the time in storage (not yet delivered)
     */
    public function getTimeInStorageAttribute(): ?string
    {
        if ($this->status === 'received' && $this->received_at) {
            $diff = now()->diff($this->received_at);
            
            if ($diff->days > 0) {
                return $diff->days . ' gün';
            } elseif ($diff->h > 0) {
                return $diff->h . ' saat';
            } else {
                return $diff->i . ' dakika';
            }
        }
        
        return null;
    }

    /**
     * Get the package age since reception
     */
    public function getAgeInDaysAttribute(): ?int
    {
        if ($this->received_at) {
            return now()->diffInDays($this->received_at);
        }
        
        return null;
    }
}
