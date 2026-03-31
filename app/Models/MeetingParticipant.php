<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'user_id',
        'role',
        'response_status',
    ];

    const ROLES = [
        'organizer' => 'Düzenleyen',
        'attendee' => 'Katılımcı',
        'optional' => 'İsteğe Bağlı'
    ];

    const RESPONSE_STATUSES = [
        'pending' => 'Bekliyor',
        'accepted' => 'Kabul Etti',
        'declined' => 'Reddetti',
        'tentative' => 'Kararsız'
    ];

    /**
     * Get the meeting
     */
    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    /**
     * Get the user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get response status badge color
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->response_status) {
            'accepted' => 'success',
            'declined' => 'danger',
            'tentative' => 'warning',
            'pending' => 'secondary',
            default => 'secondary'
        };
    }

    /**
     * Get role badge color
     */
    public function getRoleColorAttribute(): string
    {
        return match($this->role) {
            'organizer' => 'primary',
            'attendee' => 'info',
            'optional' => 'secondary',
            default => 'info'
        };
    }

    /**
     * Scope for organizers
     */
    public function scopeOrganizers($query)
    {
        return $query->where('role', 'organizer');
    }

    /**
     * Scope for attendees
     */
    public function scopeAttendees($query)
    {
        return $query->where('role', 'attendee');
    }

    /**
     * Scope for accepted participants
     */
    public function scopeAccepted($query)
    {
        return $query->where('response_status', 'accepted');
    }

    /**
     * Scope for pending participants
     */
    public function scopePending($query)
    {
        return $query->where('response_status', 'pending');
    }
}