<?php

use App\Models\Setting;

if (!function_exists('setting')) {
    /**
     * Get a setting value by key
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    function setting(string $key, $default = null)
    {
        return Setting::get($key, $default);
    }
}

if (!function_exists('settings')) {
    /**
     * Get all settings or settings by group
     *
     * @param string|null $group
     * @return array
     */
    function settings(?string $group = null): array
    {
        if ($group === null) {
            return Setting::getAllGrouped();
        }

        $settings = Setting::byGroup($group)->get();
        return $settings->pluck('value', 'key')->toArray();
    }
}