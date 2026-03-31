<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarehouseOperationItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'operation_id', 'product_id', 'location_id',
        'quantity_expected', 'quantity_processed', 'quantity_remaining',
        'lot_number', 'serial_number', 'expiry_date', 'batch_code',
        'status', 'sequence_number', 'condition', 'condition_notes',
        'started_at', 'completed_at', 'processed_by',
        'from_location_id', 'to_location_id',
        'package_type', 'package_id', 'package_weight', 'package_dimensions',
        'unit_cost', 'total_cost',
        'has_discrepancy', 'discrepancy_reason', 'discrepancy_quantity',
        'notes'
    ];

    protected $casts = [
        'quantity_expected' => 'decimal:2',
        'quantity_processed' => 'decimal:2',
        'quantity_remaining' => 'decimal:2',
        'package_weight' => 'decimal:2',
        'package_dimensions' => 'array',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'discrepancy_quantity' => 'decimal:2',
        'expiry_date' => 'date',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'has_discrepancy' => 'boolean',
    ];

    /**
     * Get operation
     */
    public function operation(): BelongsTo
    {
        return $this->belongsTo(WarehouseOperation::class, 'operation_id');
    }

    /**
     * Get product
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get location
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class);
    }

    /**
     * Get from location
     */
    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'from_location_id');
    }

    /**
     * Get to location
     */
    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'to_location_id');
    }

    /**
     * Get processed by user
     */
    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Get status text
     */
    public function getStatusTextAttribute()
    {
        $statuses = [
            'pending' => 'Bekliyor',
            'in_progress' => 'İşlemde',
            'completed' => 'Tamamlandı',
            'partially_completed' => 'Kısmen Tamamlandı',
            'failed' => 'Başarısız'
        ];

        return $statuses[$this->status] ?? $this->status;
    }

    /**
     * Get condition text
     */
    public function getConditionTextAttribute()
    {
        $conditions = [
            'good' => 'İyi',
            'damaged' => 'Hasarlı',
            'expired' => 'Süresi Dolmuş',
            'quarantine' => 'Karantinada'
        ];

        return $conditions[$this->condition] ?? $this->condition;
    }

    /**
     * Get completion percentage
     */
    public function getCompletionPercentageAttribute()
    {
        return $this->quantity_expected > 0 ? 
            ($this->quantity_processed / $this->quantity_expected) * 100 : 0;
    }

    /**
     * Check if item is fully processed
     */
    public function isFullyProcessed()
    {
        return $this->quantity_processed >= $this->quantity_expected;
    }

    /**
     * Check if item has discrepancy
     */
    public function hasDiscrepancy()
    {
        return $this->has_discrepancy || 
               abs($this->quantity_processed - $this->quantity_expected) > 0.01;
    }

    /**
     * Process item quantity
     */
    public function process($quantity, $userId = null, $notes = null)
    {
        $processedQuantity = min($quantity, $this->quantity_remaining);
        
        $this->update([
            'quantity_processed' => $this->quantity_processed + $processedQuantity,
            'quantity_remaining' => $this->quantity_remaining - $processedQuantity,
            'processed_by' => $userId,
            'status' => $this->quantity_remaining <= $processedQuantity ? 'completed' : 'partially_completed',
            'completed_at' => $this->quantity_remaining <= $processedQuantity ? now() : null,
            'notes' => $notes
        ]);

        return $processedQuantity;
    }

    /**
     * Record discrepancy
     */
    public function recordDiscrepancy($actualQuantity, $reason = null)
    {
        $discrepancy = $actualQuantity - $this->quantity_expected;
        
        $this->update([
            'has_discrepancy' => true,
            'discrepancy_quantity' => $discrepancy,
            'discrepancy_reason' => $reason,
            'quantity_processed' => $actualQuantity
        ]);
    }

    /**
     * Update package information
     */
    public function updatePackage($type, $id, $weight = null, $dimensions = null)
    {
        $this->update([
            'package_type' => $type,
            'package_id' => $id,
            'package_weight' => $weight,
            'package_dimensions' => $dimensions
        ]);
    }
}