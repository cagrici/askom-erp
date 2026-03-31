<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'description',
        'options',
        'is_public'
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'options' => 'array'
    ];

    /**
     * Get the cast type for the value attribute based on the type column
     */
    protected function value(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: function ($value) {
                return match ($this->type) {
                    'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
                    'integer' => (int) $value,
                    'json' => json_decode($value, true) ?? [],
                    default => $value,
                };
            },
            set: function ($value) {
                return match ($this->type) {
                    'boolean' => $value ? '1' : '0',
                    'json' => json_encode($value),
                    default => $value,
                };
            }
        );
    }

    /**
     * Validation rules based on type
     */
    public static function validationRules($type, $isRequired = false): array
    {
        $rules = [];
        
        if ($isRequired) {
            $rules[] = 'required';
        } else {
            $rules[] = 'nullable';
        }

        switch ($type) {
            case 'email':
                $rules[] = 'email';
                break;
            case 'integer':
                $rules[] = 'integer';
                break;
            case 'boolean':
                $rules[] = 'boolean';
                break;
            case 'json':
                $rules[] = 'json';
                break;
            case 'text':
            case 'textarea':
                $rules[] = 'string';
                break;
            case 'select':
                // Will be validated against options
                $rules[] = 'string';
                break;
        }

        return $rules;
    }

    /**
     * Scope for filtering by group
     */
    public function scopeByGroup(Builder $query, ?string $group): Builder
    {
        if ($group === null) {
            return $query->whereNull('group');
        }
        
        return $query->where('group', $group);
    }

    /**
     * Scope for public settings
     */
    public function scopePublic(Builder $query): Builder
    {
        return $query->where('is_public', true);
    }

    /**
     * Get a setting value by key
     */
    public static function get(string $key, $default = null)
    {
        $cacheKey = 'setting.' . $key;
        
        return Cache::remember($cacheKey, 3600, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();
            
            return $setting ? $setting->value : $default;
        });
    }

    /**
     * Set a setting value
     */
    public static function set(string $key, $value, array $attributes = []): self
    {
        $setting = static::updateOrCreate(
            ['key' => $key],
            array_merge(['value' => $value], $attributes)
        );

        // Clear cache
        Cache::forget('setting.' . $key);
        Cache::forget('settings.all');
        Cache::forget('settings.grouped');

        return $setting;
    }

    /**
     * Get all settings grouped by group
     */
    public static function getAllGrouped(): array
    {
        return Cache::remember('settings.grouped', 3600, function () {
            $settings = static::orderBy('group')->orderBy('key')->get();
            
            return $settings->groupBy('group')->map(function ($group) {
                return $group->keyBy('key');
            })->toArray();
        });
    }

    /**
     * Clear settings cache
     */
    public static function clearCache(): void
    {
        Cache::flush();
    }

    /**
     * Boot method
     */
    protected static function boot()
    {
        parent::boot();

        static::saved(function () {
            static::clearCache();
        });

        static::deleted(function () {
            static::clearCache();
        });
    }
}