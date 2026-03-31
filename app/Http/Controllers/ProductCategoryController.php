<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class ProductCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query();

        // Arama
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Durum filtresi - sadece '1' veya '0' değerleri varsa uygula
        if ($request->has('is_active') && in_array($request->get('is_active'), ['1', '0'])) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Kategori tipi sadece product kategorileri
        $query->where('type', 'product')->orWhereNull('type');

        // Eğer arama yapılıyorsa, hem ana hem alt kategorileri getir
        if ($request->filled('search')) {
            // Arama durumunda tüm kategoriler (parent bilgisi ile)
            $categories = $query->with(['parent', 'products', 'mainCategoryProducts']);
        } else {
            // Normal durumda sadece ana kategoriler (parent bilgisi dahil)
            $categories = $query->whereNull('parent_id')
                ->with(['parent', 'products', 'mainCategoryProducts']);
        }

        $categories = $categories->withCount([
                'products as total_products_count', 
                'mainCategoryProducts as main_category_products_count',
                'children as children_count'
            ])
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        // Parent kategorileri al - hiyerarşik yapıda
        $parentCategories = Category::where('is_active', true)
            ->where(function($query) {
                $query->where('type', 'product')->orWhereNull('type');
            })
            ->with('parent')
            ->orderBy('parent_id')
            ->orderBy('name')
            ->get();

        return Inertia::render('Products/Categories/Index', [
            'categories' => $categories,
            'filters' => $request->all(['search', 'is_active']),
            'parentCategories' => $parentCategories
        ]);
    }

    public function create()
    {
        $parentCategories = Category::whereNull('parent_id')
            ->where('is_active', true)
            ->where(function($query) {
                $query->where('type', 'product')->orWhereNull('type');
            })
            ->orderBy('name')
            ->get();

        return Inertia::render('Products/Categories/Create', [
            'parentCategories' => $parentCategories
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:categories,slug',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'display_order' => 'nullable|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Slug oluştur
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Slug benzersizlik kontrolü
        $count = 1;
        $originalSlug = $validated['slug'];
        while (Category::where('slug', $validated['slug'])->exists()) {
            $validated['slug'] = $originalSlug . '-' . $count++;
        }

        // Tip ekle
        $validated['type'] = 'product';

        // Görsel yükleme
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('categories', 'public');
        }

        Category::create($validated);

        return redirect()->route('product-categories.index')
            ->with('success', 'Kategori başarıyla oluşturuldu.');
    }

    public function apiStore(Request $request)
    {
        // Permission check
        if (!auth()->user()->hasRole('Super Admin') && !auth()->user()->can('create product-categories')) {
            return response()->json(['error' => 'Bu işlem için yetkiniz yok.'], 403);
        }

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'slug' => 'nullable|string|unique:categories,slug',
                'description' => 'nullable|string',
                'parent_id' => 'nullable|exists:categories,id',
                'is_active' => 'boolean',
            ]);

            // Slug oluştur
            if (empty($validated['slug'])) {
                $validated['slug'] = Str::slug($validated['name']);
            }

            // Slug benzersizlik kontrolü
            $count = 1;
            $originalSlug = $validated['slug'];
            while (Category::where('slug', $validated['slug'])->exists()) {
                $validated['slug'] = $originalSlug . '-' . $count++;
            }

            // Tip ekle
            $validated['type'] = 'product';
            $validated['is_active'] = $validated['is_active'] ?? true;

            $category = Category::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Kategori başarıyla oluşturuldu.',
                'data' => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'full_name' => $category->parent ? $category->parent->name . ' > ' . $category->name : $category->name
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation hatası.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori oluşturulurken bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(Category $category)
    {
        $category->load(['parent', 'children']);
        
        return Inertia::render('Products/Categories/Show', [
            'category' => $category
        ]);
    }

    public function edit(Category $category)
    {
        $parentCategories = Category::whereNull('parent_id')
            ->where('is_active', true)
            ->where('id', '!=', $category->id)
            ->where(function($query) {
                $query->where('type', 'product')->orWhereNull('type');
            })
            ->orderBy('name')
            ->get();

        return Inertia::render('Products/Categories/Edit', [
            'category' => $category,
            'parentCategories' => $parentCategories
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:categories,slug,' . $category->id,
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'display_order' => 'nullable|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Slug oluştur
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Görsel yükleme
        if ($request->hasFile('image')) {
            // Eski görseli sil
            if ($category->image) {
                \Storage::disk('public')->delete($category->image);
            }
            $validated['image'] = $request->file('image')->store('categories', 'public');
        }

        $category->update($validated);

        return redirect()->route('product-categories.index')
            ->with('success', 'Kategori başarıyla güncellendi.');
    }

    public function destroy(Category $category)
    {
        // Alt kategorilerin kontrolü
        if ($category->children()->exists()) {
            return back()->withErrors(['error' => 'Bu kategorinin alt kategorileri var. Önce alt kategorileri silin.']);
        }

        // Ürün kontrolü (many-to-many)
        if ($category->products()->exists()) {
            return back()->withErrors(['error' => 'Bu kategoriye ait ürünler var (çoklu kategori ilişkisi). Kategori silinemez.']);
        }

        // Ana kategori ürün kontrolü
        if ($category->mainCategoryProducts()->exists()) {
            return back()->withErrors(['error' => 'Bu kategoriyi ana kategori olarak kullanan ürünler var. Kategori silinemez.']);
        }

        // Görseli sil
        if ($category->image) {
            \Storage::disk('public')->delete($category->image);
        }

        $category->delete();

        return redirect()->route('product-categories.index')
            ->with('success', 'Kategori başarıyla silindi.');
    }

    public function getChildren(Request $request, Category $category)
    {
        $children = Category::where('parent_id', $category->id)
            ->where('type', 'product')
            ->with(['products', 'mainCategoryProducts'])
            ->withCount([
                'products as total_products_count', 
                'mainCategoryProducts as main_category_products_count',
                'children as children_count'
            ])
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return response()->json($children);
    }

    public function getTree()
    {
        $categories = Category::whereNull('parent_id')
            ->where('is_active', true)
            ->where(function($query) {
                $query->where('type', 'product')->orWhereNull('type');
            })
            ->with(['children' => function($query) {
                $query->where('is_active', true)->orderBy('display_order')->orderBy('name');
            }])
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }
}