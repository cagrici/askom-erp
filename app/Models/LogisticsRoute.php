<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LogisticsRoute extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'route_number',
        'route_name',
        'origin_location',
        'destination_location',
        'total_distance_km',
        'estimated_duration_minutes',
        'route_type',
        'frequency',
        'schedule_notes',
        'estimated_fuel_cost',
        'estimated_toll_cost',
        'total_cost_per_trip',
        'currency',
        'waypoints',
        'optimized_sequence',
        'is_optimized',
        'last_optimized_at',
        'status',
        'is_favorite',
        'description',
        'road_conditions',
        'special_instructions',
        'notes',
        'total_trips',
        'last_used_at',
    ];

    protected $casts = [
        'total_distance_km' => 'decimal:2',
        'estimated_fuel_cost' => 'decimal:2',
        'estimated_toll_cost' => 'decimal:2',
        'total_cost_per_trip' => 'decimal:2',
        'waypoints' => 'array',
        'is_optimized' => 'boolean',
        'is_favorite' => 'boolean',
        'last_optimized_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($route) {
            if (empty($route->route_number)) {
                $route->route_number = static::generateRouteNumber();
            }
        });
    }

    /**
     * Generate unique route number
     */
    public static function generateRouteNumber(): string
    {
        $prefix = 'RT';
        $date = now()->format('Ym');

        $lastRoute = static::whereRaw("route_number LIKE '{$prefix}-{$date}-%'")
            ->orderBy('route_number', 'desc')
            ->first();

        if ($lastRoute) {
            $lastNumber = (int) substr($lastRoute->route_number, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return "{$prefix}-{$date}-{$newNumber}";
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('route_type', $type);
    }

    public function scopeFavorites($query)
    {
        return $query->where('is_favorite', true);
    }

    public function scopeOptimized($query)
    {
        return $query->where('is_optimized', true);
    }

    /**
     * Accessors
     */
    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'active' => 'Aktif',
            'inactive' => 'Pasif',
            'under_review' => 'İnceleme Altında',
            default => 'Bilinmiyor'
        };
    }

    public function getRouteTypeTextAttribute(): string
    {
        return match($this->route_type) {
            'delivery' => 'Teslimat',
            'pickup' => 'Toplama',
            'round_trip' => 'Gidiş-Dönüş',
            'multi_stop' => 'Çoklu Durak',
            default => 'Bilinmiyor'
        };
    }

    public function getFrequencyTextAttribute(): string
    {
        return match($this->frequency) {
            'daily' => 'Günlük',
            'weekly' => 'Haftalık',
            'monthly' => 'Aylık',
            'on_demand' => 'Talep Üzerine',
            default => 'Bilinmiyor'
        };
    }

    public function getTotalCostAttribute(): float
    {
        return ($this->estimated_fuel_cost ?? 0) + ($this->estimated_toll_cost ?? 0);
    }

    public function getWaypointCountAttribute(): int
    {
        return is_array($this->waypoints) ? count($this->waypoints) : 0;
    }
}
