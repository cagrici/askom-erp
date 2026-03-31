<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CalendarEventType extends Model
{
    protected $fillable = [
        'name',
        'color',
        'icon',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function calendarEvents(): HasMany
    {
        return $this->hasMany(CalendarEvent::class, 'event_type_id');
    }
}