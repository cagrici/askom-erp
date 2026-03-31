<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'message_id',
        'filename',
        'original_name',
        'mime_type',
        'size',
        'path',
        'duration',
    ];

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    public function getSizeForHumansAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    public function getIsImageAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    public function getIsAudioAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'audio/');
    }

    public function getFormattedDurationAttribute(): string
    {
        if (!$this->duration) return '0:00';
        
        $minutes = floor($this->duration / 60);
        $seconds = $this->duration % 60;
        return sprintf('%d:%02d', $minutes, $seconds);
    }
    
    public function getUrlAttribute(): string
    {
        // Check if path starts with uploads/ (new method) or messages/ (old method)
        if (str_starts_with($this->path, 'uploads/')) {
            $url = asset($this->path);
        } else {
            $url = asset('storage/' . $this->path);
        }
        
        // Add cache buster for audio files to prevent browser caching issues
        if ($this->getIsAudioAttribute()) {
            $url .= '?t=' . time();
        }
        
        return $url;
    }
}