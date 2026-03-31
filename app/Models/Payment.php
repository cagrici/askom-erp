<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'payment_number',
        'current_account_id',
        'bank_account_id',
        'payment_method_id',
        'payment_term_id',
        'amount',
        'currency',
        'exchange_rate',
        'amount_in_base_currency',
        'commission_rate',
        'commission_amount',
        'bank_fees',
        'net_amount',
        'payment_date',
        'due_date',
        'value_date',
        'reference_number',
        'document_number',
        'description',
        'notes',
        'status',
        'approval_status',
        'is_reconciled',
        'reconciled_at',
        'reconciled_by',
        'approved_at',
        'approved_by',
        'paid_at',
        'paid_by',
        'attachments',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'amount_in_base_currency' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'bank_fees' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'payment_date' => 'date',
        'due_date' => 'date',
        'value_date' => 'date',
        'is_reconciled' => 'boolean',
        'reconciled_at' => 'datetime',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
        'attachments' => 'array',
    ];

    protected $dates = [
        'payment_date',
        'due_date',
        'value_date',
        'reconciled_at',
        'approved_at',
        'paid_at',
    ];

    // Relationships
    public function currentAccount(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function paymentTerm(): BelongsTo
    {
        return $this->belongsTo(PaymentTerm::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function reconciledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reconciled_by');
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('approval_status', 'approved');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeReconciled($query)
    {
        return $query->where('is_reconciled', true);
    }

    public function scopeUnreconciled($query)
    {
        return $query->where('is_reconciled', false);
    }

    public function scopeByCurrency($query, $currency)
    {
        return $query->where('currency', $currency);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('payment_date', [$startDate, $endDate]);
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())->where('status', '!=', 'paid');
    }

    // Mutators & Accessors
    public function getStatusTextAttribute()
    {
        return match($this->status) {
            'draft' => 'Taslak',
            'pending' => 'Beklemede',
            'approved' => 'Onaylandı',
            'paid' => 'Ödendi',
            'cancelled' => 'İptal Edildi',
            'bounced' => 'İade Edildi',
            default => $this->status
        };
    }

    public function getApprovalStatusTextAttribute()
    {
        return match($this->approval_status) {
            'pending' => 'Onay Bekliyor',
            'approved' => 'Onaylandı',
            'rejected' => 'Reddedildi',
            default => $this->approval_status
        };
    }

    public function getStatusBadgeColorAttribute()
    {
        return match($this->status) {
            'draft' => 'secondary',
            'pending' => 'warning',
            'approved' => 'info',
            'paid' => 'success',
            'cancelled' => 'danger',
            'bounced' => 'danger',
            default => 'secondary'
        };
    }

    public function getFormattedAmountAttribute()
    {
        return number_format($this->amount, 2, ',', '.') . ' ' . $this->currency;
    }

    public function getFormattedNetAmountAttribute()
    {
        return number_format($this->net_amount, 2, ',', '.') . ' ' . $this->currency;
    }

    public function getIsOverdueAttribute()
    {
        return $this->due_date && 
               $this->due_date < now() && 
               !in_array($this->status, ['paid', 'cancelled']);
    }

    public function getDaysOverdueAttribute()
    {
        if (!$this->is_overdue) {
            return 0;
        }
        
        return now()->diffInDays($this->due_date);
    }

    // Business Logic Methods
    public static function generatePaymentNumber()
    {
        $lastPayment = static::latest('id')->first();
        $number = $lastPayment ? (int) substr($lastPayment->payment_number, -6) + 1 : 1;
        
        return 'PAY' . date('Y') . str_pad($number, 6, '0', STR_PAD_LEFT);
    }

    public function calculateCommission()
    {
        if ($this->commission_rate > 0) {
            $this->commission_amount = $this->amount * ($this->commission_rate / 100);
        }
        
        return $this;
    }

    public function calculateNetAmount()
    {
        $this->net_amount = $this->amount - $this->commission_amount - $this->bank_fees;
        
        return $this;
    }

    public function calculateAmountInBaseCurrency()
    {
        if ($this->currency !== 'TRY') {
            $this->amount_in_base_currency = $this->amount * $this->exchange_rate;
        } else {
            $this->amount_in_base_currency = $this->amount;
        }
        
        return $this;
    }

    public function markAsPaid($userId = null)
    {
        $this->update([
            'status' => 'paid',
            'paid_at' => now(),
            'paid_by' => $userId ?? auth()->id(),
        ]);

        return $this;
    }

    public function markAsBounced($reason = null)
    {
        $this->update([
            'status' => 'bounced',
            'notes' => $this->notes . "\n\nİade nedeni: " . $reason,
        ]);

        return $this;
    }

    public function approve($userId = null)
    {
        $this->update([
            'approval_status' => 'approved',
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $userId ?? auth()->id(),
        ]);

        return $this;
    }

    public function reject($reason = null, $userId = null)
    {
        $this->update([
            'approval_status' => 'rejected',
            'status' => 'cancelled',
            'notes' => $this->notes . "\n\nRed nedeni: " . $reason,
        ]);

        return $this;
    }

    public function reconcile($userId = null)
    {
        $this->update([
            'is_reconciled' => true,
            'reconciled_at' => now(),
            'reconciled_by' => $userId ?? auth()->id(),
        ]);

        return $this;
    }

    public function canEdit()
    {
        return in_array($this->status, ['draft', 'pending']) && 
               $this->approval_status !== 'approved';
    }

    public function canDelete()
    {
        return in_array($this->status, ['draft', 'pending']) && 
               $this->approval_status !== 'approved';
    }

    public function canApprove()
    {
        return $this->status === 'pending' && 
               $this->approval_status === 'pending';
    }

    public function canPay()
    {
        return $this->status === 'approved' && 
               $this->approval_status === 'approved';
    }

    public function canReconcile()
    {
        return $this->status === 'paid' && 
               !$this->is_reconciled;
    }

    // Boot method for model events
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($payment) {
            if (empty($payment->payment_number)) {
                $payment->payment_number = static::generatePaymentNumber();
            }
            
            $payment->created_by = auth()->id();
            
            // Auto-calculate amounts
            $payment->calculateCommission();
            $payment->calculateNetAmount();
            $payment->calculateAmountInBaseCurrency();
        });

        static::updating(function ($payment) {
            $payment->updated_by = auth()->id();
            
            // Recalculate amounts if relevant fields changed
            if ($payment->isDirty(['amount', 'commission_rate', 'bank_fees', 'exchange_rate'])) {
                $payment->calculateCommission();
                $payment->calculateNetAmount();
                $payment->calculateAmountInBaseCurrency();
            }
        });
    }
}
