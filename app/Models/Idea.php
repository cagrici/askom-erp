<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Idea extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'category_id',
        'department_id',
        'user_id',
        'status',
        'impact',
        'effort',
        'is_anonymous',
        'implemented_at',
        'declined_at'
    ];

    protected $casts = [
        'is_anonymous' => 'boolean',
        'implemented_at' => 'datetime',
        'declined_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function comments()
    {
        return $this->hasMany(IdeaComment::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'idea_tags');
    }
}