<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;
use Carbon\Carbon;

class InventoryItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'sku', 'barcode', 'internal_code', 'item_type', 'product_id',
        'name', 'description', 'category', 'brand', 'model',
        'weight', 'length', 'width', 'height', 'volume',
        'base_unit', 'purchase_unit', 'sales_unit', 'unit_conversion_factor',
        'minimum_stock', 'maximum_stock', 'reorder_point', 'reorder_quantity', 'lead_time_days',
        'lot_tracking_enabled', 'serial_number_tracking', 'expiry_tracking_enabled', 'default_shelf_life_days',
        'temperature_requirement', 'min_temperature', 'max_temperature', 'hazardous_material', 'storage_requirements',
        'valuation_method', 'standard_cost', 'average_cost', 'last_purchase_cost',
        'quality_check_required', 'quality_parameters', 'quality_check_frequency_days',
        'status', 'is_consumable', 'is_returnable', 'allow_negative_stock',
        'abc_classification', 'annual_consumption_value', 'movement_frequency',
        'suppliers', 'preferred_supplier_sku',
        'tags', 'custom_attributes', 'images', 'documents',
        'created_by', 'updated_by'
    ];

    protected $casts = [
        'storage_requirements' => 'array',
        'quality_parameters' => 'array',
        'suppliers' => 'array',
        'tags' => 'array',
        'custom_attributes' => 'array',
        'images' => 'array',
        'documents' => 'array',
        'lot_tracking_enabled' => 'boolean',
        'serial_number_tracking' => 'boolean',
        'expiry_tracking_enabled' => 'boolean',
        'hazardous_material' => 'boolean',
        'quality_check_required' => 'boolean',
        'is_consumable' => 'boolean',
        'is_returnable' => 'boolean',
        'allow_negative_stock' => 'boolean',
        'weight' => 'decimal:4',
        'length' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
        'volume' => 'decimal:4',
        'unit_conversion_factor' => 'decimal:4',
        'minimum_stock' => 'decimal:4',
        'maximum_stock' => 'decimal:4',
        'reorder_point' => 'decimal:4',
        'reorder_quantity' => 'decimal:4',
        'min_temperature' => 'decimal:2',
        'max_temperature' => 'decimal:2',
        'standard_cost' => 'decimal:4',
        'average_cost' => 'decimal:4',
        'last_purchase_cost' => 'decimal:4',
        'annual_consumption_value' => 'decimal:2',
    ];

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function stocks()
    {
        return $this->hasMany(InventoryStock::class);
    }

    public function movements()
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function barcodes()
    {
        return $this->morphMany(Barcode::class, 'entity');
    }

    public function alerts()
    {
        return $this->hasMany(InventoryAlert::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('item_type', $type);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeLowStock($query)
    {
        return $query->whereHas('stocks', function($q) {
            $q->whereRaw('quantity_available <= minimum_stock');
        });
    }

    public function scopeExpiringWithin($query, $days = 30)
    {
        return $query->whereHas('stocks', function($q) use ($days) {
            $q->where('expiry_date', '<=', Carbon::now()->addDays($days))
              ->where('expiry_date', '>', Carbon::now());
        });
    }

    public function scopeExpired($query)
    {
        return $query->whereHas('stocks', function($q) {
            $q->where('expiry_date', '<', Carbon::now());
        });
    }

    // Accessors
    public function getItemTypeTextAttribute()
    {
        return match($this->item_type) {
            'product' => 'Ürün',
            'raw_material' => 'Ham Madde',
            'component' => 'Bileşen',
            'spare_part' => 'Yedek Parça',
            default => ucfirst($this->item_type)
        };
    }

    public function getStatusTextAttribute()
    {
        return match($this->status) {
            'active' => 'Aktif',
            'inactive' => 'Pasif',
            'discontinued' => 'Üretimi Durduruldu',
            'obsolete' => 'Eskimiş',
            default => ucfirst($this->status)
        };
    }

    public function getTemperatureRequirementTextAttribute()
    {
        return match($this->temperature_requirement) {
            'ambient' => 'Oda Sıcaklığı',
            'refrigerated' => 'Soğutmalı',
            'frozen' => 'Dondurulmuş',
            'controlled' => 'Kontrollü',
            default => ucfirst($this->temperature_requirement)
        };
    }

    public function getTotalStockAttribute()
    {
        return $this->stocks()->sum('quantity_on_hand');
    }

    public function getAvailableStockAttribute()
    {
        return $this->stocks()->sum('quantity_available');
    }

    public function getAllocatedStockAttribute()
    {
        return $this->stocks()->sum('quantity_allocated');
    }

    public function getTotalStockValueAttribute()
    {
        return $this->stocks()->sum('total_cost');
    }

    public function getIsLowStockAttribute()
    {
        return $this->available_stock <= $this->reorder_point;
    }

    public function getIsOutOfStockAttribute()
    {
        return $this->available_stock <= 0;
    }

    public function getPrimaryBarcodeAttribute()
    {
        return $this->barcodes()->where('is_primary', true)->where('is_active', true)->first();
    }

    // Methods
    public static function generateSKU($prefix = 'ITM')
    {
        $lastItem = static::whereNotNull('sku')
            ->where('sku', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->first();

        if ($lastItem && preg_match('/' . $prefix . '(\d+)/', $lastItem->sku, $matches)) {
            $number = intval($matches[1]) + 1;
        } else {
            $number = 1;
        }

        return $prefix . str_pad($number, 6, '0', STR_PAD_LEFT);
    }

    public function generateBarcode()
    {
        if (!$this->barcode) {
            $barcode = 'BC' . str_pad($this->id, 10, '0', STR_PAD_LEFT);
            $this->update(['barcode' => $barcode]);
            
            // Create barcode record
            $this->barcodes()->create([
                'barcode' => $barcode,
                'barcode_type' => 'CODE128',
                'is_primary' => true,
                'is_active' => true,
                'purpose' => 'identification',
                'created_by' => auth()->id(),
            ]);
        }
        
        return $this->barcode;
    }

    public function getTotalStockByWarehouse($warehouseId = null)
    {
        $query = $this->stocks();
        
        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }
        
        return $query->sum('quantity_on_hand');
    }

    public function getAvailableStockByWarehouse($warehouseId = null)
    {
        $query = $this->stocks();
        
        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }
        
        return $query->sum('quantity_available');
    }

    public function getStockByLocation($warehouseId, $locationId)
    {
        return $this->stocks()
            ->where('warehouse_id', $warehouseId)
            ->where('warehouse_location_id', $locationId)
            ->sum('quantity_on_hand');
    }

    public function canAllocate($quantity, $warehouseId = null, $locationId = null)
    {
        $query = $this->stocks()->where('status', 'active');
        
        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }
        
        if ($locationId) {
            $query->where('warehouse_location_id', $locationId);
        }
        
        $availableStock = $query->sum('quantity_available');
        
        return $availableStock >= $quantity;
    }

    public function allocateStock($quantity, $warehouseId = null, $locationId = null, $reference = null)
    {
        if (!$this->canAllocate($quantity, $warehouseId, $locationId)) {
            return false;
        }
        
        $query = $this->stocks()
            ->where('status', 'active')
            ->where('quantity_available', '>', 0);
        
        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }
        
        if ($locationId) {
            $query->where('warehouse_location_id', $locationId);
        }
        
        // Use FIFO allocation strategy
        $stocks = $query->orderBy('received_date', 'asc')->get();
        $remainingQuantity = $quantity;
        $allocatedStocks = [];
        
        foreach ($stocks as $stock) {
            if ($remainingQuantity <= 0) break;
            
            $availableQuantity = $stock->quantity_available;
            $allocationQuantity = min($remainingQuantity, $availableQuantity);
            
            $stock->increment('quantity_allocated', $allocationQuantity);
            $stock->decrement('quantity_available', $allocationQuantity);
            
            $allocatedStocks[] = [
                'stock_id' => $stock->id,
                'quantity' => $allocationQuantity
            ];
            
            $remainingQuantity -= $allocationQuantity;
        }
        
        return $allocatedStocks;
    }

    public function releaseAllocation($quantity, $warehouseId = null, $locationId = null)
    {
        $query = $this->stocks()
            ->where('status', 'active')
            ->where('quantity_allocated', '>', 0);
        
        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }
        
        if ($locationId) {
            $query->where('warehouse_location_id', $locationId);
        }
        
        $stocks = $query->orderBy('received_date', 'desc')->get();
        $remainingQuantity = $quantity;
        
        foreach ($stocks as $stock) {
            if ($remainingQuantity <= 0) break;
            
            $allocatedQuantity = $stock->quantity_allocated;
            $releaseQuantity = min($remainingQuantity, $allocatedQuantity);
            
            $stock->decrement('quantity_allocated', $releaseQuantity);
            $stock->increment('quantity_available', $releaseQuantity);
            
            $remainingQuantity -= $releaseQuantity;
        }
        
        return $quantity - $remainingQuantity; // Return actual released quantity
    }

    public function updateAverageCosting()
    {
        $totalQuantity = $this->stocks()->where('status', 'active')->sum('quantity_on_hand');
        $totalValue = $this->stocks()->where('status', 'active')->sum('total_cost');
        
        if ($totalQuantity > 0) {
            $averageCost = $totalValue / $totalQuantity;
            $this->update(['average_cost' => $averageCost]);
        }
        
        return $this->average_cost;
    }

    public function performABCAnalysis($period = 12)
    {
        $movements = $this->movements()
            ->where('movement_date', '>=', Carbon::now()->subMonths($period))
            ->where('direction', 'out')
            ->get();
        
        $totalValue = $movements->sum(function($movement) {
            return $movement->quantity * $movement->unit_cost;
        });
        
        $frequency = $movements->count();
        
        $this->update([
            'annual_consumption_value' => $totalValue,
            'movement_frequency' => $frequency
        ]);
        
        // ABC classification would be done at system level comparing all items
        
        return [
            'consumption_value' => $totalValue,
            'frequency' => $frequency
        ];
    }

    public function checkLowStockAlert()
    {
        if ($this->is_low_stock && !$this->alerts()->where('alert_type', 'low_stock')->where('status', 'active')->exists()) {
            $this->alerts()->create([
                'alert_type' => 'low_stock',
                'severity' => 'medium',
                'title' => 'Düşük Stok Uyarısı',
                'message' => "'{$this->name}' ürününde düşük stok seviyesi tespit edildi.",
                'threshold_value' => $this->reorder_point,
                'current_value' => $this->available_stock,
                'triggered_at' => now(),
                'created_by' => auth()->id(),
            ]);
        }
    }

    public function checkExpiryAlerts($warningDays = 30)
    {
        $expiringStocks = $this->stocks()
            ->where('expiry_date', '<=', Carbon::now()->addDays($warningDays))
            ->where('expiry_date', '>', Carbon::now())
            ->where('quantity_on_hand', '>', 0)
            ->get();
        
        foreach ($expiringStocks as $stock) {
            $existingAlert = $this->alerts()
                ->where('alert_type', 'expiry_warning')
                ->where('inventory_stock_id', $stock->id)
                ->where('status', 'active')
                ->first();
            
            if (!$existingAlert) {
                $daysToExpiry = Carbon::now()->diffInDays($stock->expiry_date, false);
                
                $this->alerts()->create([
                    'alert_type' => 'expiry_warning',
                    'severity' => $daysToExpiry <= 7 ? 'high' : 'medium',
                    'inventory_stock_id' => $stock->id,
                    'warehouse_id' => $stock->warehouse_id,
                    'title' => 'Son Kullanma Tarihi Uyarısı',
                    'message' => "'{$this->name}' ürününün son kullanma tarihi yaklaşıyor ({$daysToExpiry} gün).",
                    'current_value' => $daysToExpiry,
                    'triggered_at' => now(),
                    'created_by' => auth()->id(),
                ]);
            }
        }
        
        // Check expired stocks
        $expiredStocks = $this->stocks()
            ->where('expiry_date', '<', Carbon::now())
            ->where('quantity_on_hand', '>', 0)
            ->get();
        
        foreach ($expiredStocks as $stock) {
            $existingAlert = $this->alerts()
                ->where('alert_type', 'expired_stock')
                ->where('inventory_stock_id', $stock->id)
                ->where('status', 'active')
                ->first();
            
            if (!$existingAlert) {
                $this->alerts()->create([
                    'alert_type' => 'expired_stock',
                    'severity' => 'high',
                    'inventory_stock_id' => $stock->id,
                    'warehouse_id' => $stock->warehouse_id,
                    'title' => 'Vadesi Geçmiş Stok',
                    'message' => "'{$this->name}' ürününün vadesi geçmiş stoku tespit edildi.",
                    'triggered_at' => now(),
                    'created_by' => auth()->id(),
                ]);
            }
        }
    }

    public function convertUnit($quantity, $fromUnit, $toUnit)
    {
        if ($fromUnit === $toUnit) {
            return $quantity;
        }
        
        // Convert to base unit first
        $baseQuantity = $quantity;
        if ($fromUnit !== $this->base_unit) {
            $baseQuantity = $quantity * $this->unit_conversion_factor;
        }
        
        // Convert from base unit to target unit
        if ($toUnit !== $this->base_unit) {
            return $baseQuantity / $this->unit_conversion_factor;
        }
        
        return $baseQuantity;
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($item) {
            if (!$item->sku) {
                $item->sku = static::generateSKU();
            }
        });
        
        static::created(function ($item) {
            $item->generateBarcode();
        });
    }
}