<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CrmActivity extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'subject_type',
        'subject_id',
        'type',
        'title',
        'description',
        'activity_date',
        'end_date',
        'duration_minutes',
        'direction',
        'email_subject',
        'email_body',
        'outcome',
        'outcome_notes',
        'meeting_location',
        'meeting_address',
        'contact_id',
        'sales_offer_id',
        'performed_by',
        'created_by',
        'location_id',
    ];

    protected $casts = [
        'activity_date' => 'datetime',
        'end_date' => 'datetime',
        'duration_minutes' => 'integer',
    ];

    protected $appends = [
        'type_label',
        'type_icon',
    ];

    /**
     * Activity types
     */
    public const TYPE_CALL = 'call';
    public const TYPE_EMAIL = 'email';
    public const TYPE_MEETING = 'meeting';
    public const TYPE_NOTE = 'note';
    public const TYPE_SMS = 'sms';
    public const TYPE_VISIT = 'visit';
    public const TYPE_DEMO = 'demo';
    public const TYPE_OTHER = 'other';

    /**
     * Relationships
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(SalesOffer::class, 'sales_offer_id');
    }

    /**
     * Scopes
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeCalls($query)
    {
        return $query->where('type', self::TYPE_CALL);
    }

    public function scopeEmails($query)
    {
        return $query->where('type', self::TYPE_EMAIL);
    }

    public function scopeMeetings($query)
    {
        return $query->where('type', self::TYPE_MEETING);
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('activity_date', '>=', now()->subDays($days));
    }

    public function scopeUpcoming($query)
    {
        return $query->where('activity_date', '>', now());
    }

    public function scopePerformedBy($query, $userId)
    {
        return $query->where('performed_by', $userId);
    }

    /**
     * Accessors
     */
    public function getTypeLabelAttribute(): string
    {
        $labels = [
            'call' => 'Telefon',
            'email' => 'E-posta',
            'meeting' => 'Toplantı',
            'note' => 'Not',
            'sms' => 'SMS',
            'visit' => 'Ziyaret',
            'demo' => 'Demo',
            'other' => 'Diğer',
        ];
        return $labels[$this->type] ?? $this->type;
    }

    public function getTypeIconAttribute(): string
    {
        $icons = [
            'call' => 'ri-phone-line',
            'email' => 'ri-mail-line',
            'meeting' => 'ri-calendar-event-line',
            'note' => 'ri-sticky-note-line',
            'sms' => 'ri-message-2-line',
            'visit' => 'ri-building-line',
            'demo' => 'ri-presentation-line',
            'other' => 'ri-more-line',
        ];
        return $icons[$this->type] ?? 'ri-more-line';
    }

    public function getDirectionLabelAttribute(): ?string
    {
        if (!$this->direction) return null;

        $labels = [
            'inbound' => 'Gelen',
            'outbound' => 'Giden',
        ];
        return $labels[$this->direction] ?? $this->direction;
    }

    /**
     * Get all activity types
     */
    public static function getTypes(): array
    {
        return [
            self::TYPE_CALL => 'Telefon',
            self::TYPE_EMAIL => 'E-posta',
            self::TYPE_MEETING => 'Toplantı',
            self::TYPE_NOTE => 'Not',
            self::TYPE_SMS => 'SMS',
            self::TYPE_VISIT => 'Ziyaret',
            self::TYPE_DEMO => 'Demo',
            self::TYPE_OTHER => 'Diğer',
        ];
    }
}
