<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpenseReportItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'expense_report_id',
        'expense_id',
    ];

    /**
     * Get the expense report this item belongs to
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(ExpenseReport::class, 'expense_report_id');
    }

    /**
     * Get the expense for this item
     */
    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }
}
