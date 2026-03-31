<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesRepresentative extends Model
{
    use HasFactory;

    protected $fillable = [
        'logo_id',
        'logo_code',
        'logo_firm_no',
        'logo_user_id',
        'logo_synced_at',
        'first_name',
        'last_name',
        'email',
        'phone',
        'mobile',
        'department',
        'title',
        'employee_id',
        'commission_rate',
        'hire_date',
        'notes',
        'is_active'
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'hire_date' => 'date',
        'is_active' => 'boolean',
        'logo_synced_at' => 'datetime',
    ];

    protected $appends = ['full_name', 'name'];

    /**
     * Alias for full_name to match frontend interface
     */
    public function getNameAttribute(): string
    {
        return $this->full_name;
    }

    /**
     * Relationships
     */
    public function currentAccounts(): HasMany
    {
        return $this->hasMany(CurrentAccount::class);
    }

    public function salesOrders(): HasMany
    {
        return $this->hasMany(SalesOrder::class, 'salesperson_id');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByDepartment($query, $department)
    {
        return $query->where('department', $department);
    }

    /**
     * Attribute Accessors
     */
    public function getFullNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    public function getDisplayNameAttribute(): string
    {
        $name = $this->full_name;
        if ($this->title) {
            $name .= ' (' . $this->title . ')';
        }
        return $name;
    }
}
