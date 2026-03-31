<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CalendarEvent extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'event_type_id',
        'created_by',
        'start_time',
        'end_time',
        'all_day',
        'is_recurring',
        'recurrence_pattern',
        'recurrence_end_date',
        'location_id',
        'custom_location',
        'is_public',
        'department_id',
        'status',
        'meta_data',
        'meeting_id'
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'all_day' => 'boolean',
        'is_recurring' => 'boolean',
        'recurrence_end_date' => 'date',
        'is_public' => 'boolean',
        'meta_data' => 'array'
    ];

    public function eventType(): BelongsTo
    {
        return $this->belongsTo(CalendarEventType::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'calendar_event_participants')
            ->withPivot(['response_status', 'is_organizer', 'notes'])
            ->withTimestamps();
    }
}
