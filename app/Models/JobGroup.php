<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobGroup extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'created_by',
        'location_id',
        'is_active'
    ];
    
    protected $attributes = [
        'location_id' => null
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'job_group_members')
            ->withPivot('is_admin', 'joined_at')
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(JobGroupMessage::class);
    }

    public function isUserMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }

    public function isUserAdmin(User $user): bool
    {
        return $this->members()
            ->where('user_id', $user->id)
            ->wherePivot('is_admin', true)
            ->exists();
    }

    public function addMember(User $user, bool $isAdmin = false): void
    {
        $this->members()->attach($user->id, [
            'is_admin' => $isAdmin,
            'joined_at' => now()
        ]);
    }

    public function removeMember(User $user): void
    {
        $this->members()->detach($user->id);
    }

    public function makeAdmin(User $user): void
    {
        $this->members()->updateExistingPivot($user->id, [
            'is_admin' => true
        ]);
    }

    public function removeAdmin(User $user): void
    {
        $this->members()->updateExistingPivot($user->id, [
            'is_admin' => false
        ]);
    }
}