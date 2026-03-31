<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExpenseReport extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'user_id',
        'start_date',
        'end_date',
        'description',
        'total_amount',
        'status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'total_amount' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    /**
     * Get the user who created the expense report
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the expense items in this report
     */
    public function items(): HasMany
    {
        return $this->hasMany(ExpenseReportItem::class);
    }

    /**
     * Get all expenses associated with this report through items
     */
    public function expenses()
    {
        return $this->hasManyThrough(
            Expense::class,
            ExpenseReportItem::class,
            'expense_report_id',
            'id',
            'id',
            'expense_id'
        );
    }

    /**
     * Get the user who approved the expense report
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Calculate total amount from all expense items
     */
    public function calculateTotal(): float
    {
        return $this->expenses()->sum('amount');
    }

    /**
     * Update the total amount field
     */
    public function updateTotalAmount(): void
    {
        $this->total_amount = $this->calculateTotal();
        $this->save();
    }

    /**
     * Approve the expense report
     */
    public function approve(int $approverId): void
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $approverId,
            'approved_at' => now(),
        ]);
        
        // Also approve all related expenses if they're still pending
        $this->expenses()->where('status', 'pending')->update([
            'status' => 'approved',
            'approved_by' => $approverId,
            'approved_at' => now(),
        ]);
    }

    /**
     * Reject the expense report
     */
    public function reject(int $rejecterId, string $reason): void
    {
        $this->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Get formatted total amount with currency
     * Assumes all expenses in a report use the same currency
     */
    public function getFormattedTotalAttribute(): string
    {
        $currency = $this->expenses()->first()->currency ?? 'TRY';
        return number_format($this->total_amount, 2) . ' ' . $currency;
    }
    
    /**
     * Get the status color
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'approved' => 'success',
            'rejected' => 'danger',
            'paid' => 'info',
            default => 'warning', // pending
        };
    }
}
