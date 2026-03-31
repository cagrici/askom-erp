<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'type',
        'description',
        'settings',
        'commission_rate',
        'requires_bank_account',
        'is_active',
        'is_default',
        'sort_order',
    ];

    protected $casts = [
        'settings' => 'array',
        'commission_rate' => 'decimal:2',
        'requires_bank_account' => 'boolean',
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

    public function scopeRequiresBankAccount($query)
    {
        return $query->where('requires_bank_account', true);
    }

    public function getTypeTextAttribute()
    {
        $types = [
            'cash' => 'Nakit',
            'card' => 'Kart',
            'bank_transfer' => 'Banka Transferi',
            'check' => 'Çek',
            'promissory_note' => 'Senet',
            'other' => 'Diğer'
        ];

        return $types[$this->type] ?? $this->type;
    }
}