<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Kategori listesini görüntüler
     */
    public function index(Request $request)
    {
        $type = $request->query('type');
        $query = Category::with(['parent', 'creator', 'children']);

        if ($type) {
            $query->where('type', $type);
        }

        $categories = $query->orderBy('display_order')
            ->orderBy('name')
            ->get();

        // Doküman kategorileri için özel sayfa
        if ($type === 'document') {
            return Inertia::render('DocumentCategories/Index', [
                'categories' => $categories,
                'currentType' => $type
            ]);
        }

        return Inertia::render('Category/Index', [
            'categories' => $categories,
            'currentType' => $type
        ]);
    }

    /**
     * Yeni kategori oluşturma formunu gösterir
     */
    public function create(Request $request)
    {
        $type = $request->query('type');

        $parentCategories = Category::when($type, function($query) use ($type) {
                return $query->where('type', $type);
            })
            ->orderBy('name')
            ->get();

        return Inertia::render('Category/Create', [
            'parentCategories' => $parentCategories,
            'type' => $type
        ]);
    }

    /**
     * Yeni kategori kaydeder
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:categories,slug',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:50',
            'parent_id' => 'nullable|exists:categories,id',
            'type' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'display_order' => 'nullable|integer',
            'meta_data' => 'nullable|array',
        ]);

        // Eğer slug verilmemişse, isimden otomatik oluştur
        if (empty($validated['slug'])) {
            $slug = Str::slug($validated['name']);

            // Eğer tip varsa, benzersiz slug oluşturmak için tip ekleyebiliriz
            if (!empty($validated['type'])) {
                $slug = Str::slug($validated['type'] . '-' . $validated['name']);
            }

            // Benzersizlik kontrolü
            $count = 1;
            $originalSlug = $slug;
            while (Category::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $count++;
            }

            $validated['slug'] = $slug;
        }

        $validated['created_by'] = Auth::id();
        $validated['updated_by'] = Auth::id();

        Category::create($validated);

        return redirect()->route('categories.index', ['type' => $validated['type']])
            ->with('success', 'Kategori başarıyla oluşturuldu');
    }

    /**
     * Kategori detaylarını gösterir
     */
    public function show(Category $category)
    {
        $category->load(['parent', 'creator', 'children']);

        return Inertia::render('Category/Show', [
            'category' => $category
        ]);
    }

    /**
     * Kategori düzenleme formunu gösterir
     */
    public function edit(Category $category)
    {
        $parentCategories = Category::where('id', '!=', $category->id)
            ->when($category->type, function($query) use ($category) {
                return $query->where('type', $category->type);
            })
            ->orderBy('name')
            ->get();

        return Inertia::render('Category/Edit', [
            'category' => $category,
            'parentCategories' => $parentCategories
        ]);
    }

    /**
     * Kategoriyi günceller
     */
    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:categories,slug,' . $category->id,
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:50',
            'parent_id' => 'nullable|exists:categories,id',
            'type' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'display_order' => 'nullable|integer',
            'meta_data' => 'nullable|array',
        ]);

        // Kendisini kendi üst kategorisi yapmaya çalışıyorsa
        if ($validated['parent_id'] == $category->id) {
            return redirect()->back()
                ->withErrors(['parent_id' => 'Bir kategori kendisinin üst kategorisi olamaz']);
        }

        // Alt kategorilerden birisini üst kategori yapmaya çalışıyorsa
        $childrenIds = $category->children()->pluck('id')->toArray();
        if (in_array($validated['parent_id'], $childrenIds)) {
            return redirect()->back()
                ->withErrors(['parent_id' => 'Alt kategori, üst kategori olarak seçilemez']);
        }

        $validated['updated_by'] = Auth::id();

        $category->update($validated);

        return redirect()->route('categories.index', ['type' => $category->type])
            ->with('success', 'Kategori başarıyla güncellendi');
    }

    /**
     * Kategoriyi siler
     */
    public function destroy(Category $category)
    {
        // Alt kategorileri kontrol et
        if ($category->children()->exists()) {
            return redirect()->back()
                ->with('error', 'Alt kategorileri olan bir kategori silinemez');
        }

        $category->delete();

        return redirect()->route('categories.index', ['type' => $category->type])
            ->with('success', 'Kategori başarıyla silindi');
    }

    /**
     * API: Belirlenen tipte kategorileri döndürür
     */
    public function getCategoriesByType(Request $request)
    {
        $request->validate([
            'type' => 'required|string'
        ]);

        $categories = Category::where('type', $request->type)
            ->active()
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    /**
     * API: Tüm kategorileri döndürür
     */
    public function getAllCategories()
    {
        $categories = Category::active()
            ->orderBy('type')
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    /**
     * API: Hiyerarşik kategori yapısını döndürür
     */
    public function getCategoryTree(Request $request)
    {
        $type = $request->query('type');

        $categories = Category::when($type, function($query) use ($type) {
                return $query->where('type', $type);
            })
            ->whereNull('parent_id')
            ->with(['children' => function($query) {
                $query->orderBy('display_order')->orderBy('name');
            }])
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }
}
