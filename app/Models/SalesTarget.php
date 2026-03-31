<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class SalesTarget extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'start_date',
        'end_date',
        'period_type',
        'year',
        'month',
        'quarter',
        'assignment_type',
        'user_id',
        'department_id',
        'location_id',
        'revenue_target',
        'quantity_target',
        'order_target',
        'new_customer_target',
        'actual_revenue',
        'actual_quantity',
        'actual_orders',
        'actual_new_customers',
        'revenue_achievement',
        'quantity_achievement',
        'order_achievement',
        'new_customer_achievement',
        'overall_achievement',
        'revenue_weight',
        'quantity_weight',
        'order_weight',
        'new_customer_weight',
        'status',
        'is_active',
        'bonus_amount',
        'bonus_percentage',
        'bonus_conditions',
        'notes',
        'last_calculated_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'revenue_target' => 'decimal:2',
        'actual_revenue' => 'decimal:2',
        'revenue_achievement' => 'decimal:2',
        'quantity_achievement' => 'decimal:2',
        'order_achievement' => 'decimal:2',
        'new_customer_achievement' => 'decimal:2',
        'overall_achievement' => 'decimal:2',
        'bonus_amount' => 'decimal:2',
        'bonus_percentage' => 'decimal:2',
        'is_active' => 'boolean',
        'last_calculated_at' => 'datetime',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Accessors
    public function getPeriodTypeLabelAttribute(): string
    {
        return match($this->period_type) {
            'monthly' => 'Aylık',
            'quarterly' => 'Çeyreklik',
            'yearly' => 'Yıllık',
            'custom' => 'Özel',
            default => $this->period_type,
        };
    }

    public function getAssignmentTypeLabelAttribute(): string
    {
        return match($this->assignment_type) {
            'salesperson' => 'Satış Temsilcisi',
            'team' => 'Takım',
            'department' => 'Departman',
            'location' => 'Lokasyon',
            'company' => 'Şirket',
            default => $this->assignment_type,
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'active' => 'Aktif',
            'completed' => 'Tamamlandı',
            'cancelled' => 'İptal Edildi',
            default => $this->status,
        };
    }

    public function getDaysRemainingAttribute(): int
    {
        if ($this->end_date < Carbon::now()) {
            return 0;
        }
        return Carbon::now()->diffInDays($this->end_date);
    }

    public function getDaysElapsedAttribute(): int
    {
        if ($this->start_date > Carbon::now()) {
            return 0;
        }
        return $this->start_date->diffInDays(Carbon::now());
    }

    public function getTotalDaysAttribute(): int
    {
        return $this->start_date->diffInDays($this->end_date);
    }

    public function getProgressPercentageAttribute(): float
    {
        $total = $this->total_days;
        if ($total == 0) return 100;

        $elapsed = $this->days_elapsed;
        return min(100, ($elapsed / $total) * 100);
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->end_date < Carbon::now();
    }

    public function getIsActivelyRunningAttribute(): bool
    {
        $now = Carbon::now();
        return $this->is_active
            && $this->status === 'active'
            && $this->start_date <= $now
            && $this->end_date >= $now;
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true)->where('status', 'active');
    }

    public function scopeForPeriod($query, $periodType, $year, $month = null, $quarter = null)
    {
        $query->where('period_type', $periodType)->where('year', $year);

        if ($month) {
            $query->where('month', $month);
        }

        if ($quarter) {
            $query->where('quarter', $quarter);
        }

        return $query;
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    public function scopeForLocation($query, $locationId)
    {
        return $query->where('location_id', $locationId);
    }

    public function scopeRunning($query)
    {
        $now = Carbon::now();
        return $query->where('is_active', true)
            ->where('status', 'active')
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now);
    }

    // Methods
    public function calculateAchievements(): void
    {
        // Calculate individual achievements
        $this->revenue_achievement = $this->revenue_target > 0
            ? ($this->actual_revenue / $this->revenue_target) * 100
            : 0;

        $this->quantity_achievement = $this->quantity_target > 0
            ? ($this->actual_quantity / $this->quantity_target) * 100
            : 0;

        $this->order_achievement = $this->order_target > 0
            ? ($this->actual_orders / $this->order_target) * 100
            : 0;

        $this->new_customer_achievement = $this->new_customer_target > 0
            ? ($this->actual_new_customers / $this->new_customer_target) * 100
            : 0;

        // Calculate weighted overall achievement
        $this->overall_achievement = (
            ($this->revenue_achievement * $this->revenue_weight / 100) +
            ($this->quantity_achievement * $this->quantity_weight / 100) +
            ($this->order_achievement * $this->order_weight / 100) +
            ($this->new_customer_achievement * $this->new_customer_weight / 100)
        );

        $this->last_calculated_at = Carbon::now();
        $this->save();
    }

    public function updateActuals($revenue = null, $quantity = null, $orders = null, $newCustomers = null): void
    {
        if ($revenue !== null) {
            $this->actual_revenue = $revenue;
        }

        if ($quantity !== null) {
            $this->actual_quantity = $quantity;
        }

        if ($orders !== null) {
            $this->actual_orders = $orders;
        }

        if ($newCustomers !== null) {
            $this->actual_new_customers = $newCustomers;
        }

        $this->calculateAchievements();
    }

    public function calculateBonus(): float
    {
        if (!$this->bonus_percentage && !$this->bonus_amount) {
            return 0;
        }

        if ($this->bonus_amount) {
            // Fixed bonus if overall achievement >= 100%
            return $this->overall_achievement >= 100 ? $this->bonus_amount : 0;
        }

        if ($this->bonus_percentage) {
            // Percentage bonus based on actual revenue
            return $this->overall_achievement >= 100
                ? ($this->actual_revenue * $this->bonus_percentage / 100)
                : 0;
        }

        return 0;
    }
}
