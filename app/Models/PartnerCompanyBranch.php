<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerCompanyBranch extends Model
{
    use HasFactory;

    protected $fillable = [
        'partner_company_id',
        'name',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'phone',
        'email',
        'working_hours',
        'location_map_link',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the partner company that owns the branch
     */
    public function partnerCompany(): BelongsTo
    {
        return $this->belongsTo(PartnerCompany::class);
    }

    /**
     * Get the full address attribute
     */
    public function getFullAddressAttribute(): string
    {
        $parts = [$this->address];
        
        if ($this->city) {
            $parts[] = $this->city;
        }
        
        if ($this->state) {
            $parts[] = $this->state;
        }
        
        if ($this->postal_code) {
            $parts[] = $this->postal_code;
        }
        
        if ($this->country) {
            $parts[] = $this->country;
        }
        
        return implode(', ', $parts);
    }
}
