<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'movement_number',
        'inventory_item_id',
        'inventory_stock_id',
        'product_id', // Add product_id for direct product reference
        'movement_type',
        'direction',
        'warehouse_id',
        'warehouse_location_id',
        'from_warehouse_id',
        'from_location_id',
        'to_warehouse_id',
        'to_location_id',
        'quantity',
        'unit',
        'base_quantity',
        'lot_number',
        'batch_code',
        'serial_number',
        'unit_cost',
        'total_cost',
        'cost_currency',
        'movement_date',
        'effective_date',
        'expiry_date',
        'reference_type',
        'reference_number',
        'reference_id',
        'external_reference',
        'document_type',
        'document_number',
        'document_date',
        'partner_type',
        'partner_name',
        'partner_id',
        'condition_before',
        'condition_after',
        'quality_check_done',
        'quality_results',
        'notes', // Add notes field
        'created_by_id', // Add created_by_id field
        'package_type',
        'package_id',
        'package_weight',
        'container_number',
        'reason_code',
        'reason_description',
        'notes',
        'requires_approval',
        'approval_status',
        'approved_by',
        'approved_at',
        'approval_notes',
        'stock_before',
        'stock_after',
        'is_system_generated',
        'source_system',
        'is_reversed',
        'reversed_by_movement_id',
        'scanned_barcode',
        'scan_timestamp',
        'scanner_device',
        'temperature_at_movement',
        'temperature_compliant',
        'custom_attributes',
        'status',
        'error_message',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'base_quantity' => 'decimal:4',
        'unit_cost' => 'decimal:4',
        'total_cost' => 'decimal:4',
        'package_weight' => 'decimal:4',
        'temperature_at_movement' => 'decimal:2',
        'stock_before' => 'decimal:4',
        'stock_after' => 'decimal:4',
        'movement_date' => 'datetime',
        'effective_date' => 'datetime',
        'expiry_date' => 'date',
        'document_date' => 'date',
        'approved_at' => 'datetime',
        'scan_timestamp' => 'datetime',
        'quality_check_done' => 'boolean',
        'requires_approval' => 'boolean',
        'is_system_generated' => 'boolean',
        'is_reversed' => 'boolean',
        'temperature_compliant' => 'boolean',
        'quality_results' => 'array',
        'custom_attributes' => 'array',
        'reference_id' => 'integer',
        'partner_id' => 'integer',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'approved_by' => 'integer',
        'reversed_by_movement_id' => 'integer'
    ];

    // Boot method to calculate total cost
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($movement) {
            // Generate movement number if not provided
            if (empty($movement->movement_number)) {
                $movement->movement_number = static::generateMovementNumber($movement->movement_type);
            }
            
            if ($movement->unit_cost && $movement->quantity && !$movement->total_cost) {
                $movement->total_cost = $movement->unit_cost * $movement->quantity;
            }
        });

        static::created(function ($movement) {
            // Update product stock after movement
            $movement->updateProductStock();
        });
    }

    // Relationships
    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function inventoryStock(): BelongsTo
    {
        return $this->belongsTo(InventoryStock::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function warehouseLocation(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class);
    }

    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'from_location_id');
    }

    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'to_location_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function reversedByMovement(): BelongsTo
    {
        return $this->belongsTo(InventoryMovement::class, 'reversed_by_movement_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    // Scopes
    public function scopeIncoming($query)
    {
        return $query->where('direction', 'in');
    }

    public function scopeOutgoing($query)
    {
        return $query->where('direction', 'out');
    }

    public function scopeTransfers($query)
    {
        return $query->where('direction', 'transfer');
    }

    public function scopeByInventoryItem($query, $inventoryItemId)
    {
        return $query->where('inventory_item_id', $inventoryItemId);
    }

    public function scopeByWarehouse($query, $warehouseId)
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('movement_date', [$startDate, $endDate]);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByApprovalStatus($query, $status)
    {
        return $query->where('approval_status', $status);
    }

    // Methods
    public static function generateMovementNumber($movementType = 'adjustment')
    {
        $prefix = match($movementType) {
            'receipt' => 'REC',
            'issue' => 'ISS', 
            'transfer' => 'TRF',
            'adjustment' => 'ADJ',
            'return' => 'RET',
            'production_consume' => 'PC',
            'production_output' => 'PO',
            'cycle_count' => 'CC',
            default => 'MOV'
        };
        
        $date = now()->format('Ymd');
        $lastMovement = static::where('movement_number', 'like', "{$prefix}-{$date}-%")
            ->orderBy('movement_number', 'desc')
            ->first();
        
        if ($lastMovement) {
            $lastNumber = (int) substr($lastMovement->movement_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return sprintf('%s-%s-%04d', $prefix, $date, $newNumber);
    }

    public function updateProductStock()
    {
        $inventoryItem = $this->inventoryItem;
        
        if (!$inventoryItem) {
            return;
        }

        // Update stock based on direction
        switch ($this->direction) {
            case 'in':
                $inventoryItem->increment('stock_quantity', $this->base_quantity);
                break;
            case 'out':
                $inventoryItem->decrement('stock_quantity', $this->base_quantity);
                break;
            case 'transfer':
                // Transfer movements might need special handling
                break;
        }
    }

    // Get reference model dynamically
    public function getReference()
    {
        if (!$this->reference_type || !$this->reference_id) {
            return null;
        }

        $modelClass = match($this->reference_type) {
            'purchase_order' => 'App\\Models\\PurchaseOrder',
            'sales_order' => 'App\\Models\\SalesOrder',
            'transfer' => 'App\\Models\\StockTransfer',
            'adjustment' => 'App\\Models\\StockAdjustment',
            default => null
        };

        if ($modelClass && class_exists($modelClass)) {
            return $modelClass::find($this->reference_id);
        }

        return null;
    }

    // Attributes
    public function getFormattedQuantityAttribute()
    {
        $quantity = number_format($this->quantity, 4);
        if ($this->unit) {
            return "{$quantity} {$this->unit}";
        }
        return $quantity;
    }

    public function getMovementTypeTextAttribute()
    {
        return match($this->movement_type) {
            'receipt' => 'Mal Kabul',
            'issue' => 'Çıkış',
            'transfer' => 'Transfer',
            'adjustment' => 'Düzeltme',
            'return' => 'İade',
            'production_consume' => 'Üretim Tüketim',
            'production_output' => 'Üretim Çıktı',
            'cycle_count' => 'Sayım',
            'damage' => 'Hasar',
            'loss' => 'Kayıp',
            'found' => 'Bulunan',
            'scrap' => 'Hurda',
            'sample' => 'Numune',
            default => $this->movement_type
        };
    }

    public function getDirectionTextAttribute()
    {
        return match($this->direction) {
            'in' => 'Giriş',
            'out' => 'Çıkış',
            'transfer' => 'Transfer',
            default => $this->direction
        };
    }

    public function getDirectionColorAttribute()
    {
        return match($this->direction) {
            'in' => 'success',
            'out' => 'danger',
            'transfer' => 'info',
            default => 'secondary'
        };
    }

    public function getStatusColorAttribute()
    {
        return match($this->status) {
            'draft' => 'secondary',
            'pending' => 'warning',
            'completed' => 'success',
            'cancelled' => 'danger',
            'error' => 'danger',
            default => 'secondary'
        };
    }
}