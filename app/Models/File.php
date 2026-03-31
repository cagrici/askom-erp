<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class File extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'original_name',
        'file_path',
        'mime_type',
        'extension',
        'size',
        'file_type',
        'folder_id',
        'user_id',
        'is_public',
        'is_favorite',
        'download_count',
        'last_accessed_at',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_favorite' => 'boolean',
        'last_accessed_at' => 'datetime',
    ];

    /**
     * Get the folder that contains this file
     */
    public function folder()
    {
        return $this->belongsTo(FileFolder::class, 'folder_id');
    }

    /**
     * Get the user who uploaded this file
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get formatted size
     */
    public function getFormattedSizeAttribute()
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $size = $this->size;
        $i = 0;
        
        while ($size >= 1024 && $i < count($units) - 1) {
            $size /= 1024;
            $i++;
        }
        
        return round($size, 2) . ' ' . $units[$i];
    }

    /**
     * Get the file icon class based on file type
     */
    public function getIconClassAttribute()
    {
        $extension = strtolower($this->extension);
        
        if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'])) {
            return ['icon' => 'ri-gallery-fill', 'class' => 'success'];
        } elseif (in_array($extension, ['pdf'])) {
            return ['icon' => 'ri-file-pdf-fill', 'class' => 'danger'];
        } elseif (in_array($extension, ['doc', 'docx'])) {
            return ['icon' => 'ri-file-word-fill', 'class' => 'info'];
        } elseif (in_array($extension, ['xls', 'xlsx', 'csv'])) {
            return ['icon' => 'ri-file-excel-fill', 'class' => 'success'];
        } elseif (in_array($extension, ['ppt', 'pptx'])) {
            return ['icon' => 'ri-file-ppt-fill', 'class' => 'warning'];
        } elseif (in_array($extension, ['zip', 'rar', '7z', 'tar', 'gz'])) {
            return ['icon' => 'ri-file-zip-fill', 'class' => 'primary'];
        } elseif (in_array($extension, ['mp3', 'wav', 'ogg', 'flac'])) {
            return ['icon' => 'ri-file-music-fill', 'class' => 'info'];
        } elseif (in_array($extension, ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'])) {
            return ['icon' => 'ri-video-fill', 'class' => 'warning'];
        } elseif (in_array($extension, ['txt', 'rtf', 'md'])) {
            return ['icon' => 'ri-file-text-fill', 'class' => 'secondary'];
        } elseif (in_array($extension, ['html', 'htm', 'xml', 'js', 'css', 'php', 'py', 'java'])) {
            return ['icon' => 'ri-code-fill', 'class' => 'primary'];
        } else {
            return ['icon' => 'ri-file-fill', 'class' => 'secondary'];
        }
    }

    /**
     * Increment download count
     */
    public function incrementDownloadCount()
    {
        $this->download_count += 1;
        $this->last_accessed_at = now();
        $this->save();
    }

    /**
     * Toggle favorite status
     */
    public function toggleFavorite()
    {
        $this->is_favorite = !$this->is_favorite;
        $this->save();
        
        return $this->is_favorite;
    }

    /**
     * Get file URL
     */
    public function getUrl()
    {
        return Storage::url($this->file_path);
    }

    /**
     * Get file contents
     */
    public function getContents()
    {
        return Storage::get($this->file_path);
    }

    /**
     * Determine file type category
     */
    public static function determineFileType($mimeType, $extension)
    {
        $extension = strtolower($extension);
        
        if (str_starts_with($mimeType, 'image/') || in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'])) {
            return 'Media';
        } elseif (str_starts_with($mimeType, 'video/') || in_array($extension, ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'])) {
            return 'Media';
        } elseif (str_starts_with($mimeType, 'audio/') || in_array($extension, ['mp3', 'wav', 'ogg', 'flac'])) {
            return 'Media';
        } elseif (in_array($extension, ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'md', 'csv'])) {
            return 'Documents';
        } else {
            return 'Others';
        }
    }
}
