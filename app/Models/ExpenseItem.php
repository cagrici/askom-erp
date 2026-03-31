<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpenseItem extends Model
{
    protected $fillable = [
        'expense_id',
        'description',
        'quantity',
        'unit_price',
        'total_amount',
        'vat_rate',
        'vat_amount',
        'account_code',
        'cost_center_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'vat_amount' => 'decimal:2',
    ];

    // Relationships
    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }

    // Accessors
    public function getFormattedTotalAmountAttribute()
    {
        return number_format($this->total_amount, 2, ',', '.');
    }

    public function getFormattedUnitPriceAttribute()
    {
        return number_format($this->unit_price, 2, ',', '.');
    }

    // Business Logic
    public function calculateVat()
    {
        if ($this->vat_rate > 0) {
            $this->vat_amount = $this->total_amount * ($this->vat_rate / 100);
        }
        
        return $this;
    }

    public function calculateTotalAmount()
    {
        $this->total_amount = $this->quantity * $this->unit_price;
        
        return $this;
    }

    // Boot method for model events
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            $item->calculateTotalAmount();
            $item->calculateVat();
        });

        static::updating(function ($item) {
            if ($item->isDirty(['quantity', 'unit_price', 'vat_rate'])) {
                $item->calculateTotalAmount();
                $item->calculateVat();
            }
        });
    }
}
