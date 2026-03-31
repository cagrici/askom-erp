<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApprovalWorkflow extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'steps',
        'is_active',
        'created_by',
        'department_id',
    ];

    protected $casts = [
        'steps' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the approval requests using this workflow
     */
    public function approvalRequests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class);
    }

    /**
     * Get the work requests using this workflow
     */
    public function workRequests(): HasMany
    {
        return $this->hasMany(WorkRequest::class);
    }

    /**
     * Get the department this workflow belongs to
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
