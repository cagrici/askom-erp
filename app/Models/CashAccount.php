<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashAccount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'account_code', 'account_name', 'location_id', 'responsible_user_id',
        'description', 'currency', 'current_balance', 'opening_balance', 'opening_date',
        'is_active', 'is_default', 'requires_count', 'count_frequency_days',
        'last_count_date', 'notes', 'custom_fields',
        'created_by', 'updated_by'
    ];

    protected $casts = [
        'current_balance' => 'decimal:2',
        'opening_balance' => 'decimal:2',
        'opening_date' => 'date',
        'last_count_date' => 'date',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'requires_count' => 'boolean',
        'count_frequency_days' => 'integer',
        'custom_fields' => 'array',
    ];

    // Relationships
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function responsibleUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(CashTransaction::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Scopes
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

    public function scopeByLocation($query, $locationId)
    {
        return $query->where('location_id', $locationId);
    }

    public function scopeRequiresCount($query)
    {
        return $query->where('requires_count', true);
    }

    // Accessors
    public function getFormattedBalanceAttribute(): string
    {
        return number_format($this->current_balance, 2) . ' ' . $this->currency;
    }

    public function getStatusTextAttribute(): string
    {
        return $this->is_active ? 'Aktif' : 'Pasif';
    }

    public function getStatusColorAttribute(): string
    {
        return $this->is_active ? 'success' : 'secondary';
    }

    public function getNeedsCountAttribute(): bool
    {
        if (!$this->requires_count) {
            return false;
        }

        if (!$this->last_count_date) {
            return true;
        }

        $daysSinceLastCount = now()->diffInDays($this->last_count_date);
        return $daysSinceLastCount >= $this->count_frequency_days;
    }

    // Methods
    public static function generateAccountCode(): string
    {
        $prefix = 'CASH-';
        $lastAccount = static::where('account_code', 'like', $prefix . '%')
            ->orderBy('account_code', 'desc')
            ->first();

        if (!$lastAccount) {
            return $prefix . '001';
        }

        $lastNumber = (int) substr($lastAccount->account_code, strlen($prefix));
        $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);

        return $prefix . $newNumber;
    }

    public function updateBalance(float $amount, string $type): void
    {
        if ($type === 'income' || $type === 'transfer_in') {
            $this->current_balance += $amount;
        } elseif ($type === 'expense' || $type === 'transfer_out') {
            $this->current_balance -= $amount;
        }

        $this->save();
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($cashAccount) {
            if (empty($cashAccount->account_code)) {
                $cashAccount->account_code = static::generateAccountCode();
            }
        });
    }
}
