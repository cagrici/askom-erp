<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentTerm extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'days',
        'type',
        'discount_percentage',
        'discount_days',
        'description',
        'is_active',
        'is_default',
        'sort_order',
    ];

    protected $casts = [
        'days' => 'integer',
        'discount_percentage' => 'decimal:2',
        'discount_days' => 'integer',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}