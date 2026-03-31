<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;
use App\Models\NewsPost;

class Category extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'icon',
        'parent_id',
        'type',
        'is_active',
        'display_order',
        'created_by',
        'updated_by',
        'meta_data',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'display_order' => 'integer',
        'meta_data' => 'array',
    ];

    /**
     * Model oluşturulmadan önce çalışır
     */
    protected static function boot()
    {
        parent::boot();

        // Otomatik slug oluşturma
        static::creating(function ($category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
                
                // Eğer tip varsa, benzersiz slug oluşturmak için tip ekleyebiliriz
                if (!empty($category->type)) {
                    $category->slug = Str::slug($category->type . '-' . $category->name);
                }
                
                // Benzersizlik kontrolü
                $count = 1;
                $originalSlug = $category->slug;
                while (self::where('slug', $category->slug)->exists()) {
                    $category->slug = $originalSlug . '-' . $count++;
                }
            }
        });
    }

    /**
     * Üst kategori ilişkisi
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /**
     * Alt kategoriler ilişkisi
     */
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    /**
     * Oluşturan kullanıcı ilişkisi
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Güncelleyen kullanıcı ilişkisi
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Duyuru (Announcement) ilişkisi - Direct relationship
     */
    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class, 'category_id');
    }

    /**
     * Döküman (Document) ilişkisi
     */
    public function documents(): MorphToMany
    {
        return $this->morphedByMany(Document::class, 'categorizable');
    }

    /**
     * Yemek Menüsü (MealMenu) ilişkisi
     */
    public function mealMenus(): MorphToMany
    {
        return $this->morphedByMany(MealMenu::class, 'categorizable');
    }
    
    /**
     * Haber Yazıları (NewsPost) ilişkisi
     */
    public function newsPosts(): HasMany
    {
        return $this->hasMany(NewsPost::class, 'category_id');
    }

    /**
     * Harcamalar (Expense) ilişkisi
     */
    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'category_id');
    }

    /**
     * Ürünler (Product) many-to-many ilişkisi
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_categories');
    }

    /**
     * Ürünler (Product) one-to-many ilişkisi (ana kategori)
     */
    public function mainCategoryProducts(): HasMany
    {
        return $this->hasMany(Product::class, 'category_id');
    }

    /**
     * Aktif kategorileri getiren scope
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Belirli bir tipteki kategorileri getiren scope
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Ana kategorileri getiren scope (üst kategorisi olmayanlar)
     */
    public function scopeMain($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Belirli bir tipteki ve aktif olan kategorileri getiren scope
     */
    public function scopeActiveOfType($query, $type)
    {
        return $query->where('is_active', true)->where('type', $type);
    }
    
    /**
     * Belirli bir slug'a sahip kategoriyi getiren scope
     */
    public function scopeBySlug($query, $slug)
    {
        return $query->where('slug', $slug);
    }
}
