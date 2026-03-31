<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class LeadStage extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'color',
        'icon',
        'description',
        'sort_order',
        'is_active',
        'is_default',
        'is_won',
        'is_lost',
        'win_probability',
        'location_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'is_won' => 'boolean',
        'is_lost' => 'boolean',
        'win_probability' => 'decimal:2',
        'sort_order' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($stage) {
            if (empty($stage->slug)) {
                $stage->slug = Str::slug($stage->name);
            }
        });

        static::updating(function ($stage) {
            if ($stage->isDirty('name') && !$stage->isDirty('slug')) {
                $stage->slug = Str::slug($stage->name);
            }
        });
    }

    /**
     * Relationships
     */
    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Get the default stage
     */
    public static function getDefault(): ?self
    {
        return static::active()->default()->first()
            ?? static::active()->ordered()->first();
    }

    /**
     * Get lead count for this stage
     */
    public function getLeadCountAttribute(): int
    {
        return $this->leads()->count();
    }

    /**
     * Get total value of leads in this stage
     */
    public function getTotalValueAttribute(): float
    {
        return $this->leads()->sum('estimated_value') ?? 0;
    }
}
