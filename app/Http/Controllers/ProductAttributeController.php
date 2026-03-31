<?php

namespace App\Http\Controllers;

use App\Models\ProductAttribute;
use App\Models\ProductAttributeValue;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductAttributeController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductAttribute::withCount('attributeValues');

        // Arama
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('slug', 'like', '%' . $request->search . '%')
                  ->orWhere('type', 'like', '%' . $request->search . '%');
            });
        }

        // Tip filtresi
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Durum filtresi
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Varyant özelliği filtresi
        if ($request->has('is_variant')) {
            $query->where('is_variant', $request->boolean('is_variant'));
        }

        $attributes = $query->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Products/Attributes/Index', [
            'attributes' => $attributes,
            'filters' => $request->all(['search', 'type', 'is_active', 'is_variant']),
            'attributeTypes' => [
                ['value' => 'text', 'label' => 'Metin'],
                ['value' => 'number', 'label' => 'Sayı'],
                ['value' => 'select', 'label' => 'Seçim'],
                ['value' => 'multiselect', 'label' => 'Çoklu Seçim'],
                ['value' => 'boolean', 'label' => 'Evet/Hayır'],
                ['value' => 'color', 'label' => 'Renk'],
                ['value' => 'image', 'label' => 'Resim'],
            ]
        ]);
    }

    public function create()
    {
        return Inertia::render('Products/Attributes/Create', [
            'attributeTypes' => [
                ['value' => 'text', 'label' => 'Metin'],
                ['value' => 'number', 'label' => 'Sayı'],
                ['value' => 'select', 'label' => 'Seçim'],
                ['value' => 'multiselect', 'label' => 'Çoklu Seçim'],
                ['value' => 'boolean', 'label' => 'Evet/Hayır'],
                ['value' => 'color', 'label' => 'Renk'],
                ['value' => 'image', 'label' => 'Resim'],
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:product_attributes,slug',
            'type' => 'required|in:text,number,select,multiselect,boolean,color,image',
            'description' => 'nullable|string',
            'is_required' => 'boolean',
            'is_variant' => 'boolean',
            'is_filterable' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
            'attribute_values' => 'array',
            'attribute_values.*.value' => 'required|string|max:255',
            'attribute_values.*.sort_order' => 'nullable|integer|min:0',
        ]);

        // Slug oluştur
        if (empty($validated['slug'])) {
            $validated['slug'] = \Str::slug($validated['name']);
        }

        // Slug benzersizlik kontrolü
        $count = 1;
        $originalSlug = $validated['slug'];
        while (ProductAttribute::where('slug', $validated['slug'])->exists()) {
            $validated['slug'] = $originalSlug . '-' . $count++;
        }

        $attribute = ProductAttribute::create($validated);

        // Attribute values oluştur
        if (!empty($validated['attribute_values'])) {
            foreach ($validated['attribute_values'] as $valueData) {
                $attribute->attributeValues()->create($valueData);
            }
        }

        return redirect()->route('product-attributes.index')
            ->with('success', 'Ürün özelliği başarıyla oluşturuldu.');
    }

    public function show(ProductAttribute $productAttribute)
    {
        $productAttribute->load('attributeValues');
        
        return Inertia::render('Products/Attributes/Show', [
            'attribute' => $productAttribute
        ]);
    }

    public function edit(ProductAttribute $productAttribute)
    {
        $productAttribute->load('attributeValues');

        return Inertia::render('Products/Attributes/Edit', [
            'attribute' => $productAttribute,
            'attributeTypes' => [
                ['value' => 'text', 'label' => 'Metin'],
                ['value' => 'number', 'label' => 'Sayı'],
                ['value' => 'select', 'label' => 'Seçim'],
                ['value' => 'multiselect', 'label' => 'Çoklu Seçim'],
                ['value' => 'boolean', 'label' => 'Evet/Hayır'],
                ['value' => 'color', 'label' => 'Renk'],
                ['value' => 'image', 'label' => 'Resim'],
            ]
        ]);
    }

    public function update(Request $request, ProductAttribute $productAttribute)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:product_attributes,slug,' . $productAttribute->id,
            'type' => 'required|in:text,number,select,multiselect,boolean,color,image',
            'description' => 'nullable|string',
            'is_required' => 'boolean',
            'is_variant' => 'boolean',
            'is_filterable' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
            'attribute_values' => 'array',
            'attribute_values.*.id' => 'nullable|exists:product_attribute_values,id',
            'attribute_values.*.value' => 'required|string|max:255',
            'attribute_values.*.sort_order' => 'nullable|integer|min:0',
        ]);

        // Slug oluştur
        if (empty($validated['slug'])) {
            $validated['slug'] = \Str::slug($validated['name']);
        }

        $productAttribute->update($validated);

        // Attribute values güncelle
        if (isset($validated['attribute_values'])) {
            $existingIds = [];
            
            foreach ($validated['attribute_values'] as $valueData) {
                if (!empty($valueData['id'])) {
                    // Var olan değeri güncelle
                    $attributeValue = ProductAttributeValue::find($valueData['id']);
                    if ($attributeValue && $attributeValue->attribute_id === $productAttribute->id) {
                        $attributeValue->update($valueData);
                        $existingIds[] = $valueData['id'];
                    }
                } else {
                    // Yeni değer oluştur
                    $newValue = $productAttribute->attributeValues()->create($valueData);
                    $existingIds[] = $newValue->id;
                }
            }

            // Silinmiş değerleri kaldır
            $productAttribute->attributeValues()
                ->whereNotIn('id', $existingIds)
                ->delete();
        }

        return redirect()->route('product-attributes.index')
            ->with('success', 'Ürün özelliği başarıyla güncellendi.');
    }

    public function destroy(ProductAttribute $productAttribute)
    {
        $productAttribute->delete();

        return redirect()->route('product-attributes.index')
            ->with('success', 'Ürün özelliği başarıyla silindi.');
    }
}