<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class InventoryStock extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'inventory_item_id', 'warehouse_id', 'warehouse_location_id',
        'lot_number', 'batch_code', 'serial_number',
        'quantity_on_hand', 'quantity_allocated', 'quantity_available', 'quantity_in_transit', 'quantity_on_order',
        'unit_cost', 'total_cost', 'cost_currency',
        'received_date', 'manufactured_date', 'expiry_date', 'best_before_date', 'last_counted_date',
        'condition', 'condition_notes', 'quality_approved', 'quality_test_results',
        'actual_weight', 'package_weight', 'package_type', 'package_dimensions',
        'supplier_name', 'supplier_invoice_number', 'purchase_order_number',
        'valuation_method', 'fifo_cost', 'average_cost', 'cost_layers',
        'movement_count', 'last_movement_date', 'last_movement_type',
        'cycle_count_required', 'next_cycle_count_date', 'cycle_count_variance',
        'status', 'is_locked', 'lock_reason', 'locked_at', 'locked_by',
        'current_temperature', 'min_recorded_temperature', 'max_recorded_temperature', 'temperature_last_checked',
        'reference_number', 'custom_fields', 'notes',
        'created_by', 'updated_by'
    ];

    protected $casts = [
        'quality_test_results' => 'array',
        'cost_layers' => 'array',
        'custom_fields' => 'array',
        'quality_approved' => 'boolean',
        'cycle_count_required' => 'boolean',
        'is_locked' => 'boolean',
        'quantity_on_hand' => 'decimal:4',
        'quantity_allocated' => 'decimal:4',
        'quantity_available' => 'decimal:4',
        'quantity_in_transit' => 'decimal:4',
        'quantity_on_order' => 'decimal:4',
        'unit_cost' => 'decimal:4',
        'total_cost' => 'decimal:4',
        'fifo_cost' => 'decimal:4',
        'average_cost' => 'decimal:4',
        'actual_weight' => 'decimal:4',
        'package_weight' => 'decimal:4',
        'current_temperature' => 'decimal:2',
        'min_recorded_temperature' => 'decimal:2',
        'max_recorded_temperature' => 'decimal:2',
        'received_date' => 'date',
        'manufactured_date' => 'date',
        'expiry_date' => 'date',
        'best_before_date' => 'date',
        'last_counted_date' => 'date',
        'next_cycle_count_date' => 'date',
        'last_movement_date' => 'datetime',
        'locked_at' => 'datetime',
        'temperature_last_checked' => 'datetime',
    ];

    // Relationships
    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function location()
    {
        return $this->belongsTo(WarehouseLocation::class, 'warehouse_location_id');
    }

    public function movements()
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function alerts()
    {
        return $this->hasMany(InventoryAlert::class);
    }

    public function lockedBy()
    {
        return $this->belongsTo(User::class, 'locked_by');
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

    public function scopeAvailable($query)
    {
        return $query->where('status', 'active')
                    ->where('is_locked', false)
                    ->where('quantity_available', '>', 0);
    }

    public function scopeByWarehouse($query, $warehouseId)
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    public function scopeByLocation($query, $locationId)
    {
        return $query->where('warehouse_location_id', $locationId);
    }

    public function scopeByLot($query, $lotNumber)
    {
        return $query->where('lot_number', $lotNumber);
    }

    public function scopeExpiringWithin($query, $days = 30)
    {
        return $query->where('expiry_date', '<=', Carbon::now()->addDays($days))
                    ->where('expiry_date', '>', Carbon::now());
    }

    public function scopeExpired($query)
    {
        return $query->where('expiry_date', '<', Carbon::now());
    }

    public function scopeRequiresCycleCount($query)
    {
        return $query->where('cycle_count_required', true)
                    ->where('next_cycle_count_date', '<=', Carbon::now());
    }

    // Accessors
    public function getConditionTextAttribute()
    {
        return match($this->condition) {
            'good' => 'İyi',
            'damaged' => 'Hasarlı',
            'expired' => 'Vadesi Geçmiş',
            'quarantine' => 'Karantina',
            'returned' => 'İade',
            default => ucfirst($this->condition)
        };
    }

    public function getStatusTextAttribute()
    {
        return match($this->status) {
            'active' => 'Aktif',
            'hold' => 'Beklemede',
            'quarantine' => 'Karantina',
            'blocked' => 'Blokeli',
            'obsolete' => 'Eskimiş',
            default => ucfirst($this->status)
        };
    }

    public function getDaysToExpiryAttribute()
    {
        if (!$this->expiry_date) {
            return null;
        }
        
        return Carbon::now()->diffInDays($this->expiry_date, false);
    }

    public function getIsExpiredAttribute()
    {
        return $this->expiry_date && Carbon::now()->isAfter($this->expiry_date);
    }

    public function getIsExpiringAttribute()
    {
        if (!$this->expiry_date) {
            return false;
        }
        
        $daysToExpiry = $this->days_to_expiry;
        return $daysToExpiry !== null && $daysToExpiry <= 30 && $daysToExpiry > 0;
    }

    public function getValuationAmountAttribute()
    {
        return $this->quantity_on_hand * $this->unit_cost;
    }

    public function getUtilizationPercentageAttribute()
    {
        if ($this->quantity_on_hand <= 0) {
            return 0;
        }
        
        return ($this->quantity_allocated / $this->quantity_on_hand) * 100;
    }

    public function getIsAvailableAttribute()
    {
        return $this->status === 'active' 
            && !$this->is_locked 
            && $this->quantity_available > 0;
    }

    // Methods
    public function adjustQuantity($quantity, $reason = null, $userId = null)
    {
        $oldQuantity = $this->quantity_on_hand;
        $newQuantity = $oldQuantity + $quantity;
        
        if ($newQuantity < 0 && !$this->inventoryItem->allow_negative_stock) {
            throw new \Exception('Negatif stok seviyesine düşülemez.');
        }
        
        $this->update([
            'quantity_on_hand' => $newQuantity,
            'quantity_available' => $this->quantity_available + $quantity,
            'total_cost' => $newQuantity * $this->unit_cost,
            'movement_count' => $this->movement_count + 1,
            'last_movement_date' => now(),
            'last_movement_type' => 'adjustment',
            'updated_by' => $userId ?? auth()->id(),
        ]);
        
        // Create movement record
        $this->movements()->create([
            'movement_number' => InventoryMovement::generateMovementNumber('adjustment'),
            'inventory_item_id' => $this->inventory_item_id,
            'movement_type' => 'adjustment',
            'direction' => $quantity > 0 ? 'in' : 'out',
            'warehouse_id' => $this->warehouse_id,
            'warehouse_location_id' => $this->warehouse_location_id,
            'quantity' => abs($quantity),
            'unit' => $this->inventoryItem->base_unit,
            'base_quantity' => abs($quantity),
            'lot_number' => $this->lot_number,
            'batch_code' => $this->batch_code,
            'serial_number' => $this->serial_number,
            'unit_cost' => $this->unit_cost,
            'total_cost' => abs($quantity) * $this->unit_cost,
            'movement_date' => now(),
            'reason_description' => $reason,
            'stock_before' => $oldQuantity,
            'stock_after' => $newQuantity,
            'created_by' => $userId ?? auth()->id(),
        ]);
        
        return $this;
    }

    public function allocate($quantity, $reference = null, $userId = null)
    {
        if ($this->quantity_available < $quantity) {
            throw new \Exception('Yetersiz müsait stok.');
        }
        
        $this->update([
            'quantity_allocated' => $this->quantity_allocated + $quantity,
            'quantity_available' => $this->quantity_available - $quantity,
            'updated_by' => $userId ?? auth()->id(),
        ]);
        
        return $this;
    }

    public function releaseAllocation($quantity, $reference = null, $userId = null)
    {
        $releaseQuantity = min($quantity, $this->quantity_allocated);
        
        $this->update([
            'quantity_allocated' => $this->quantity_allocated - $releaseQuantity,
            'quantity_available' => $this->quantity_available + $releaseQuantity,
            'updated_by' => $userId ?? auth()->id(),
        ]);
        
        return $releaseQuantity;
    }

    public function consume($quantity, $reference = null, $userId = null)
    {
        if ($this->quantity_allocated < $quantity) {
            throw new \Exception('Yetersiz ayrılmış stok.');
        }
        
        $this->update([
            'quantity_on_hand' => $this->quantity_on_hand - $quantity,
            'quantity_allocated' => $this->quantity_allocated - $quantity,
            'total_cost' => ($this->quantity_on_hand - $quantity) * $this->unit_cost,
            'movement_count' => $this->movement_count + 1,
            'last_movement_date' => now(),
            'last_movement_type' => 'issue',
            'updated_by' => $userId ?? auth()->id(),
        ]);
        
        // Create movement record
        $this->movements()->create([
            'movement_number' => InventoryMovement::generateMovementNumber('issue'),
            'inventory_item_id' => $this->inventory_item_id,
            'movement_type' => 'issue',
            'direction' => 'out',
            'warehouse_id' => $this->warehouse_id,
            'warehouse_location_id' => $this->warehouse_location_id,
            'quantity' => $quantity,
            'unit' => $this->inventoryItem->base_unit,
            'base_quantity' => $quantity,
            'lot_number' => $this->lot_number,
            'batch_code' => $this->batch_code,
            'serial_number' => $this->serial_number,
            'unit_cost' => $this->unit_cost,
            'total_cost' => $quantity * $this->unit_cost,
            'movement_date' => now(),
            'reference_type' => $reference['type'] ?? null,
            'reference_number' => $reference['number'] ?? null,
            'reference_id' => $reference['id'] ?? null,
            'stock_before' => $this->quantity_on_hand + $quantity,
            'stock_after' => $this->quantity_on_hand,
            'created_by' => $userId ?? auth()->id(),
        ]);
        
        return $this;
    }

    public function receive($quantity, $unitCost = null, $additionalData = [], $userId = null)
    {
        $unitCost = $unitCost ?? $this->unit_cost;
        
        $this->update([
            'quantity_on_hand' => $this->quantity_on_hand + $quantity,
            'quantity_available' => $this->quantity_available + $quantity,
            'unit_cost' => $unitCost,
            'total_cost' => ($this->quantity_on_hand + $quantity) * $unitCost,
            'movement_count' => $this->movement_count + 1,
            'last_movement_date' => now(),
            'last_movement_type' => 'receipt',
            'received_date' => $additionalData['received_date'] ?? now(),
            'supplier_name' => $additionalData['supplier_name'] ?? $this->supplier_name,
            'supplier_invoice_number' => $additionalData['invoice_number'] ?? $this->supplier_invoice_number,
            'purchase_order_number' => $additionalData['po_number'] ?? $this->purchase_order_number,
            'updated_by' => $userId ?? auth()->id(),
        ]);
        
        // Create movement record
        $this->movements()->create([
            'movement_number' => InventoryMovement::generateMovementNumber('receipt'),
            'inventory_item_id' => $this->inventory_item_id,
            'movement_type' => 'receipt',
            'direction' => 'in',
            'warehouse_id' => $this->warehouse_id,
            'warehouse_location_id' => $this->warehouse_location_id,
            'quantity' => $quantity,
            'unit' => $this->inventoryItem->base_unit,
            'base_quantity' => $quantity,
            'lot_number' => $this->lot_number,
            'batch_code' => $this->batch_code,
            'serial_number' => $this->serial_number,
            'unit_cost' => $unitCost,
            'total_cost' => $quantity * $unitCost,
            'movement_date' => now(),
            'partner_type' => 'supplier',
            'partner_name' => $additionalData['supplier_name'] ?? null,
            'document_type' => 'invoice',
            'document_number' => $additionalData['invoice_number'] ?? null,
            'stock_before' => $this->quantity_on_hand - $quantity,
            'stock_after' => $this->quantity_on_hand,
            'created_by' => $userId ?? auth()->id(),
        ]);
        
        return $this;
    }

    public function transferTo($targetStock, $quantity, $userId = null)
    {
        if ($this->quantity_available < $quantity) {
            throw new \Exception('Yetersiz müsait stok.');
        }
        
        // Decrease from source
        $this->update([
            'quantity_on_hand' => $this->quantity_on_hand - $quantity,
            'quantity_available' => $this->quantity_available - $quantity,
            'total_cost' => ($this->quantity_on_hand - $quantity) * $this->unit_cost,
            'movement_count' => $this->movement_count + 1,
            'last_movement_date' => now(),
            'last_movement_type' => 'transfer',
            'updated_by' => $userId ?? auth()->id(),
        ]);
        
        // Increase target
        $targetStock->update([
            'quantity_on_hand' => $targetStock->quantity_on_hand + $quantity,
            'quantity_available' => $targetStock->quantity_available + $quantity,
            'total_cost' => ($targetStock->quantity_on_hand + $quantity) * $this->unit_cost,
            'movement_count' => $targetStock->movement_count + 1,
            'last_movement_date' => now(),
            'last_movement_type' => 'transfer',
            'updated_by' => $userId ?? auth()->id(),
        ]);
        
        // Create movement records
        $transferNumber = InventoryMovement::generateMovementNumber('transfer');
        
        // Out movement
        $this->movements()->create([
            'movement_number' => $transferNumber,
            'inventory_item_id' => $this->inventory_item_id,
            'movement_type' => 'transfer',
            'direction' => 'out',
            'warehouse_id' => $this->warehouse_id,
            'warehouse_location_id' => $this->warehouse_location_id,
            'to_warehouse_id' => $targetStock->warehouse_id,
            'to_location_id' => $targetStock->warehouse_location_id,
            'quantity' => $quantity,
            'unit' => $this->inventoryItem->base_unit,
            'base_quantity' => $quantity,
            'lot_number' => $this->lot_number,
            'unit_cost' => $this->unit_cost,
            'total_cost' => $quantity * $this->unit_cost,
            'movement_date' => now(),
            'stock_before' => $this->quantity_on_hand + $quantity,
            'stock_after' => $this->quantity_on_hand,
            'created_by' => $userId ?? auth()->id(),
        ]);
        
        // In movement
        $targetStock->movements()->create([
            'movement_number' => $transferNumber,
            'inventory_item_id' => $targetStock->inventory_item_id,
            'movement_type' => 'transfer',
            'direction' => 'in',
            'warehouse_id' => $targetStock->warehouse_id,
            'warehouse_location_id' => $targetStock->warehouse_location_id,
            'from_warehouse_id' => $this->warehouse_id,
            'from_location_id' => $this->warehouse_location_id,
            'quantity' => $quantity,
            'unit' => $this->inventoryItem->base_unit,
            'base_quantity' => $quantity,
            'lot_number' => $this->lot_number,
            'unit_cost' => $this->unit_cost,
            'total_cost' => $quantity * $this->unit_cost,
            'movement_date' => now(),
            'stock_before' => $targetStock->quantity_on_hand - $quantity,
            'stock_after' => $targetStock->quantity_on_hand,
            'created_by' => $userId ?? auth()->id(),
        ]);
        
        return $this;
    }

    public function lock($reason, $userId = null)
    {
        $this->update([
            'is_locked' => true,
            'lock_reason' => $reason,
            'locked_at' => now(),
            'locked_by' => $userId ?? auth()->id(),
        ]);
        
        return $this;
    }

    public function unlock($userId = null)
    {
        $this->update([
            'is_locked' => false,
            'lock_reason' => null,
            'locked_at' => null,
            'locked_by' => null,
            'updated_by' => $userId ?? auth()->id(),
        ]);
        
        return $this;
    }

    public function performCycleCount($countedQuantity, $userId = null, $notes = null)
    {
        $variance = $countedQuantity - $this->quantity_on_hand;
        
        $this->update([
            'cycle_count_variance' => $variance,
            'last_counted_date' => now(),
            'cycle_count_required' => false,
            'next_cycle_count_date' => Carbon::now()->addDays(30), // Next cycle count in 30 days
            'updated_by' => $userId ?? auth()->id(),
        ]);
        
        if ($variance != 0) {
            // Create adjustment movement for variance
            $this->adjustQuantity($variance, "Cycle count adjustment: {$notes}", $userId);
        }
        
        // Create cycle count movement
        $this->movements()->create([
            'movement_number' => InventoryMovement::generateMovementNumber('cycle_count'),
            'inventory_item_id' => $this->inventory_item_id,
            'movement_type' => 'cycle_count',
            'direction' => $variance > 0 ? 'in' : 'out',
            'warehouse_id' => $this->warehouse_id,
            'warehouse_location_id' => $this->warehouse_location_id,
            'quantity' => abs($variance),
            'unit' => $this->inventoryItem->base_unit,
            'base_quantity' => abs($variance),
            'lot_number' => $this->lot_number,
            'unit_cost' => $this->unit_cost,
            'movement_date' => now(),
            'reason_description' => "Cycle count variance: {$variance}",
            'notes' => $notes,
            'stock_before' => $this->quantity_on_hand - $variance,
            'stock_after' => $this->quantity_on_hand,
            'created_by' => $userId ?? auth()->id(),
        ]);
        
        return $variance;
    }

    public function updateTemperature($temperature, $userId = null)
    {
        $this->update([
            'current_temperature' => $temperature,
            'min_recorded_temperature' => min($this->min_recorded_temperature ?? $temperature, $temperature),
            'max_recorded_temperature' => max($this->max_recorded_temperature ?? $temperature, $temperature),
            'temperature_last_checked' => now(),
            'updated_by' => $userId ?? auth()->id(),
        ]);
        
        // Check temperature compliance
        $item = $this->inventoryItem;
        if ($item->min_temperature && $temperature < $item->min_temperature) {
            $this->alerts()->create([
                'alert_type' => 'temperature_breach',
                'severity' => 'high',
                'title' => 'Sıcaklık Uyarısı',
                'message' => "Minimum sıcaklık seviyesinin altında ({$temperature}°C < {$item->min_temperature}°C)",
                'current_value' => $temperature,
                'threshold_value' => $item->min_temperature,
                'triggered_at' => now(),
                'created_by' => $userId ?? auth()->id(),
            ]);
        }
        
        if ($item->max_temperature && $temperature > $item->max_temperature) {
            $this->alerts()->create([
                'alert_type' => 'temperature_breach',
                'severity' => 'high',
                'title' => 'Sıcaklık Uyarısı',
                'message' => "Maksimum sıcaklık seviyesinin üstünde ({$temperature}°C > {$item->max_temperature}°C)",
                'current_value' => $temperature,
                'threshold_value' => $item->max_temperature,
                'triggered_at' => now(),
                'created_by' => $userId ?? auth()->id(),
            ]);
        }
        
        return $this;
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($stock) {
            $stock->quantity_available = $stock->quantity_on_hand;
            $stock->total_cost = $stock->quantity_on_hand * $stock->unit_cost;
        });
        
        static::updating(function ($stock) {
            if ($stock->isDirty('quantity_on_hand') || $stock->isDirty('unit_cost')) {
                $stock->total_cost = $stock->quantity_on_hand * $stock->unit_cost;
            }
        });
    }
}