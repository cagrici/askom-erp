<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CurrentAccountTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'current_account_id',
        'transaction_type',
        'amount',
        'currency',
        'transaction_date',
        'due_date',
        'document_type',
        'document_id',
        'description',
        'notes',
        'created_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date',
        'due_date' => 'date',
    ];

    /**
     * Relationships
     */
    public function currentAccount(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scopes
     */
    public function scopeDebit($query)
    {
        return $query->where('transaction_type', 'debit');
    }

    public function scopeCredit($query)
    {
        return $query->where('transaction_type', 'credit');
    }

    public function scopeByDocumentType($query, string $type)
    {
        return $query->where('document_type', $type);
    }

    public function scopeByAccount($query, int $accountId)
    {
        return $query->where('current_account_id', $accountId);
    }

    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    /**
     * Accessors
     */
    public function getTypeTextAttribute(): string
    {
        return $this->transaction_type === 'debit' ? 'Alacak' : 'Borç';
    }

    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount, 2, ',', '.') . ' ' . $this->currency;
    }
}
