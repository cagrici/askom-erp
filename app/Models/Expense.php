<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Expense extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'expense_number',
        'current_account_id',
        'expense_category_id',
        'bank_account_id',
        'payment_method_id',
        'employee_id',
        'location_id',
        'title',
        'description',
        'amount',
        'currency',
        'exchange_rate',
        'amount_in_base_currency',
        'vat_rate',
        'vat_amount',
        'withholding_tax_rate',
        'withholding_tax_amount',
        'net_amount',
        'expense_date',
        'invoice_date',
        'due_date',
        'payment_date',
        'invoice_number',
        'reference_number',
        'receipt_number',
        'status',
        'approval_status',
        'payment_status',
        'is_recurring',
        'recurring_frequency',
        'next_occurrence_date',
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
        'vat_rate' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'withholding_tax_rate' => 'decimal:2',
        'withholding_tax_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'expense_date' => 'date',
        'invoice_date' => 'date',
        'due_date' => 'date',
        'payment_date' => 'date',
        'next_occurrence_date' => 'date',
        'is_recurring' => 'boolean',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
        'attachments' => 'array',
    ];

    // Relationships
    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }

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

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ExpenseItem::class);
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
        return $query->where('payment_status', 'paid');
    }

    public function scopeUnpaid($query)
    {
        return $query->where('payment_status', 'unpaid');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('expense_category_id', $categoryId);
    }

    public function scopeByCurrency($query, $currency)
    {
        return $query->where('currency', $currency);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('expense_date', [$startDate, $endDate]);
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
                    ->whereNotIn('payment_status', ['paid']);
    }

    public function scopeCurrentMonth($query)
    {
        return $query->whereMonth('expense_date', now()->month)
                    ->whereYear('expense_date', now()->year);
    }

    public function scopeLastMonth($query)
    {
        $lastMonth = now()->subMonth();
        return $query->whereMonth('expense_date', $lastMonth->month)
                    ->whereYear('expense_date', $lastMonth->year);
    }

    public function scopeRecurring($query)
    {
        return $query->where('is_recurring', true);
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

    public function getPaymentStatusTextAttribute()
    {
        return match($this->payment_status) {
            'unpaid' => 'Ödenmedi',
            'partial' => 'Kısmi Ödendi',
            'paid' => 'Ödendi',
            default => $this->payment_status
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
               !in_array($this->payment_status, ['paid']);
    }

    public function getDaysOverdueAttribute()
    {
        if (!$this->is_overdue) {
            return 0;
        }
        
        return now()->diffInDays($this->due_date);
    }

    // Business Logic Methods
    public static function generateExpenseNumber()
    {
        $lastExpense = static::latest('id')->first();
        $number = $lastExpense ? (int) substr($lastExpense->expense_number, -6) + 1 : 1;
        
        return 'GID' . date('Y') . str_pad($number, 6, '0', STR_PAD_LEFT);
    }

    public function calculateVat()
    {
        if ($this->vat_rate > 0) {
            $this->vat_amount = $this->amount * ($this->vat_rate / 100);
        }
        
        return $this;
    }

    public function calculateWithholdingTax()
    {
        if ($this->withholding_tax_rate > 0) {
            $this->withholding_tax_amount = $this->amount * ($this->withholding_tax_rate / 100);
        }
        
        return $this;
    }

    public function calculateNetAmount()
    {
        $this->net_amount = $this->amount + $this->vat_amount - $this->withholding_tax_amount;
        
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
            'description' => $this->description . "\n\nRed nedeni: " . $reason,
        ]);

        return $this;
    }

    public function markAsPaid($userId = null)
    {
        $this->update([
            'payment_status' => 'paid',
            'status' => 'paid',
            'paid_at' => now(),
            'paid_by' => $userId ?? auth()->id(),
            'payment_date' => now()->toDateString(),
        ]);

        return $this;
    }

    public function createRecurring()
    {
        if (!$this->is_recurring || !$this->next_occurrence_date) {
            return null;
        }

        $nextExpense = $this->replicate(['expense_number']);
        $nextExpense->expense_date = $this->next_occurrence_date;
        $nextExpense->status = 'draft';
        $nextExpense->approval_status = 'pending';
        $nextExpense->payment_status = 'unpaid';
        $nextExpense->approved_at = null;
        $nextExpense->approved_by = null;
        $nextExpense->paid_at = null;
        $nextExpense->paid_by = null;
        $nextExpense->payment_date = null;

        // Calculate next occurrence date
        $nextOccurrence = match($this->recurring_frequency) {
            'monthly' => $this->next_occurrence_date->addMonth(),
            'quarterly' => $this->next_occurrence_date->addMonths(3),
            'yearly' => $this->next_occurrence_date->addYear(),
            default => null
        };

        $nextExpense->next_occurrence_date = $nextOccurrence;
        $nextExpense->save();

        // Update current expense next occurrence date
        $this->update(['next_occurrence_date' => $nextOccurrence]);

        return $nextExpense;
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
               $this->approval_status === 'approved' &&
               $this->payment_status !== 'paid';
    }

    // Boot method for model events
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($expense) {
            if (empty($expense->expense_number)) {
                $expense->expense_number = static::generateExpenseNumber();
            }
            
            $expense->created_by = auth()->id();
            
            // Auto-calculate amounts
            $expense->calculateVat();
            $expense->calculateWithholdingTax();
            $expense->calculateNetAmount();
            $expense->calculateAmountInBaseCurrency();
        });

        static::updating(function ($expense) {
            $expense->updated_by = auth()->id();
            
            // Recalculate amounts if relevant fields changed
            if ($expense->isDirty(['amount', 'vat_rate', 'withholding_tax_rate', 'exchange_rate'])) {
                $expense->calculateVat();
                $expense->calculateWithholdingTax();
                $expense->calculateNetAmount();
                $expense->calculateAmountInBaseCurrency();
            }
        });
    }
}
