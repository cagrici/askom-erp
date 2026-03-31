<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    /**
     * Display a listing of settings grouped by category
     */
    public function index(): Response
    {
        $settings = Setting::orderBy('group')->orderBy('key')->get();
        
        $grouped = $settings->groupBy('group')->map(function ($group) {
            return $group->map(function ($setting) {
                return [
                    'id' => $setting->id,
                    'key' => $setting->key,
                    'value' => $setting->value,
                    'type' => $setting->type,
                    'description' => $setting->description,
                    'options' => $setting->options,
                    'is_public' => $setting->is_public,
                ];
            })->values();
        });

        // Define group labels
        $groupLabels = [
            'general' => 'General Settings',
            'email' => 'Email Configuration',
            'appearance' => 'Appearance',
            'advanced' => 'Advanced Settings',
            'system' => 'System Settings',
            'custom' => 'Custom Settings',
            null => 'Other Settings'
        ];

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $grouped,
            'groupLabels' => $groupLabels
        ]);
    }

    /**
     * Store a newly created setting
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:255', 'unique:settings,key', 'regex:/^[a-z0-9_]+$/'],
            'value' => ['required'],
            'type' => ['required', 'in:text,integer,email,boolean,json,textarea,select'],
            'group' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'options' => ['nullable', 'array'],
            'is_public' => ['boolean'],
        ], [
            'key.regex' => 'Key must be lowercase letters, numbers, and underscores only.',
            'key.unique' => 'This setting key already exists.',
        ]);

        // Set default value based on type
        if ($validated['type'] === 'boolean') {
            $validated['value'] = filter_var($validated['value'], FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
        } elseif ($validated['type'] === 'json' && is_array($validated['value'])) {
            $validated['value'] = json_encode($validated['value']);
        }

        if ($validated['type'] === 'select' && isset($validated['options'])) {
            $validated['options'] = json_encode($validated['options']);
        } else {
            $validated['options'] = null;
        }

        Setting::create($validated);

        return back()->with('success', 'Setting created successfully.');
    }

    /**
     * Update multiple settings at once
     */
    public function update(Request $request)
    {
        $settings = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string|exists:settings,key',
            'settings.*.value' => 'nullable'
        ]);

        DB::beginTransaction();

        try {
            foreach ($settings['settings'] as $settingData) {
                $setting = Setting::where('key', $settingData['key'])->first();
                
                if (!$setting) {
                    continue;
                }

                // Validate based on type
                $rules = Setting::validationRules($setting->type);
                
                // For select type, validate against options
                if ($setting->type === 'select' && $setting->options) {
                    $validOptions = array_column($setting->options, 'value');
                    $rules[] = 'in:' . implode(',', $validOptions);
                }

                $validator = validator(
                    ['value' => $settingData['value']],
                    ['value' => $rules]
                );

                if ($validator->fails()) {
                    DB::rollBack();
                    return back()->withErrors([
                        $setting->key => $validator->errors()->first('value')
                    ]);
                }

                $setting->update(['value' => $settingData['value']]);
            }

            DB::commit();
            
            // Clear cache
            Setting::clearCache();

            return back()->with('success', 'Settings updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update settings.']);
        }
    }

    /**
     * Delete a custom setting
     */
    public function destroy(Setting $setting)
    {
        // Prevent deletion of core settings
        $coreSettings = [
            'site_name', 'site_email', 'site_phone', 'company_address',
            'maintenance_mode', 'items_per_page', 'allowed_file_types', 'max_file_size',
            'email_from_address', 'email_from_name', 'smtp_host', 'smtp_port',
            'theme_color', 'date_format', 'time_format', 'timezone',
            'enable_registration', 'require_email_verification', 'session_lifetime', 'password_min_length'
        ];

        if (in_array($setting->key, $coreSettings)) {
            return back()->withErrors(['error' => 'Core settings cannot be deleted.']);
        }

        $setting->delete();
        
        // Clear cache
        Setting::clearCache();

        return back()->with('success', 'Setting deleted successfully.');
    }

    /**
     * Get public settings (for API)
     */
    public function public()
    {
        $settings = Setting::public()->get(['key', 'value', 'type']);
        
        $formatted = $settings->mapWithKeys(function ($setting) {
            return [$setting->key => $setting->value];
        });

        return response()->json($formatted);
    }
}