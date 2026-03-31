<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class Meeting extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'organizer_id',
        'room_id',
        'start_time',
        'end_time',
        'is_recurring',
        'recurrence_pattern',
        'recurrence_end_date',
        'meeting_type',
        'online_meeting_link',
        'status',
        'agenda',
        'notes',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'recurrence_end_date' => 'date',
        'is_recurring' => 'boolean',
    ];

    const MEETING_TYPES = [
        'in_person' => 'Yüz Yüze',
        'online' => 'Online',
        'hybrid' => 'Hibrit'
    ];

    const STATUSES = [
        'scheduled' => 'Planlanmış',
        'in_progress' => 'Devam Ediyor',
        'completed' => 'Tamamlandı',
        'cancelled' => 'İptal Edildi'
    ];

    const RECURRENCE_PATTERNS = [
        'daily' => 'Günlük',
        'weekly' => 'Haftalık',
        'monthly' => 'Aylık',
        'yearly' => 'Yıllık'
    ];

    /**
     * Get the organizer of the meeting
     */
    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    /**
     * Get the meeting room
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(MeetingRoom::class, 'room_id');
    }

    /**
     * Get the meeting participants
     */
    public function participants(): HasMany
    {
        return $this->hasMany(MeetingParticipant::class);
    }

    /**
     * Get the meeting documents
     */
    public function documents(): HasMany
    {
        return $this->hasMany(MeetingDocument::class);
    }

    /**
     * Ensure title is UTF-8 safe
     */
    public function getTitleAttribute($value): string
    {
        return $value ? mb_convert_encoding($value, 'UTF-8', 'UTF-8') : '';
    }

    /**
     * Ensure description is UTF-8 safe
     */
    public function getDescriptionAttribute($value): ?string
    {
        return $value ? mb_convert_encoding($value, 'UTF-8', 'UTF-8') : null;
    }

    /**
     * Ensure agenda is UTF-8 safe
     */
    public function getAgendaAttribute($value): ?string
    {
        return $value ? mb_convert_encoding($value, 'UTF-8', 'UTF-8') : null;
    }

    /**
     * Ensure notes is UTF-8 safe
     */
    public function getNotesAttribute($value): ?string
    {
        return $value ? mb_convert_encoding($value, 'UTF-8', 'UTF-8') : null;
    }

    /**
     * Get participants with accepted status
     */
    public function acceptedParticipants(): HasMany
    {
        return $this->hasMany(MeetingParticipant::class)->where('response_status', 'accepted');
    }

    /**
     * Get participants with pending status
     */
    public function pendingParticipants(): HasMany
    {
        return $this->hasMany(MeetingParticipant::class)->where('response_status', 'pending');
    }

    /**
     * Check if meeting is today
     */
    public function isTodayAttribute(): bool
    {
        return $this->start_time->isToday();
    }

    /**
     * Check if meeting is upcoming
     */
    public function isUpcomingAttribute(): bool
    {
        return $this->start_time->isFuture();
    }

    /**
     * Check if meeting is past
     */
    public function isPastAttribute(): bool
    {
        return $this->end_time->isPast();
    }

    /**
     * Get meeting duration in minutes
     */
    public function getDurationAttribute(): int
    {
        return $this->start_time->diffInMinutes($this->end_time);
    }

    /**
     * Get formatted duration
     */
    public function getFormattedDurationAttribute(): string
    {
        $minutes = $this->duration;
        if ($minutes < 60) {
            return $minutes . ' dakika';
        }
        
        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;
        
        if ($remainingMinutes > 0) {
            return $hours . ' saat ' . $remainingMinutes . ' dakika';
        }
        
        return $hours . ' saat';
    }

    /**
     * Get meeting status badge color
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'scheduled' => 'primary',
            'in_progress' => 'success',
            'completed' => 'secondary',
            'cancelled' => 'danger',
            default => 'primary'
        };
    }

    /**
     * Get meeting type badge color
     */
    public function getTypeColorAttribute(): string
    {
        return match($this->meeting_type) {
            'in_person' => 'info',
            'online' => 'warning',
            'hybrid' => 'success',
            default => 'info'
        };
    }

    /**
     * Scope for upcoming meetings
     */
    public function scopeUpcoming($query)
    {
        return $query->where('start_time', '>', now());
    }

    /**
     * Scope for today's meetings
     */
    public function scopeToday($query)
    {
        return $query->whereDate('start_time', today());
    }

    /**
     * Scope for this week's meetings
     */
    public function scopeThisWeek($query)
    {
        return $query->whereBetween('start_time', [
            now()->startOfWeek(),
            now()->endOfWeek()
        ]);
    }

    /**
     * Scope for meetings by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for meetings by organizer
     */
    public function scopeByOrganizer($query, $organizerId)
    {
        return $query->where('organizer_id', $organizerId);
    }

    /**
     * Scope for meetings in a specific room
     */
    public function scopeInRoom($query, $roomId)
    {
        return $query->where('room_id', $roomId);
    }
}