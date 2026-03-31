<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class OrganizationPosition extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'code',
        'description',
        'department_id',
        'level',
        'is_management',
        'min_salary',
        'max_salary',
        'currency',
        'status',
    ];

    protected $casts = [
        'is_management' => 'boolean',
        'min_salary' => 'decimal:2',
        'max_salary' => 'decimal:2',
        'status' => 'boolean',
    ];

    /**
     * Get the department that this position belongs to.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the employees with this position.
     */
    public function employees()
    {
        return $this->hasMany(Employee::class, 'position_id');
    }

    /**
     * Get the users assigned to this position.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'position_user', 'position_id', 'user_id');
    }

    /**
     * Get positions that are active.
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
