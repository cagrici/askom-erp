<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobGroupMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_group_id',
        'user_id',
        'is_admin',
        'joined_at'
    ];

    protected $casts = [
        'is_admin' => 'boolean',
        'joined_at' => 'datetime',
    ];

    public function jobGroup(): BelongsTo
    {
        return $this->belongsTo(JobGroup::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}