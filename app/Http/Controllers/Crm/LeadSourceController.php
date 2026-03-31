<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\LeadSource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LeadSourceController extends Controller
{
    public function index()
    {
        $sources = LeadSource::withCount('leads')
            ->ordered()
            ->get();

        return Inertia::render('Admin/Crm/LeadSources/Index', [
            'sources' => $sources,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $validated['created_by'] = Auth::id();
        $validated['sort_order'] = LeadSource::max('sort_order') + 1;
        $validated['is_active'] = true;

        LeadSource::create($validated);

        return back()->with('success', 'Kaynak oluşturuldu.');
    }

    public function update(Request $request, LeadSource $source)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $validated['updated_by'] = Auth::id();

        $source->update($validated);

        return back()->with('success', 'Kaynak güncellendi.');
    }

    public function destroy(LeadSource $source)
    {
        if ($source->leads()->exists()) {
            return back()->with('error', 'Bu kaynakta lead bulunuyor, silinemez.');
        }

        $source->delete();

        return back()->with('success', 'Kaynak silindi.');
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'sources' => 'required|array',
            'sources.*.id' => 'required|exists:lead_sources,id',
            'sources.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($validated['sources'] as $item) {
            LeadSource::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['success' => true]);
    }
}
