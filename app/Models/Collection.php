<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Collection extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'collection_number',
        'current_account_id',
        'collection_date',
        'payment_term_id',
        'payment_method_id',
        'bank_account_id',
        'reference_number',
        'document_number',
        'document_date',
        'amount',
        'currency',
        'exchange_rate',
        'amount_in_base_currency',
        'commission_amount',
        'commission_rate',
        'net_amount',
        'collection_type',
        'status',
        'due_date',
        'maturity_date',
        'check_number',
        'check_bank',
        'check_branch',
        'check_account',
        'promissory_note_number',
        'promissory_note_guarantor',
        'description',
        'notes',
        'invoice_numbers',
        'allocated_invoices',
        'discount_amount',
        'discount_reason',
        'late_fee_amount',
        'early_payment_discount',
        'is_advance_payment',
        'advance_for_orders',
        'pos_terminal_id',
        'pos_batch_number',
        'pos_approval_code',
        'card_number_masked',
        'card_type',
        'installment_count',
        'installment_amount',
        'collected_by',
        'approval_status',
        'approved_by',
        'approved_at',
        'approval_notes',
        'is_reconciled',
        'reconciled_at',
        'reconciled_by',
        'bank_statement_reference',
        'accounting_entry_id',
        'custom_fields',
        'tags',
        'attachment_count',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'collection_date' => 'datetime',
        'document_date' => 'date',
        'due_date' => 'date',
        'maturity_date' => 'date',
        'amount' => 'decimal:4',
        'exchange_rate' => 'decimal:6',
        'amount_in_base_currency' => 'decimal:4',
        'commission_amount' => 'decimal:4',
        'commission_rate' => 'decimal:2',
        'net_amount' => 'decimal:4',
        'discount_amount' => 'decimal:4',
        'late_fee_amount' => 'decimal:4',
        'early_payment_discount' => 'decimal:4',
        'installment_amount' => 'decimal:4',
        'approved_at' => 'datetime',
        'reconciled_at' => 'datetime',
        'is_advance_payment' => 'boolean',
        'is_reconciled' => 'boolean',
        'installment_count' => 'integer',
        'attachment_count' => 'integer',
        'invoice_numbers' => 'array',
        'allocated_invoices' => 'array',
        'advance_for_orders' => 'array',
        'custom_fields' => 'array',
        'tags' => 'array',
    ];

    /**
     * Relationships
     */
    public function currentAccount(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class);
    }

    public function paymentTerm(): BelongsTo
    {
        return $this->belongsTo(PaymentTerm::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function collector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'collected_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function reconciler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reconciled_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', '!=', 'cancelled');
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCollected($query)
    {
        return $query->where('status', 'collected');
    }

    public function scopeReconciled($query)
    {
        return $query->where('is_reconciled', true);
    }

    public function scopeUnreconciled($query)
    {
        return $query->where('is_reconciled', false);
    }

    public function scopeByCurrentAccount($query, $currentAccountId)
    {
        return $query->where('current_account_id', $currentAccountId);
    }

    public function scopeByPaymentMethod($query, $paymentMethodId)
    {
        return $query->where('payment_method_id', $paymentMethodId);
    }

    public function scopeByCurrency($query, $currency)
    {
        return $query->where('currency', $currency);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('collection_date', [$startDate, $endDate]);
    }

    public function scopeAdvancePayments($query)
    {
        return $query->where('is_advance_payment', true);
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
                    ->whereIn('status', ['pending', 'partial']);
    }

    public function scopeMaturityToday($query)
    {
        return $query->whereDate('maturity_date', today());
    }

    public function scopeMaturityThisWeek($query)
    {
        return $query->whereBetween('maturity_date', [
            now()->startOfWeek(),
            now()->endOfWeek()
        ]);
    }

    /**
     * Attribute Accessors
     */
    public function getCollectionTypeTextAttribute()
    {
        $types = [
            'invoice_payment' => 'Fatura Tahsilatı',
            'advance_payment' => 'Avans Tahsilatı',
            'partial_payment' => 'Kısmi Tahsilat',
            'overpayment' => 'Fazla Ödeme',
            'refund' => 'İade',
            'adjustment' => 'Düzeltme',
            'other' => 'Diğer'
        ];

        return $types[$this->collection_type] ?? $this->collection_type;
    }

    public function getStatusTextAttribute()
    {
        $statuses = [
            'draft' => 'Taslak',
            'pending' => 'Bekleyen',
            'partial' => 'Kısmi',
            'collected' => 'Tahsil Edildi',
            'bounced' => 'Karşılıksız',
            'cancelled' => 'İptal',
            'expired' => 'Vadesi Geçmiş'
        ];

        return $statuses[$this->status] ?? $this->status;
    }

    public function getStatusColorAttribute()
    {
        $colors = [
            'draft' => 'secondary',
            'pending' => 'warning',
            'partial' => 'info',
            'collected' => 'success',
            'bounced' => 'danger',
            'cancelled' => 'dark',
            'expired' => 'danger'
        ];

        return $colors[$this->status] ?? 'secondary';
    }

    public function getFormattedAmountAttribute()
    {
        return number_format($this->amount, 2, ',', '.') . ' ' . $this->currency;
    }

    public function getFormattedNetAmountAttribute()
    {
        return number_format($this->net_amount, 2, ',', '.') . ' ' . $this->currency;
    }

    public function getDaysUntilMaturityAttribute()
    {
        if (!$this->maturity_date) {
            return null;
        }

        return $this->maturity_date->diffInDays(now(), false);
    }

    public function getIsOverdueAttribute()
    {
        return $this->due_date && $this->due_date->isPast() && 
               in_array($this->status, ['pending', 'partial']);
    }

    public function getIsMaturityTodayAttribute()
    {
        return $this->maturity_date && $this->maturity_date->isToday();
    }

    public function getIsMaturitySoonAttribute()
    {
        return $this->maturity_date && 
               $this->maturity_date->isBetween(now(), now()->addDays(7));
    }

    /**
     * Business Logic Methods
     */
    public function calculateCommission()
    {
        if ($this->commission_rate > 0) {
            $this->commission_amount = ($this->amount * $this->commission_rate) / 100;
            $this->net_amount = $this->amount - $this->commission_amount;
        } else {
            $this->commission_amount = $this->commission_amount ?? 0;
            $this->net_amount = $this->amount - $this->commission_amount;
        }

        return $this;
    }

    public function markAsCollected($collectedBy = null)
    {
        $this->update([
            'status' => 'collected',
            'collected_by' => $collectedBy ?? auth()->id(),
            'collection_date' => now(),
        ]);

        return $this;
    }

    public function markAsBounced($reason = null)
    {
        $this->update([
            'status' => 'bounced',
            'notes' => $this->notes . "\n" . "Karşılıksız: " . $reason,
            'updated_by' => auth()->id(),
        ]);

        return $this;
    }

    public function reconcile($bankStatementReference = null, $reconciledBy = null)
    {
        $this->update([
            'is_reconciled' => true,
            'reconciled_at' => now(),
            'reconciled_by' => $reconciledBy ?? auth()->id(),
            'bank_statement_reference' => $bankStatementReference,
        ]);

        return $this;
    }

    public function approve($approvedBy = null, $notes = null)
    {
        $this->update([
            'approval_status' => 'approved',
            'approved_by' => $approvedBy ?? auth()->id(),
            'approved_at' => now(),
            'approval_notes' => $notes,
        ]);

        return $this;
    }

    public function reject($rejectedBy = null, $reason = null)
    {
        $this->update([
            'approval_status' => 'rejected',
            'approved_by' => $rejectedBy ?? auth()->id(),
            'approved_at' => now(),
            'approval_notes' => $reason,
        ]);

        return $this;
    }

    /**
     * Auto-generate collection number
     */
    public static function generateCollectionNumber(): string
    {
        $prefix = 'THS';
        $year = date('Y');
        $month = date('m');
        
        // Find last collection number for this month
        $lastCollection = static::whereYear('collection_date', $year)
            ->whereMonth('collection_date', $month)
            ->where('collection_number', 'like', $prefix . $year . $month . '%')
            ->orderBy('collection_number', 'desc')
            ->first();

        if ($lastCollection) {
            $lastNumber = (int) substr($lastCollection->collection_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . $year . $month . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Boot method
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($collection) {
            if (empty($collection->collection_number)) {
                $collection->collection_number = self::generateCollectionNumber();
            }

            if (empty($collection->collection_date)) {
                $collection->collection_date = now();
            }

            // Calculate commission and net amount
            $collection->calculateCommission();

            // Convert to base currency if needed
            if ($collection->currency !== 'TRY' && $collection->exchange_rate > 0) {
                $collection->amount_in_base_currency = $collection->amount * $collection->exchange_rate;
            } else {
                $collection->amount_in_base_currency = $collection->amount;
            }
        });

        static::updating(function ($collection) {
            $collection->calculateCommission();
            
            if ($collection->currency !== 'TRY' && $collection->exchange_rate > 0) {
                $collection->amount_in_base_currency = $collection->amount * $collection->exchange_rate;
            } else {
                $collection->amount_in_base_currency = $collection->amount;
            }
        });
    }
}