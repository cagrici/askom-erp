<?php

namespace App\Models\IdeaPool;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;
use App\Models\Tag;
use App\Models\Department;
use App\Models\Category;

class Idea extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ideas';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'title',
        'description',
        'status',
        'user_id',
        'department_id',
        'category_id',
        'impact',
        'effort',
        'is_anonymous'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_anonymous' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that submitted the idea.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the category that this idea belongs to.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    /**
     * Get the department that this idea belongs to.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the comments for the idea.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(IdeaComment::class);
    }

    /**
     * Get the votes for the idea.
     */
    public function votes(): HasMany
    {
        return $this->hasMany(IdeaVote::class);
    }

    /**
     * The tags that belong to the idea.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    /**
     * Get the attachments for the idea.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(IdeaAttachment::class);
    }

    /**
     * Scope ideas by status.
     */
    public function scopeByStatus($query, $status)
    {
        if ($status) {
            return $query->where('status', $status);
        }
        return $query;
    }

    /**
     * Scope ideas by category.
     */
    public function scopeByCategory($query, $categoryId)
    {
        if ($categoryId) {
            return $query->where('category_id', $categoryId);
        }
        return $query;
    }

    /**
     * Scope ideas by department.
     */
    public function scopeByDepartment($query, $departmentId)
    {
        if ($departmentId) {
            return $query->where('department_id', $departmentId);
        }
        return $query;
    }

    /**
     * Scope ideas by tag.
     */
    public function scopeByTag($query, $tagId)
    {
        if ($tagId) {
            return $query->whereHas('tags', function ($q) use ($tagId) {
                $q->where('tags.id', $tagId);
            });
        }
        return $query;
    }

    /**
     * Scope ideas by search term.
     */
    public function scopeSearch($query, $term)
    {
        if ($term) {
            return $query->where(function ($q) use ($term) {
                $q->where('title', 'like', '%' . $term . '%')
                  ->orWhere('description', 'like', '%' . $term . '%');
            });
        }
        return $query;
    }
}
