<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageGroupActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'message_group_id',
        'user_id',
        'action',
        'data',
        'description',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    // Action types
    const ACTION_STATUS_CHANGED = 'status_changed';
    const ACTION_ASSIGNED = 'assigned';
    const ACTION_PRIORITY_CHANGED = 'priority_changed';
    const ACTION_DUE_DATE_CHANGED = 'due_date_changed';
    const ACTION_CATEGORY_CHANGED = 'category_changed';
    const ACTION_COMPLETED = 'completed';
    const ACTION_REOPENED = 'reopened';
    const ACTION_COMMENT = 'comment';

    public function messageGroup(): BelongsTo
    {
        return $this->belongsTo(MessageGroup::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Helper to get human-readable action text
    public function getActionTextAttribute(): string
    {
        $userName = $this->user->name;
        
        return match($this->action) {
            self::ACTION_STATUS_CHANGED => "{$userName} durumu '{$this->data['old_status']}' → '{$this->data['new_status']}' olarak değiştirdi",
            self::ACTION_ASSIGNED => "{$userName} işi {$this->data['assigned_to_name']}'e atadı",
            self::ACTION_PRIORITY_CHANGED => "{$userName} önceliği '{$this->data['old_priority']}' → '{$this->data['new_priority']}' olarak değiştirdi",
            self::ACTION_DUE_DATE_CHANGED => "{$userName} bitiş tarihini güncelledi",
            self::ACTION_CATEGORY_CHANGED => "{$userName} kategoriyi değiştirdi",
            self::ACTION_COMPLETED => "{$userName} işi tamamlandı olarak işaretledi",
            self::ACTION_REOPENED => "{$userName} işi yeniden açtı",
            self::ACTION_COMMENT => "{$userName} yorum ekledi",
            default => "{$userName} {$this->action} işlemi yaptı"
        };
    }

    // Helper to get icon for action
    public function getActionIconAttribute(): string
    {
        return match($this->action) {
            self::ACTION_STATUS_CHANGED => 'ri-refresh-line',
            self::ACTION_ASSIGNED => 'ri-user-add-line',
            self::ACTION_PRIORITY_CHANGED => 'ri-flag-line',
            self::ACTION_DUE_DATE_CHANGED => 'ri-calendar-line',
            self::ACTION_CATEGORY_CHANGED => 'ri-folder-line',
            self::ACTION_COMPLETED => 'ri-checkbox-circle-line',
            self::ACTION_REOPENED => 'ri-refresh-line',
            self::ACTION_COMMENT => 'ri-chat-3-line',
            default => 'ri-information-line'
        };
    }
}