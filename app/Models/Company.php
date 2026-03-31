<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\CompanyContact;

class Company extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'legal_name',
        'tax_id',
        'registration_number',
        'logo',
        'website',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'currency',
        'fiscal_year_start',
        'industry',
        'description',
        'status',
    ];

    protected $casts = [
        'fiscal_year_start' => 'date',
        'status' => 'boolean',
    ];

    /**
     * Get the departments for the company.
     */
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    /**
     * Get the employees for the company.
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    /**
     * Get the users associated with the company.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'company_user')
            ->withPivot('is_admin')
            ->withTimestamps();
    }

    /**
     * Get the locations for the company.
     */
    public function locations(): HasMany
    {
        return $this->hasMany(Location::class);
    }

    /**
     * Get only active companies.
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    /**
     * Get the primary contact for the company.
     */
    public function getPrimaryContactAttribute()
    {
        return $this->contacts()->primary()->first();
    }

    public function primaryContact()
    {
        return $this->belongsTo(CompanyContact::class, 'primary_contact_id');
        // Or use another appropriate relationship type
    }

    public function contacts()
    {
        return $this->hasMany(CompanyContact::class);
    }

}
