<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttributeValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'attribute_id', 'value', 'color_hex', 'sort_order'
    ];

    // Relationships
    public function attribute(): BelongsTo
    {
        return $this->belongsTo(ProductAttribute::class, 'attribute_id');
    }

    // Accessors
    public function getDisplayValueAttribute(): string
    {
        if ($this->attribute->type === 'color' && $this->color_hex) {
            return '<span style="background-color: ' . $this->color_hex . '; display: inline-block; width: 20px; height: 20px; border-radius: 3px; margin-right: 5px;"></span>' . $this->value;
        }
        
        return $this->value;
    }
}