<?php

namespace App\Http\Controllers\IdeaPool;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class IdeaCategoryController extends Controller
{
    /**
     * Display a listing of the categories.
     */
    public function index()
    {
        $this->authorize('viewAny', Category::where('type', 'idea')->class);

        $categories = Category::where('type', 'idea')->withCount('ideas')
            ->orderBy('name')
            ->get();

        return Inertia::render('IdeaPool/Categories/Index', [
            'categories' => $categories,
            'canCreateCategory' => Auth::user()->can('create', Category::class),
        ]);
    }

    /**
     * Show the form for creating a new category.
     */
    public function create()
    {
        $this->authorize('create', Category::class);

        return Inertia::render('IdeaPool/Categories/Create');
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Category::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:idea_categories,name',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $category = new Category($validated);
        $category->save();

        return redirect()->route('idea-categories.index')
            ->with('success', __('Category created successfully'));
    }

    /**
     * Show the form for editing the specified category.
     */
    public function edit(Category $ideaCategory)
    {
        $this->authorize('update', $ideaCategory);

        return Inertia::render('IdeaPool/Categories/Edit', [
            'category' => $ideaCategory,
        ]);
    }

    /**
     * Update the specified category in storage.
     */
    public function update(Request $request, Category $ideaCategory)
    {
        $this->authorize('update', $ideaCategory);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:idea_categories,name,' . $ideaCategory->id,
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $ideaCategory->fill($validated);
        $ideaCategory->save();

        return redirect()->route('idea-categories.index')
            ->with('success', __('Category updated successfully'));
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(Category $ideaCategory)
    {
        $this->authorize('delete', $ideaCategory);

        // Check if category has ideas
        if ($ideaCategory->ideas()->count() > 0) {
            return back()->with('error', __('Cannot delete category with associated ideas'));
        }

        $ideaCategory->delete();

        return redirect()->route('idea-categories.index')
            ->with('success', __('Category deleted successfully'));
    }
}
