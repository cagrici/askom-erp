<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'category_id',
        'department_id',
        'created_by',
        'updated_by',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'version',
        'is_public',
        'meta_data',
        'published_at',
        'tags',
        'user_id',
        'location_id',
        'access_level',
        'is_featured',
        'expiry_date',
        'status',
        'download_count'
    ];

    protected $casts = [
        'tags' => 'array',
        'meta_data' => 'array',
        'is_public' => 'boolean',
        'is_featured' => 'boolean',
        'published_at' => 'datetime',
        'expiry_date' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'document_tag');
    }

    public function versions()
    {
        return $this->hasMany(DocumentVersion::class);
    }

    public function isAccessibleBy(User $user): bool
    {
        // Check if the document is public
        if ($this->access_level === 'public') {
            return true;
        }

        // Check if the user is the owner of the document
        if ($this->user_id === $user->id) {
            return true;
        }

        // Check if the user is in the same department as the document
        if ($this->access_level === 'department' && $this->department_id === $user->department_id) {
            return true;
        }

        // Check if the user is in the same location as the document
        if ($this->access_level === 'location' && $this->location_id === $user->location_id) {
            return true;
        }

        return false;
    }

    public function incrementDownloadCount()
    {
        $this->download_count++;
        $this->save();
    }
}
