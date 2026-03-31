<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductUnit extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'unit_id',
        'unit_name',
        'unit_code',
        'conversion_factor',
        'barcode',
        'sale_price',
        'wholesale_price',
        'min_sale_price',
        'min_order_quantity',
        'is_base_unit',
        'is_active',
        'sort_order'
    ];

    protected $casts = [
        'conversion_factor' => 'decimal:4',
        'sale_price' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'min_sale_price' => 'decimal:2',
        'min_order_quantity' => 'integer',
        'is_base_unit' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer'
    ];

    // Relationships
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeBaseUnit($query)
    {
        return $query->where('is_base_unit', true);
    }

    // Methods
    public function calculatePiecesFromQuantity($quantity)
    {
        return $quantity * $this->conversion_factor;
    }

    public function calculateQuantityFromPieces($pieces)
    {
        return $pieces / $this->conversion_factor;
    }

    public function getPriceForQuantity($quantity, $priceType = 'sale')
    {
        $price = match($priceType) {
            'wholesale' => $this->wholesale_price ?? $this->sale_price,
            'min' => $this->min_sale_price ?? $this->sale_price,
            default => $this->sale_price
        };

        return $quantity * $price;
    }

    // Attributes
    public function getFormattedNameAttribute()
    {
        return "{$this->unit_name} ({$this->unit_code})";
    }

    public function getConversionTextAttribute()
    {
        if ($this->is_base_unit) {
            return 'Ana Birim';
        }

        $baseUnit = $this->product->units()->baseUnit()->first();
        if ($baseUnit) {
            return "1 {$this->unit_name} = {$this->conversion_factor} {$baseUnit->unit_name}";
        }

        return "1 {$this->unit_name} = {$this->conversion_factor} birim";
    }

    // Common unit definitions
    public static function commonUnits()
    {
        return [
            ['code' => 'PCS', 'name' => 'Adet', 'conversion' => 1],
            ['code' => 'PKG', 'name' => 'Paket', 'conversion' => 6],
            ['code' => 'BOX', 'name' => 'Kutu', 'conversion' => 12],
            ['code' => 'CTN', 'name' => 'Koli', 'conversion' => 60],
            ['code' => 'PLT', 'name' => 'Palet', 'conversion' => 720],
            ['code' => 'KG', 'name' => 'Kilogram', 'conversion' => 1],
            ['code' => 'LT', 'name' => 'Litre', 'conversion' => 1],
            ['code' => 'M', 'name' => 'Metre', 'conversion' => 1],
            ['code' => 'M2', 'name' => 'Metrekare', 'conversion' => 1],
            ['code' => 'M3', 'name' => 'Metreküp', 'conversion' => 1],
        ];
    }
}