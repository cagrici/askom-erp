<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UnitController extends Controller
{
    public function index(Request $request)
    {
        $query = Unit::query();

        // Search
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('symbol', 'like', '%' . $request->search . '%')
                  ->orWhere('type', 'like', '%' . $request->search . '%');
            });
        }

        // Status filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Type filter
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $units = $query->with('baseUnit')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Products/Units/Index', [
            'units' => $units,
            'filters' => $request->all(['search', 'is_active', 'type']),
            'unitTypes' => [
                ['value' => 'length', 'label' => 'Uzunluk'],
                ['value' => 'weight', 'label' => 'Ağırlık'],
                ['value' => 'volume', 'label' => 'Hacim'],
                ['value' => 'area', 'label' => 'Alan'],
                ['value' => 'piece', 'label' => 'Adet'],
                ['value' => 'time', 'label' => 'Zaman'],
                ['value' => 'other', 'label' => 'Diğer'],
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:10|unique:units,symbol',
            'type' => 'required|in:length,weight,volume,area,piece,time,other',
            'conversion_factor' => 'nullable|numeric|min:0',
            'base_unit_id' => 'nullable|exists:units,id',
            'is_active' => 'boolean',
            'description' => 'nullable|string',
        ]);

        Unit::create($validated);

        return redirect()->route('units.index')
            ->with('success', 'Birim başarıyla oluşturuldu.');
    }

    public function update(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:10|unique:units,symbol,' . $unit->id,
            'type' => 'required|in:length,weight,volume,area,piece,time,other',
            'conversion_factor' => 'nullable|numeric|min:0',
            'base_unit_id' => 'nullable|exists:units,id',
            'is_active' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $unit->update($validated);

        return redirect()->route('units.index')
            ->with('success', 'Birim başarıyla güncellendi.');
    }

    public function destroy(Unit $unit)
    {
        // Check if unit is being used by other units as base unit
        $dependentUnits = Unit::where('base_unit_id', $unit->id)->count();
        if ($dependentUnits > 0) {
            return back()->withErrors(['delete' => 'Bu birim başka birimler tarafından temel birim olarak kullanılıyor.']);
        }

        $unit->delete();

        return redirect()->route('units.index')
            ->with('success', 'Birim başarıyla silindi.');
    }
}