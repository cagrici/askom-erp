<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class MeetingRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'location_id',
        'floor',
        'capacity',
        'has_video_conference',
        'has_projector',
        'has_whiteboard',
        'description',
        'image_path',
        'is_active',
        'approval_required',
    ];

    protected $casts = [
        'has_video_conference' => 'boolean',
        'has_projector' => 'boolean',
        'has_whiteboard' => 'boolean',
        'is_active' => 'boolean',
        'approval_required' => 'boolean',
    ];

    /**
     * Get the location that owns the meeting room
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Get the meetings for the room
     */
    public function meetings(): HasMany
    {
        return $this->hasMany(Meeting::class, 'room_id');
    }

    /**
     * Get active meetings (not cancelled)
     */
    public function activeMeetings(): HasMany
    {
        return $this->hasMany(Meeting::class, 'room_id')
            ->where('status', '!=', 'cancelled');
    }

    /**
     * Get future meetings
     */
    public function futureMeetings(): HasMany
    {
        return $this->hasMany(Meeting::class, 'room_id')
            ->where('start_time', '>', now())
            ->where('status', '!=', 'cancelled');
    }

    /**
     * Get meetings for a specific date range
     */
    public function meetingsInRange(Carbon $startDate, Carbon $endDate): HasMany
    {
        return $this->hasMany(Meeting::class, 'room_id')
            ->whereBetween('start_time', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled');
    }

    /**
     * Check if room is available for given time period
     */
    public function isAvailable(Carbon $startTime, Carbon $endTime, ?int $excludeMeetingId = null): bool
    {
        $query = $this->meetings()
            ->where('status', '!=', 'cancelled')
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where(function ($query) use ($startTime, $endTime) {
                    $query->where('start_time', '<', $endTime)
                        ->where('end_time', '>', $startTime);
                });
            });

        if ($excludeMeetingId) {
            $query->where('id', '!=', $excludeMeetingId);
        }

        return $query->count() === 0;
    }

    /**
     * Get conflicting meetings for given time period
     */
    public function getConflictingMeetings(Carbon $startTime, Carbon $endTime, ?int $excludeMeetingId = null)
    {
        $query = $this->meetings()
            ->with(['organizer'])
            ->where('status', '!=', 'cancelled')
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where(function ($query) use ($startTime, $endTime) {
                    $query->where('start_time', '<', $endTime)
                        ->where('end_time', '>', $startTime);
                });
            });

        if ($excludeMeetingId) {
            $query->where('id', '!=', $excludeMeetingId);
        }

        return $query->get();
    }

    /**
     * Get room facilities as array
     */
    public function getFacilities(): array
    {
        $facilities = [];
        
        if ($this->has_video_conference) {
            $facilities[] = [
                'name' => 'Video Konferans',
                'icon' => 'ri-video-line',
                'color' => 'primary'
            ];
        }
        
        if ($this->has_projector) {
            $facilities[] = [
                'name' => 'Projektör',
                'icon' => 'ri-projector-line',
                'color' => 'info'
            ];
        }
        
        if ($this->has_whiteboard) {
            $facilities[] = [
                'name' => 'Beyaz Tahta',
                'icon' => 'ri-edit-box-line',
                'color' => 'success'
            ];
        }

        return $facilities;
    }

    /**
     * Get room utilization percentage for a given date range
     */
    public function getUtilizationRate(Carbon $startDate, Carbon $endDate): float
    {
        $totalHours = $startDate->diffInHours($endDate);
        
        if ($totalHours === 0) {
            return 0;
        }

        $bookedHours = $this->meetings()
            ->where('status', '!=', 'cancelled')
            ->whereBetween('start_time', [$startDate, $endDate])
            ->get()
            ->sum(function ($meeting) {
                return $meeting->start_time->diffInHours($meeting->end_time);
            });

        return ($bookedHours / $totalHours) * 100;
    }

    /**
     * Get room capacity status badge color
     */
    public function getCapacityColorAttribute(): string
    {
        if ($this->capacity <= 4) {
            return 'info';
        } elseif ($this->capacity <= 10) {
            return 'primary';
        } elseif ($this->capacity <= 20) {
            return 'warning';
        } else {
            return 'success';
        }
    }

    /**
     * Get formatted capacity
     */
    public function getFormattedCapacityAttribute(): string
    {
        return $this->capacity . ' kişi';
    }

    /**
     * Scope for active rooms
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for rooms by location
     */
    public function scopeByLocation($query, $locationId)
    {
        return $query->where('location_id', $locationId);
    }

    /**
     * Scope for rooms with minimum capacity
     */
    public function scopeWithMinCapacity($query, int $minCapacity)
    {
        return $query->where('capacity', '>=', $minCapacity);
    }

    /**
     * Scope for rooms with specific facilities
     */
    public function scopeWithFacilities($query, array $facilities)
    {
        foreach ($facilities as $facility) {
            switch ($facility) {
                case 'video_conference':
                    $query->where('has_video_conference', true);
                    break;
                case 'projector':
                    $query->where('has_projector', true);
                    break;
                case 'whiteboard':
                    $query->where('has_whiteboard', true);
                    break;
            }
        }
        return $query;
    }

    /**
     * Get events for calendar display
     */
    public function events()
    {
        return $this->meetings()
            ->where('status', '!=', 'cancelled')
            ->with(['organizer']);
    }
}