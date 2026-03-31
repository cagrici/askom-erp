<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\CategoryController as BaseCategoryController;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends BaseCategoryController
{
    /**
     * Kategori listesini görüntüler
     */
    public function index(Request $request)
    {
        $type = $request->query('type');
        $query = Category::with(['parent', 'creator']);

        if ($type) {
            $query->where('type', $type);
        }

        $categories = $query->orderBy('display_order')
            ->orderBy('name')
            ->get();

        // Get all unique types
        $types = Category::distinct()->pluck('type')->filter()->values();

        return Inertia::render('Admin/Category/Index', [
            'categories' => $categories,
            'currentType' => $type,
            'types' => $types
        ]);
    }

    /**
     * Yeni kategori oluşturur (AJAX)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:50',
            'parent_id' => 'nullable|exists:categories,id',
            'type' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'display_order' => 'nullable|integer',
        ]);

        // Generate slug from name
        $slug = \Str::slug($validated['name']);
        if (!empty($validated['type'])) {
            $slug = \Str::slug($validated['type'] . '-' . $validated['name']);
        }

        // Ensure uniqueness
        $count = 1;
        $originalSlug = $slug;
        while (Category::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count++;
        }

        $validated['slug'] = $slug;
        $validated['created_by'] = auth()->id();
        $validated['updated_by'] = auth()->id();

        Category::create($validated);

        return back()->with('success', 'Kategori başarıyla oluşturuldu');
    }

    /**
     * Kategoriyi günceller (AJAX)
     */
    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:50',
            'parent_id' => 'nullable|exists:categories,id',
            'type' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'display_order' => 'nullable|integer',
        ]);

        // Prevent self-parent relationship
        if ($validated['parent_id'] == $category->id) {
            return back()->withErrors(['parent_id' => 'Bir kategori kendisinin üst kategorisi olamaz']);
        }

        // Prevent child as parent
        $childrenIds = $category->children()->pluck('id')->toArray();
        if (in_array($validated['parent_id'], $childrenIds)) {
            return back()->withErrors(['parent_id' => 'Alt kategori, üst kategori olarak seçilemez']);
        }

        $validated['updated_by'] = auth()->id();
        $category->update($validated);

        return back()->with('success', 'Kategori başarıyla güncellendi');
    }

    /**
     * Kategoriyi siler (AJAX)
     */
    public function destroy(Category $category)
    {
        // Check for children
        if ($category->children()->exists()) {
            return back()->with('error', 'Alt kategorileri olan bir kategori silinemez');
        }

        $category->delete();

        return back()->with('success', 'Kategori başarıyla silindi');
    }

    /**
     * Kategori detaylarını gösterir (AJAX)
     */
    public function show(Category $category)
    {
        $category->load(['parent', 'children', 'creator', 'updater']);
        
        return Inertia::render('Admin/Category/Index', [
            'category' => $category
        ]);
    }
}