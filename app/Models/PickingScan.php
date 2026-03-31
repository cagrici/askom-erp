<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PickingScan extends Model
{
    use HasFactory;

    protected $fillable = [
        'picking_task_id',
        'picking_task_item_id',
        'product_id',
        'scanned_by_id',
        'barcode',
        'quantity',
        'scan_result',
        'error_message',
        'corridor',
        'shelf',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
    ];

    protected $appends = ['scan_result_label'];

    // Scan result constants
    const RESULT_SUCCESS = 'success';
    const RESULT_WRONG_PRODUCT = 'wrong_product';
    const RESULT_WRONG_ORDER = 'wrong_order';
    const RESULT_NOT_FOUND = 'not_found';

    /**
     * Get all possible scan results
     */
    public static function getScanResults(): array
    {
        return [
            self::RESULT_SUCCESS => 'Başarılı',
            self::RESULT_WRONG_PRODUCT => 'Yanlış Ürün',
            self::RESULT_WRONG_ORDER => 'Yanlış Sipariş',
            self::RESULT_NOT_FOUND => 'Bulunamadı',
        ];
    }

    // Relationships

    public function pickingTask(): BelongsTo
    {
        return $this->belongsTo(PickingTask::class);
    }

    public function pickingTaskItem(): BelongsTo
    {
        return $this->belongsTo(PickingTaskItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function scannedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scanned_by_id');
    }

    // Scopes

    public function scopeSuccessful($query)
    {
        return $query->where('scan_result', self::RESULT_SUCCESS);
    }

    public function scopeFailed($query)
    {
        return $query->where('scan_result', '!=', self::RESULT_SUCCESS);
    }

    public function scopeByResult($query, $result)
    {
        return $query->where('scan_result', $result);
    }

    // Attribute accessors

    public function getScanResultLabelAttribute(): string
    {
        return self::getScanResults()[$this->scan_result] ?? $this->scan_result;
    }

    // Helper methods

    public function isSuccessful(): bool
    {
        return $this->scan_result === self::RESULT_SUCCESS;
    }

    public function isFailed(): bool
    {
        return $this->scan_result !== self::RESULT_SUCCESS;
    }
}
