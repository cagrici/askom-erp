<?php

namespace App\Http\Controllers;

use App\Models\MealMenu;
use App\Models\MealMenuType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MealMenuController extends Controller
{
    /**
     * Display the meal menu calendar
     */
    public function index()
    {
        $locations = \App\Models\Location::active()
            ->orderBy('name')
            ->get(['id', 'name']);
            
        return Inertia::render('MealMenu/index', [
            'locations' => $locations
        ]);
    }

    /**
     * Get all meal menus
     */
    public function getMenus(Request $request)
    {
        $query = MealMenu::with(['menuType', 'location'])
            ->orderBy('menu_date');
            
        // Filter by location if provided
        if ($request->has('location_id') && $request->location_id) {
            $query->where('location_id', $request->location_id);
        }
        
        $menus = $query->get()
            ->map(function ($menu) {
                return [
                    'id' => $menu->id,
                    'title' => $menu->title,
                    'start' => $menu->menu_date->format('Y-m-d'),
                    'end' => $menu->menu_date->format('Y-m-d'),
                    'description' => $menu->description,
                    'className' => [$menu->menuType->color],
                    'location' => $menu->location ? $menu->location->name : '',
                    'location_id' => $menu->location_id,
                    'main_dish' => $menu->main_dish,
                    'allDay' => true,
                ];
            });

        return response()->json($menus);
    }

    /**
     * Get menu types
     */
    public function getMenuTypes()
    {
        $menuTypes = MealMenuType::where('is_active', true)
            ->get()
            ->map(function ($type) {
                return [
                    'id' => $type->id,
                    'title' => $type->name,
                    'type' => str_replace(['bg-', '-subtle'], '', $type->color),
                ];
            });
            
        $locations = \App\Models\Location::active()
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json([
            'menuTypes' => $menuTypes,
            'locations' => $locations
        ]);
    }

    /**
     * Store a new meal menu
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'menu_type_id' => 'required|exists:meal_menu_types,id',
            'menu_date' => 'required|date',
            'main_dish' => 'nullable|string',
            'side_dish' => 'nullable|string',
            'soup' => 'nullable|string',
            'salad' => 'nullable|string',
            'dessert' => 'nullable|string',
            'drink' => 'nullable|string',
            'vegetarian_option' => 'nullable|string',
            'dietary_information' => 'nullable|string',
            'location_id' => 'nullable|exists:locations,id',
            'nutritional_info' => 'nullable|array',
            'status' => ['nullable', Rule::in(['active', 'cancelled', 'draft'])],
        ]);

        $validated['created_by'] = Auth::id();

        $menu = MealMenu::create($validated);

        return response()->json($menu);
    }

    /**
     * Update an existing meal menu
     */
    public function update(Request $request, MealMenu $mealMenu)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'menu_type_id' => 'required|exists:meal_menu_types,id',
            'menu_date' => 'required|date',
            'main_dish' => 'nullable|string',
            'side_dish' => 'nullable|string',
            'soup' => 'nullable|string',
            'salad' => 'nullable|string',
            'dessert' => 'nullable|string',
            'drink' => 'nullable|string',
            'vegetarian_option' => 'nullable|string',
            'dietary_information' => 'nullable|string',
            'location_id' => 'nullable|exists:locations,id',
            'nutritional_info' => 'nullable|array',
            'status' => ['nullable', Rule::in(['active', 'cancelled', 'draft'])],
        ]);

        $mealMenu->update($validated);

        return response()->json($mealMenu);
    }

    /**
     * Delete a meal menu
     */
    public function destroy(MealMenu $mealMenu)
    {
        $mealMenu->delete();
        return response()->json(['success' => true]);
    }

    /**
     * Get meal menu details for a specific date
     */
    public function getMenuDetails(Request $request)
    {
        $request->validate([
            'date' => 'required|date'
        ]);

        \Illuminate\Support\Facades\Log::info('API çağrıldı', [
            'date' => $request->date,
            'method' => $request->method(),
            'url' => $request->fullUrl()
        ]);

        $menu = MealMenu::with(['menuType', 'creator', 'location'])
            ->whereDate('menu_date', $request->date)
            ->first();

        \Illuminate\Support\Facades\Log::info('Sorgu sonucu', [
            'menu' => $menu ? 'Menu bulundu' : 'Menu bulunamadı'
        ]);

        if (!$menu) {
            return response()->json(['message' => 'No menu found for this date'], 404);
        }

        return response()->json($menu);
    }
}
