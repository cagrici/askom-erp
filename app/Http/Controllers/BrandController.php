<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $query = Brand::query();

        // Arama
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('country', 'like', '%' . $request->search . '%');
        }

        // Durum filtresi
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Ürün sayısını ekle
        $query->withCount('products');

        $brands = $query->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Products/Brands/Index', [
            'brands' => $brands,
            'filters' => $request->all(['search', 'is_active'])
        ]);
    }

    public function create()
    {
        return Inertia::render('Products/Brands/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:brands,slug',
            'description' => 'nullable|string',
            'website' => 'nullable|url',
            'country' => 'nullable|string|max:100',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Slug oluştur
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Slug benzersizlik kontrolü
        $count = 1;
        $originalSlug = $validated['slug'];
        while (Brand::where('slug', $validated['slug'])->exists()) {
            $validated['slug'] = $originalSlug . '-' . $count++;
        }

        // Logo yükleme
        if ($request->hasFile('logo')) {
            $validated['logo'] = $request->file('logo')->store('brands', 'public');
        }

        Brand::create($validated);

        return redirect()->route('brands.index')
            ->with('success', 'Marka başarıyla oluşturuldu.');
    }

    public function apiStore(Request $request)
    {
        // Permission check
        if (!auth()->user()->hasRole('Super Admin') && !auth()->user()->can('create brands')) {
            return response()->json(['error' => 'Bu işlem için yetkiniz yok.'], 403);
        }

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'slug' => 'nullable|string|unique:brands,slug',
                'description' => 'nullable|string',
                'website' => 'nullable|url',
                'country' => 'nullable|string|max:100',
                'is_active' => 'boolean',
            ]);

            // Slug oluştur
            if (empty($validated['slug'])) {
                $validated['slug'] = Str::slug($validated['name']);
            }

            // Slug benzersizlik kontrolü
            $count = 1;
            $originalSlug = $validated['slug'];
            while (Brand::where('slug', $validated['slug'])->exists()) {
                $validated['slug'] = $originalSlug . '-' . $count++;
            }

            $validated['is_active'] = $validated['is_active'] ?? true;

            $brand = Brand::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Marka başarıyla oluşturuldu.',
                'data' => [
                    'id' => $brand->id,
                    'name' => $brand->name
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
                'message' => 'Marka oluşturulurken bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(Brand $brand)
    {
        $brand->loadCount('products');
        
        return Inertia::render('Products/Brands/Show', [
            'brand' => $brand
        ]);
    }

    public function edit(Brand $brand)
    {
        return Inertia::render('Products/Brands/Edit', [
            'brand' => $brand
        ]);
    }

    public function update(Request $request, Brand $brand)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:brands,slug,' . $brand->id,
            'description' => 'nullable|string',
            'website' => 'nullable|url',
            'country' => 'nullable|string|max:100',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Slug oluştur
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Logo yükleme
        if ($request->hasFile('logo')) {
            // Eski logoyu sil
            if ($brand->logo) {
                \Storage::disk('public')->delete($brand->logo);
            }
            $validated['logo'] = $request->file('logo')->store('brands', 'public');
        }

        $brand->update($validated);

        return redirect()->route('brands.index')
            ->with('success', 'Marka başarıyla güncellendi.');
    }

    public function destroy(Brand $brand)
    {
        // Ürün kontrolü
        if ($brand->products()->exists()) {
            return back()->withErrors(['error' => 'Bu markaya ait ürünler var. Marka silinemez.']);
        }

        // Logoyu sil
        if ($brand->logo) {
            \Storage::disk('public')->delete($brand->logo);
        }

        $brand->delete();

        return redirect()->route('brands.index')
            ->with('success', 'Marka başarıyla silindi.');
    }
}