<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\LeadStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LeadStageController extends Controller
{
    public function index()
    {
        $stages = LeadStage::withCount('leads')
            ->ordered()
            ->get();

        return Inertia::render('Admin/Crm/LeadStages/Index', [
            'stages' => $stages,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|max:20',
            'icon' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'win_probability' => 'required|numeric|min:0|max:100',
            'is_default' => 'boolean',
            'is_won' => 'boolean',
            'is_lost' => 'boolean',
        ]);

        $validated['created_by'] = Auth::id();
        $validated['sort_order'] = LeadStage::max('sort_order') + 1;
        $validated['is_active'] = true;

        // If setting as default, unset others
        if (!empty($validated['is_default'])) {
            LeadStage::where('is_default', true)->update(['is_default' => false]);
        }

        $stage = LeadStage::create($validated);

        return back()->with('success', 'Aşama oluşturuldu.');
    }

    public function update(Request $request, LeadStage $stage)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|max:20',
            'icon' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'win_probability' => 'required|numeric|min:0|max:100',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'is_won' => 'boolean',
            'is_lost' => 'boolean',
        ]);

        $validated['updated_by'] = Auth::id();

        // If setting as default, unset others
        if (!empty($validated['is_default']) && !$stage->is_default) {
            LeadStage::where('is_default', true)->update(['is_default' => false]);
        }

        $stage->update($validated);

        return back()->with('success', 'Aşama güncellendi.');
    }

    public function destroy(LeadStage $stage)
    {
        if ($stage->leads()->exists()) {
            return back()->with('error', 'Bu aşamada lead bulunuyor, silinemez.');
        }

        $stage->delete();

        return back()->with('success', 'Aşama silindi.');
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'stages' => 'required|array',
            'stages.*.id' => 'required|exists:lead_stages,id',
            'stages.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($validated['stages'] as $item) {
            LeadStage::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['success' => true]);
    }
}
