<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'transaction_number', 'cash_account_id', 'transaction_type', 'payment_method',
        'transaction_date', 'amount', 'currency', 'exchange_rate', 'amount_in_base_currency',
        'document_type', 'document_id', 'receipt_number',
        'related_cash_account_id', 'related_transaction_id', 'current_account_id',
        'category', 'description', 'notes',
        'check_number', 'check_bank', 'check_due_date',
        'card_type', 'card_last_four', 'card_holder_name',
        'counted_amount', 'system_amount', 'difference_amount', 'count_notes',
        'status', 'approved_by', 'approved_at', 'performed_by',
        'created_by', 'updated_by'
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'amount' => 'decimal:2',
        'exchange_rate' => 'decimal:6',
        'amount_in_base_currency' => 'decimal:2',
        'check_due_date' => 'date',
        'counted_amount' => 'decimal:2',
        'system_amount' => 'decimal:2',
        'difference_amount' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    // Relationships
    public function cashAccount(): BelongsTo
    {
        return $this->belongsTo(CashAccount::class);
    }

    public function relatedCashAccount(): BelongsTo
    {
        return $this->belongsTo(CashAccount::class, 'related_cash_account_id');
    }

    public function relatedTransaction(): BelongsTo
    {
        return $this->belongsTo(CashTransaction::class, 'related_transaction_id');
    }

    public function currentAccount(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
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
    public function scopeIncome($query)
    {
        return $query->where('transaction_type', 'income');
    }

    public function scopeExpense($query)
    {
        return $query->where('transaction_type', 'expense');
    }

    public function scopeTransfers($query)
    {
        return $query->whereIn('transaction_type', ['transfer_in', 'transfer_out']);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('transaction_type', $type);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    public function scopeByCashAccount($query, $cashAccountId)
    {
        return $query->where('cash_account_id', $cashAccountId);
    }

    // Accessors
    public function getTypeTextAttribute(): string
    {
        return match($this->transaction_type) {
            'income' => 'Giriş',
            'expense' => 'Çıkış',
            'transfer_in' => 'Transfer Girişi',
            'transfer_out' => 'Transfer Çıkışı',
            'opening' => 'Açılış',
            'count_adjustment' => 'Sayım Düzeltmesi',
            default => $this->transaction_type
        };
    }

    public function getTypeColorAttribute(): string
    {
        return match($this->transaction_type) {
            'income' => 'success',
            'expense' => 'danger',
            'transfer_in' => 'info',
            'transfer_out' => 'warning',
            'opening' => 'primary',
            'count_adjustment' => 'secondary',
            default => 'secondary'
        };
    }

    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Beklemede',
            'approved' => 'Onaylandı',
            'rejected' => 'Reddedildi',
            'cancelled' => 'İptal Edildi',
            default => $this->status
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'warning',
            'approved' => 'success',
            'rejected' => 'danger',
            'cancelled' => 'secondary',
            default => 'secondary'
        };
    }

    public function getPaymentMethodTextAttribute(): string
    {
        return match($this->payment_method) {
            'cash' => 'Nakit',
            'check' => 'Çek',
            'credit_card' => 'Kredi Kartı',
            'bank_transfer' => 'Havale/EFT',
            'other' => 'Diğer',
            default => $this->payment_method
        };
    }

    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount, 2) . ' ' . $this->currency;
    }

    // Methods
    public static function generateTransactionNumber(): string
    {
        $prefix = 'CT-' . date('Ym') . '-';
        $lastTransaction = static::where('transaction_number', 'like', $prefix . '%')
            ->orderBy('transaction_number', 'desc')
            ->first();

        if (!$lastTransaction) {
            return $prefix . '0001';
        }

        $lastNumber = (int) substr($lastTransaction->transaction_number, strlen($prefix));
        $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);

        return $prefix . $newNumber;
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transaction) {
            if (empty($transaction->transaction_number)) {
                $transaction->transaction_number = static::generateTransactionNumber();
            }

            // Calculate amount in base currency
            if (empty($transaction->amount_in_base_currency)) {
                $transaction->amount_in_base_currency = $transaction->amount * $transaction->exchange_rate;
            }
        });

        static::created(function ($transaction) {
            // Update cash account balance if approved
            if ($transaction->status === 'approved') {
                $transaction->cashAccount->updateBalance(
                    $transaction->amount,
                    $transaction->transaction_type
                );
            }
        });
    }
}
