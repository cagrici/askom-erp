<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobGroupMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_group_id',
        'user_id',
        'content',
        'type',
        'parent_id',
        'mentions',
        'is_edited',
        'edited_at'
    ];

    protected $casts = [
        'is_edited' => 'boolean',
        'edited_at' => 'datetime',
        'mentions' => 'array',
    ];

    public function jobGroup(): BelongsTo
    {
        return $this->belongsTo(JobGroup::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(JobGroupMessage::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(JobGroupMessage::class, 'parent_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(JobGroupMessageAttachment::class);
    }
}