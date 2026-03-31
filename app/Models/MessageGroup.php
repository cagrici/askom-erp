<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MessageGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'description',
        'department_id',
        'created_by',
        'is_active',
        'status',
        'priority',
        'assigned_to',
        'due_date',
        'completed_at',
        'completion_note',
        'category_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'due_date' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'message_group_participants')
            ->withPivot(['role', 'last_read_at', 'is_muted'])
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function latestMessage(): HasMany
    {
        return $this->messages()->latest()->limit(1);
    }

    public function unreadMessagesCount($userId): int
    {
        $participant = $this->participants()->where('user_id', $userId)->first();
        
        if (!$participant) {
            return 0;
        }

        return $this->messages()
            ->where('created_at', '>', $participant->pivot->last_read_at ?? '1970-01-01')
            ->where('user_id', '!=', $userId)
            ->count();
    }

    public function scopeForUser($query, $userId)
    {
        return $query->whereHas('participants', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        });
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(WorkCategory::class, 'category_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(MessageGroupActivity::class);
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeOverdue($query)
    {
        return $query->whereNotNull('due_date')
                    ->where('due_date', '<', now())
                    ->whereIn('status', ['open', 'in_progress']);
    }

    public function scopeAssignedTo($query, $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    // Helper methods
    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date->isPast() && !in_array($this->status, ['completed', 'cancelled']);
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'open' => 'info',
            'in_progress' => 'warning',
            'completed' => 'success',
            'cancelled' => 'secondary',
            default => 'secondary'
        };
    }

    public function getPriorityColorAttribute(): string
    {
        return match($this->priority) {
            'urgent' => 'danger',
            'high' => 'warning',
            'medium' => 'primary',
            'low' => 'secondary',
            default => 'secondary'
        };
    }

    // Activity logging
    public function logActivity(string $action, ?array $data = null, ?string $description = null): void
    {
        $this->activities()->create([
            'user_id' => auth()->id(),
            'action' => $action,
            'data' => $data,
            'description' => $description,
        ]);
    }
}