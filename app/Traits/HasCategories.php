<?php

namespace App\Traits;

use App\Models\Category;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

trait HasCategories
{
    /**
     * Model'in sahip olduğu kategorileri döndürür
     */
    public function categories(): MorphToMany
    {
        return $this->morphToMany(Category::class, 'categorizable');
    }

    /**
     * Belirli bir kategoriye sahip olup olmadığını kontrol eder
     * 
     * @param int|string|Category $category Kategori ID'si, slug'ı veya model
     * @return bool
     */
    public function hasCategory($category): bool
    {
        if (is_numeric($category)) {
            // ID ile kontrol
            return $this->categories()->where('categories.id', $category)->exists();
        } elseif (is_string($category)) {
            // Slug ile kontrol
            return $this->categories()->where('categories.slug', $category)->exists();
        } elseif ($category instanceof Category) {
            // Model ile kontrol
            return $this->categories()->where('categories.id', $category->id)->exists();
        }
        
        return false;
    }

    /**
     * Verilen kategorilere sahip olup olmadığını kontrol eder
     * 
     * @param array $categories Kontrol edilecek kategoriler (ID, slug veya model olabilir)
     * @param bool $requireAll true ise tüm kategorilere sahip olması gerekir, false ise herhangi birine
     * @return bool
     */
    public function hasCategories(array $categories, bool $requireAll = false): bool
    {
        $categoryCount = 0;
        
        foreach ($categories as $category) {
            if ($this->hasCategory($category)) {
                $categoryCount++;
            }
        }
        
        return $requireAll ? $categoryCount === count($categories) : $categoryCount > 0;
    }

    /**
     * Model'e bir kategori ekler
     * 
     * @param int|string|Category $category Eklenecek kategori (ID, slug veya model)
     * @return $this
     */
    public function addCategory($category)
    {
        if (is_numeric($category)) {
            // ID ile ekle
            $categoryId = $category;
        } elseif (is_string($category)) {
            // Slug ile bul ve ekle
            $categoryModel = Category::where('slug', $category)->first();
            $categoryId = $categoryModel ? $categoryModel->id : null;
        } elseif ($category instanceof Category) {
            // Model ile ekle
            $categoryId = $category->id;
        } else {
            $categoryId = null;
        }
        
        if ($categoryId && !$this->hasCategory($categoryId)) {
            $this->categories()->attach($categoryId);
        }
        
        return $this;
    }

    /**
     * Model'e birden fazla kategori ekler
     * 
     * @param array $categories Eklenecek kategoriler (ID, slug veya model olabilir)
     * @return $this
     */
    public function addCategories(array $categories)
    {
        foreach ($categories as $category) {
            $this->addCategory($category);
        }
        
        return $this;
    }

    /**
     * Model'den bir kategori kaldırır
     * 
     * @param int|string|Category $category Kaldırılacak kategori (ID, slug veya model)
     * @return $this
     */
    public function removeCategory($category)
    {
        if (is_numeric($category)) {
            // ID ile kaldır
            $categoryId = $category;
        } elseif (is_string($category)) {
            // Slug ile bul ve kaldır
            $categoryModel = Category::where('slug', $category)->first();
            $categoryId = $categoryModel ? $categoryModel->id : null;
        } elseif ($category instanceof Category) {
            // Model ile kaldır
            $categoryId = $category->id;
        } else {
            $categoryId = null;
        }
        
        if ($categoryId) {
            $this->categories()->detach($categoryId);
        }
        
        return $this;
    }

    /**
     * Model'den birden fazla kategori kaldırır
     * 
     * @param array $categories Kaldırılacak kategoriler (ID, slug veya model olabilir)
     * @return $this
     */
    public function removeCategories(array $categories)
    {
        foreach ($categories as $category) {
            $this->removeCategory($category);
        }
        
        return $this;
    }

    /**
     * Tüm kategorileri kaldırır ve yenileriyle değiştirir
     * 
     * @param array $categories Yeni kategoriler (ID, slug veya model olabilir)
     * @return $this
     */
    public function syncCategories(array $categories)
    {
        $categoryIds = [];
        
        foreach ($categories as $category) {
            if (is_numeric($category)) {
                $categoryIds[] = $category;
            } elseif (is_string($category)) {
                $categoryModel = Category::where('slug', $category)->first();
                if ($categoryModel) {
                    $categoryIds[] = $categoryModel->id;
                }
            } elseif ($category instanceof Category) {
                $categoryIds[] = $category->id;
            }
        }
        
        $this->categories()->sync($categoryIds);
        
        return $this;
    }

    /**
     * Belirli bir tipte kategorileri döndürür
     * 
     * @param string $type Kategori tipi
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getCategoriesByType(string $type)
    {
        return $this->categories()->where('type', $type)->get();
    }
}
