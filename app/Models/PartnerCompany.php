<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PartnerCompany extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'category_id',
        'description',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'phone',
        'email',
        'website',
        'logo_path',
        'discount_details',
        'terms_conditions',
        'agreement_start_date',
        'agreement_end_date',
        'is_active',
        'contact_person_id',
        'external_contact_name',
        'external_contact_phone',
        'external_contact_email',
        'location_map_link',
        'how_to_claim',
        'promo_code',
    ];

    protected $casts = [
        'agreement_start_date' => 'date',
        'agreement_end_date' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * Get the category that owns the partner company
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    /**
     * Get the contact person (internal) for this partner company
     */
    public function contactPerson(): BelongsTo
    {
        return $this->belongsTo(User::class, 'contact_person_id');
    }

    /**
     * Get the branches of this partner company
     */
    public function branches(): HasMany
    {
        return $this->hasMany(PartnerCompanyBranch::class);
    }

    /**
     * Get the discount usages recorded for this partner company
     */
    public function discountUsages(): HasMany
    {
        return $this->hasMany(EmployeeDiscount::class);
    }

    /**
     * Check if the partnership is active
     */
    public function isActive(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->agreement_end_date && now()->gt($this->agreement_end_date)) {
            return false;
        }

        return true;
    }

    /**
     * Check if the partnership is expiring soon (within 30 days)
     */
    public function isExpiringSoon(): bool
    {
        if (!$this->agreement_end_date) {
            return false;
        }

        $daysUntilExpiry = now()->diffInDays($this->agreement_end_date, false);
        return $daysUntilExpiry >= 0 && $daysUntilExpiry <= 30;
    }
}
