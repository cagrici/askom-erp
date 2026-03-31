<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class SalesReturnImage extends Model
{
    protected $fillable = [
        'sales_return_id',
        'sales_return_item_id',
        'image_path',
        'image_type',
        'uploaded_by_id',
        'description',
        'sort_order',
    ];

    protected $appends = [
        'image_url',
        'type_label',
    ];

    // Image type constants
    const TYPE_RETURN_REQUEST = 'return_request';
    const TYPE_PICKUP_CONFIRMATION = 'pickup_confirmation';
    const TYPE_WAREHOUSE_INSPECTION = 'warehouse_inspection';

    /**
     * Relationships
     */
    public function salesReturn(): BelongsTo
    {
        return $this->belongsTo(SalesReturn::class);
    }

    public function salesReturnItem(): BelongsTo
    {
        return $this->belongsTo(SalesReturnItem::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_id');
    }

    /**
     * Accessors
     */
    public function getImageUrlAttribute(): string
    {
        if (Storage::disk('public')->exists($this->image_path)) {
            return Storage::disk('public')->url($this->image_path);
        }

        return asset('storage/' . $this->image_path);
    }

    public function getTypeLabelAttribute(): string
    {
        return match($this->image_type) {
            self::TYPE_RETURN_REQUEST => 'İade Talebi',
            self::TYPE_PICKUP_CONFIRMATION => 'Teslim Alım',
            self::TYPE_WAREHOUSE_INSPECTION => 'Depo İnceleme',
            default => $this->image_type,
        };
    }

    /**
     * Static helper methods
     */
    public static function getTypes(): array
    {
        return [
            self::TYPE_RETURN_REQUEST => 'İade Talebi',
            self::TYPE_PICKUP_CONFIRMATION => 'Teslim Alım',
            self::TYPE_WAREHOUSE_INSPECTION => 'Depo İnceleme',
        ];
    }

    /**
     * Delete image file when model is deleted
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($image) {
            if (Storage::disk('public')->exists($image->image_path)) {
                Storage::disk('public')->delete($image->image_path);
            }
        });
    }
}
