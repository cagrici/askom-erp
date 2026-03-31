<?php

namespace App\Http\Controllers\News;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\NewsPost;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class NewsCategoryController extends Controller
{
    /**
     * Display a listing of the categories.
     */
    public function index()
    {
        $categories = Category::ofType('news')->withCount(['newsPosts as posts_count'])->get();
        
        return Inertia::render('Pages/Blogs/Categories/index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Show the form for creating a new category.
     */
    public function create()
    {
        return Inertia::render('Pages/Blogs/Categories/Create');
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);
        
        Category::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'color' => $request->color,
            'icon' => $request->icon,
            'is_active' => $request->is_active ?? true,
            'type' => 'news',
            'created_by' => auth()->id(),
        ]);
        
        return redirect()->route('news.categories.index')
            ->with('success', 'Category created successfully.');
    }

    /**
     * Display the specified category.
     */
    public function show(Category $category)
    {
        $posts = NewsPost::where('category_id', $category->id)
            ->published()
            ->orderBy('publish_at', 'desc')
            ->get();
        
        return Inertia::render('Pages/Blogs/Categories/Show', [
            'category' => $category,
            'posts' => $posts,
        ]);
    }

    /**
     * Show the form for editing the specified category.
     */
    public function edit(Category $category)
    {
        return Inertia::render('Pages/Blogs/Categories/Edit', [
            'category' => $category,
        ]);
    }

    /**
     * Update the specified category in storage.
     */
    public function update(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);
        
        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'color' => $request->color,
            'icon' => $request->icon,
            'is_active' => $request->is_active ?? true,
            'updated_by' => auth()->id(),
        ]);
        
        return redirect()->route('news.categories.index')
            ->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(Category $category)
    {
        // Check if category has posts
        if (NewsPost::where('category_id', $category->id)->count() > 0) {
            return back()->with('error', 'Category cannot be deleted because it has associated posts.');
        }
        
        $category->delete();
        
        return redirect()->route('news.categories.index')
            ->with('success', 'Category deleted successfully.');
    }
}
