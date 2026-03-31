<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpenseCategory extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'parent_id',
        'account_code',
        'cost_center_id',
        'is_active',
        'requires_approval',
        'approval_limit',
        'color',
        'icon',
        'monthly_budget',
        'yearly_budget',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'requires_approval' => 'boolean',
        'approval_limit' => 'decimal:2',
        'monthly_budget' => 'decimal:2',
        'yearly_budget' => 'decimal:2',
    ];

    // Relationships
    public function parent(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ExpenseCategory::class, 'parent_id');
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'expense_category_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeParents($query)
    {
        return $query->whereNull('parent_id');
    }

    public function scopeChildren($query)
    {
        return $query->whereNotNull('parent_id');
    }

    // Accessors
    public function getFullNameAttribute()
    {
        if ($this->parent) {
            return $this->parent->name . ' > ' . $this->name;
        }
        return $this->name;
    }

    public function getBudgetUsageAttribute()
    {
        $currentMonthExpenses = $this->expenses()
            ->whereMonth('expense_date', now()->month)
            ->whereYear('expense_date', now()->year)
            ->sum('amount');

        if ($this->monthly_budget > 0) {
            return ($currentMonthExpenses / $this->monthly_budget) * 100;
        }

        return 0;
    }

    // Helper methods
    public function isOverBudget()
    {
        return $this->budget_usage > 100;
    }

    public function getRemainingBudget()
    {
        $currentMonthExpenses = $this->expenses()
            ->whereMonth('expense_date', now()->month)
            ->whereYear('expense_date', now()->year)
            ->sum('amount');

        return max(0, $this->monthly_budget - $currentMonthExpenses);
    }
}
