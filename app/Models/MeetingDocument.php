<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MeetingDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'title',
        'description',
        'file_path',
        'file_type',
        'uploaded_by',
    ];

    /**
     * Get the meeting
     */
    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    /**
     * Get the user who uploaded the document
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get file size in human readable format
     */
    public function getFileSizeAttribute(): string
    {
        if (Storage::exists($this->file_path)) {
            $bytes = Storage::size($this->file_path);
            $units = ['B', 'KB', 'MB', 'GB'];
            
            for ($i = 0; $bytes > 1024; $i++) {
                $bytes /= 1024;
            }
            
            return round($bytes, 2) . ' ' . $units[$i];
        }
        
        return 'N/A';
    }

    /**
     * Get file extension
     */
    public function getFileExtensionAttribute(): string
    {
        return pathinfo($this->file_path, PATHINFO_EXTENSION);
    }

    /**
     * Get file icon based on file type
     */
    public function getFileIconAttribute(): string
    {
        $extension = strtolower($this->file_extension);
        
        return match($extension) {
            'pdf' => 'ri-file-pdf-line',
            'doc', 'docx' => 'ri-file-word-line',
            'xls', 'xlsx' => 'ri-file-excel-line',
            'ppt', 'pptx' => 'ri-file-ppt-line',
            'jpg', 'jpeg', 'png', 'gif' => 'ri-image-line',
            'zip', 'rar' => 'ri-file-zip-line',
            'txt' => 'ri-file-text-line',
            default => 'ri-file-line'
        };
    }

    /**
     * Get download URL
     */
    public function getDownloadUrlAttribute(): string
    {
        return route('meetings.documents.download', [$this->meeting_id, $this->id]);
    }

    /**
     * Check if file exists
     */
    public function fileExists(): bool
    {
        return Storage::exists($this->file_path);
    }
}