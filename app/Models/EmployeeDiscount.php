<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeDiscount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'partner_company_id',
        'used_on',
        'amount_saved',
        'feedback',
        'rating',
    ];

    protected $casts = [
        'used_on' => 'date',
        'amount_saved' => 'decimal:2',
        'rating' => 'integer',
    ];

    /**
     * Get the user that owns the discount usage record
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the partner company for this discount usage
     */
    public function partnerCompany(): BelongsTo
    {
        return $this->belongsTo(PartnerCompany::class);
    }
}
