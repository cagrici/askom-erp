<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CrmTask extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'subject_type',
        'subject_id',
        'title',
        'description',
        'type',
        'priority',
        'status',
        'due_date',
        'reminder_date',
        'reminder_sent',
        'completed_at',
        'assigned_to',
        'completed_by',
        'completion_notes',
        'created_by',
        'location_id',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'reminder_date' => 'datetime',
        'completed_at' => 'datetime',
        'reminder_sent' => 'boolean',
    ];

    protected $appends = [
        'type_label',
        'priority_label',
        'status_label',
        'is_overdue',
    ];

    /**
     * Task statuses
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Relationships
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function completer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', self::STATUS_IN_PROGRESS);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeOpen($query)
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_IN_PROGRESS]);
    }

    public function scopeOverdue($query)
    {
        return $query->open()
            ->where('due_date', '<', now());
    }

    public function scopeDueToday($query)
    {
        return $query->open()
            ->whereDate('due_date', today());
    }

    public function scopeDueThisWeek($query)
    {
        return $query->open()
            ->whereBetween('due_date', [now(), now()->endOfWeek()]);
    }

    public function scopeAssignedTo($query, $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    public function scopeNeedsReminder($query)
    {
        return $query->open()
            ->where('reminder_sent', false)
            ->whereNotNull('reminder_date')
            ->where('reminder_date', '<=', now());
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
            'follow_up' => 'Takip',
            'proposal' => 'Teklif',
            'demo' => 'Demo',
            'visit' => 'Ziyaret',
            'other' => 'Diğer',
        ];
        return $labels[$this->type] ?? $this->type;
    }

    public function getPriorityLabelAttribute(): string
    {
        $labels = [
            'low' => 'Düşük',
            'medium' => 'Orta',
            'high' => 'Yüksek',
            'urgent' => 'Acil',
        ];
        return $labels[$this->priority] ?? $this->priority;
    }

    public function getStatusLabelAttribute(): string
    {
        $labels = [
            'pending' => 'Bekliyor',
            'in_progress' => 'Devam Ediyor',
            'completed' => 'Tamamlandı',
            'cancelled' => 'İptal Edildi',
        ];
        return $labels[$this->status] ?? $this->status;
    }

    public function getIsOverdueAttribute(): bool
    {
        if ($this->status === self::STATUS_COMPLETED || $this->status === self::STATUS_CANCELLED) {
            return false;
        }
        return $this->due_date < now();
    }

    /**
     * Mark task as completed
     */
    public function complete(?string $notes = null, ?int $completedBy = null): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => now(),
            'completed_by' => $completedBy ?? auth()->id(),
            'completion_notes' => $notes,
        ]);
    }

    /**
     * Mark task as cancelled
     */
    public function cancel(): void
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
        ]);
    }

    /**
     * Start working on task
     */
    public function start(): void
    {
        $this->update([
            'status' => self::STATUS_IN_PROGRESS,
        ]);
    }

    /**
     * Get all task types
     */
    public static function getTypes(): array
    {
        return [
            'call' => 'Telefon',
            'email' => 'E-posta',
            'meeting' => 'Toplantı',
            'follow_up' => 'Takip',
            'proposal' => 'Teklif',
            'demo' => 'Demo',
            'visit' => 'Ziyaret',
            'other' => 'Diğer',
        ];
    }

    /**
     * Get all priorities
     */
    public static function getPriorities(): array
    {
        return [
            'low' => 'Düşük',
            'medium' => 'Orta',
            'high' => 'Yüksek',
            'urgent' => 'Acil',
        ];
    }

    /**
     * Get all statuses
     */
    public static function getStatuses(): array
    {
        return [
            'pending' => 'Bekliyor',
            'in_progress' => 'Devam Ediyor',
            'completed' => 'Tamamlandı',
            'cancelled' => 'İptal Edildi',
        ];
    }
}
