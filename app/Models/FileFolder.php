<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FileFolder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'path',
        'parent_id',
        'user_id',
        'is_public',
        'files_count',
        'size',
    ];

    /**
     * Get the parent folder
     */
    public function parent()
    {
        return $this->belongsTo(FileFolder::class, 'parent_id');
    }

    /**
     * Get the child folders
     */
    public function children()
    {
        return $this->hasMany(FileFolder::class, 'parent_id');
    }

    /**
     * Get all files in this folder
     */
    public function files()
    {
        return $this->hasMany(File::class, 'folder_id');
    }

    /**
     * Get the user who created this folder
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
     * Calculate total size of the folder (including subfolders)
     */
    public function calculateTotalSize()
    {
        // Direct files size
        $size = $this->files()->sum('size');
        
        // Add subfolders size
        foreach ($this->children as $subfolder) {
            $size += $subfolder->calculateTotalSize();
        }
        
        return $size;
    }

    /**
     * Update folder size and file count
     */
    public function updateStats()
    {
        $this->files_count = $this->files()->count();
        $this->size = $this->calculateTotalSize();
        $this->save();
        
        // Update parent folder stats as well
        if ($this->parent_id) {
            $this->parent->updateStats();
        }
    }
}
