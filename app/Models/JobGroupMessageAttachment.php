<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobGroupMessageAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_group_message_id',
        'filename',
        'original_name',
        'mime_type',
        'size',
        'path',
        'duration'
    ];

    protected $casts = [
        'size' => 'integer',
        'duration' => 'float',
    ];

    public function message(): BelongsTo
    {
        return $this->belongsTo(JobGroupMessage::class, 'job_group_message_id');
    }

    public function getUrlAttribute(): string
    {
        return asset($this->path);
    }

    public function getIsImageAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    public function getIsAudioAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'audio/');
    }

    public function getIsVideoAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'video/');
    }
}