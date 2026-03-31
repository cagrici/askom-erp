<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DocumentCategoryController extends Controller
{
    /**
     * Yeni CategoryController'a yönlendirme yapan legacy controller
     * 
     * @deprecated Bu controller artık kullanılmıyor. Yerine CategoryController kullanılmalıdır.
     */
    
    /**
     * Display a listing of the document categories.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        // Direkt CategoryController'ı çağır
        return app(CategoryController::class)->index(request()->merge(['type' => 'document']));
    }

    /**
     * Show the form for creating a new document category.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        return redirect()->route('categories.create', ['type' => 'document']);
    }

    /**
     * Store a newly created document category in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        // Yeni request oluştur ve type ekle
        $newRequest = Request::createFrom($request);
        $newRequest->merge(['type' => 'document']);
        
        // Yeni controller'a yönlendir
        return app(CategoryController::class)->store($newRequest);
    }

    /**
     * Display the specified document category.
     *
     * @param  mixed  $documentCategory
     * @return \Illuminate\Http\Response
     */
    public function show($documentCategory)
    {
        // Legacy ID'yi giriş parametresi olarak kullanarak yeni kategori ID'sini bulalım
        $newCategoryId = $this->findNewCategoryId($documentCategory);
        
        if ($newCategoryId) {
            return redirect()->route('categories.show', $newCategoryId);
        }
        
        // Kategori bulunamadı, kategorilere yönlendir
        return redirect()->route('categories.index', ['type' => 'document'])
            ->with('error', 'Document category not found');
    }

    /**
     * Show the form for editing the specified document category.
     *
     * @param  mixed  $documentCategory
     * @return \Illuminate\Http\Response
     */
    public function edit($documentCategory)
    {
        // Legacy ID'yi giriş parametresi olarak kullanarak yeni kategori ID'sini bulalım
        $newCategoryId = $this->findNewCategoryId($documentCategory);
        
        if ($newCategoryId) {
            return redirect()->route('categories.edit', $newCategoryId);
        }
        
        // Kategori bulunamadı, kategorilere yönlendir
        return redirect()->route('categories.index', ['type' => 'document'])
            ->with('error', 'Document category not found');
    }

    /**
     * Update the specified document category in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  mixed  $documentCategory
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $documentCategory)
    {
        // Legacy ID'yi giriş parametresi olarak kullanarak yeni kategori ID'sini bulalım
        $newCategoryId = $this->findNewCategoryId($documentCategory);
        
        if ($newCategoryId) {
            // Yeni request oluştur ve type ekle
            $newRequest = Request::createFrom($request);
            $newRequest->merge(['type' => 'document']);
            
            // Yeni controller'a yönlendir
            return app(CategoryController::class)->update($newRequest, \App\Models\Category::find($newCategoryId));
        }
        
        // Kategori bulunamadı, kategorilere yönlendir
        return redirect()->route('categories.index', ['type' => 'document'])
            ->with('error', 'Document category not found');
    }

    /**
     * Remove the specified document category from storage.
     *
     * @param  mixed  $documentCategory
     * @return \Illuminate\Http\Response
     */
    public function destroy($documentCategory)
    {
        // Legacy ID'yi giriş parametresi olarak kullanarak yeni kategori ID'sini bulalım
        $newCategoryId = $this->findNewCategoryId($documentCategory);
        
        if ($newCategoryId) {
            // Yeni controller'a yönlendir
            return app(CategoryController::class)->destroy(\App\Models\Category::find($newCategoryId));
        }
        
        // Kategori bulunamadı, kategorilere yönlendir
        return redirect()->route('categories.index', ['type' => 'document'])
            ->with('error', 'Document category not found');
    }
    
    /**
     * Eski kategori ID'sine karşılık gelen yeni kategori ID'sini bul
     * 
     * @param mixed $oldCategoryId
     * @return int|null
     */
    private function findNewCategoryId($oldCategoryId)
    {
        // Eğer category_mappings tablosu hala varsa, eşleşen ID'yi bul
        if (schema_has_table('category_mappings')) {
            return \Illuminate\Support\Facades\DB::table('category_mappings')
                ->where('old_category_id', $oldCategoryId)
                ->where('old_category_table', 'document_categories')
                ->value('new_category_id');
        }
        
        // Tablo yoksa, document tipindeki kategorileri ara
        return \App\Models\Category::where('type', 'document')
            ->where('name', function ($query) use ($oldCategoryId) {
                $query->select('name')
                    ->from('document_categories')
                    ->where('id', $oldCategoryId);
            })
            ->value('id');
    }
}

/**
 * Schema has table kontrolü için yardımcı fonksiyon
 */
if (!function_exists('schema_has_table')) {
    function schema_has_table($table)
    {
        return \Illuminate\Support\Facades\Schema::hasTable($table);
    }
}
