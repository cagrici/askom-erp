<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProductImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id', 'image_path', 'thumbnail_path',
        'alt_text', 'is_primary', 'sort_order'
    ];

    protected $casts = [
        'is_primary' => 'boolean'
    ];

    protected $appends = [
        'image_url',
        'thumbnail_url'
    ];

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($image) {
            // Resim dosyalarını sil
            if ($image->image_path) {
                Storage::disk('public')->delete($image->image_path);
            }
            if ($image->thumbnail_path) {
                Storage::disk('public')->delete($image->thumbnail_path);
            }
        });
    }

    // Relationships
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Accessors
    public function getImageUrlAttribute(): string
    {
        if (!$this->image_path) {
            return asset('images/no-image.png');
        }
        
        // Try Storage::url first, fallback to direct path if symlink is broken
        try {
            $url = Storage::url($this->image_path);
            return $url;
        } catch (\Exception $e) {
            // Fallback to direct storage path if Storage::url fails
            return asset('storage/' . $this->image_path);
        }
    }

    public function getThumbnailUrlAttribute(): string
    {
        if (!$this->thumbnail_path) {
            return $this->image_url;
        }
        
        try {
            $url = Storage::url($this->thumbnail_path);
            return $url;
        } catch (\Exception $e) {
            // Fallback to direct storage path if Storage::url fails
            return asset('storage/' . $this->thumbnail_path);
        }
    }

    // Methods
    public function makePrimary(): bool
    {
        // Diğer resimlerin primary durumunu kaldır
        $this->product->images()->where('id', '!=', $this->id)->update(['is_primary' => false]);
        
        // Bu resmi primary yap
        $this->is_primary = true;
        return $this->save();
    }
}