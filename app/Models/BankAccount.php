<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_name',
        'bank_name',
        'branch_name',
        'branch_code',
        'account_number',
        'iban',
        'swift_code',
        'currency',
        'account_type',
        'description',
        'is_active',
        'is_default',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_default' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeByCurrency($query, $currency)
    {
        return $query->where('currency', $currency);
    }

    public function getAccountTypeTextAttribute()
    {
        $types = [
            'checking' => 'Vadesiz',
            'savings' => 'Vadeli',
            'business' => 'Ticari',
            'other' => 'Diğer'
        ];

        return $types[$this->account_type] ?? $this->account_type;
    }

    public function getFormattedAccountNumberAttribute()
    {
        if ($this->iban) {
            return $this->iban;
        }

        return $this->account_number;
    }
}