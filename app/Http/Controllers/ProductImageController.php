<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ProductImageController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['images' => function($query) {
            $query->orderBy('sort_order')->orderBy('created_at');
        }, 'category', 'brand']);

        // Arama
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%')
                  ->orWhere('sku', 'like', '%' . $request->search . '%');
            });
        }

        // Kategori filtresi
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Marka filtresi
        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        // Görsel durumu filtresi
        if ($request->filled('image_status')) {
            if ($request->image_status === 'with_images') {
                $query->whereHas('images');
            } elseif ($request->image_status === 'without_images') {
                $query->whereDoesntHave('images');
            } elseif ($request->image_status === 'without_primary') {
                $query->whereDoesntHave('images', function($q) {
                    $q->where('is_primary', true);
                });
            }
        }

        $products = $query->withCount('images')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        // Load images with their URL accessors for each product
        $products->getCollection()->load(['images' => function($query) {
            $query->orderBy('sort_order')->orderBy('created_at');
        }]);

        return Inertia::render('Products/Images/Index', [
            'products' => $products,
            'filters' => $request->all(['search', 'category_id', 'brand_id', 'image_status']),
            'categories' => \App\Models\Category::active()->orderBy('name')->get(),
            'brands' => \App\Models\Brand::active()->orderBy('name')->get(),
        ]);
    }

    public function show(Product $product)
    {
        $product->load(['images' => function($query) {
            $query->orderBy('sort_order')->orderBy('created_at');
        }]);

        return Inertia::render('Products/Images/Show', [
            'product' => $product,
        ]);
    }

    public function upload(Request $request, Product $product)
    {
        $validated = $request->validate([
            'images' => 'required|array|max:10',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120', // Max 5MB per image
        ]);

        $uploadedImages = [];
        $sortOrder = $product->images()->max('sort_order') ?? 0;

        foreach ($request->file('images') as $index => $image) {
            $sortOrder++;
            
            // Ana resmi kaydet
            $imagePath = $image->store('products/' . $product->id, 'public');
            
            // Thumbnail oluştur
            $thumbnailPath = $this->createThumbnail($image, $product->id);
            
            // Veritabanına kaydet
            $productImage = $product->images()->create([
                'image_path' => $imagePath,
                'thumbnail_path' => $thumbnailPath,
                'is_primary' => $product->images()->count() === 0 && $index === 0, // İlk görsel ana görsel olsun
                'sort_order' => $sortOrder,
            ]);

            $uploadedImages[] = $productImage;
        }

        return redirect()->back()
            ->with('success', count($uploadedImages) . ' görsel başarıyla yüklendi.');
    }

    public function updateOrder(Request $request, Product $product)
    {
        $validated = $request->validate([
            'images' => 'required|array',
            'images.*.id' => 'required|exists:product_images,id',
            'images.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($validated['images'] as $imageData) {
            ProductImage::where('id', $imageData['id'])
                ->where('product_id', $product->id)
                ->update(['sort_order' => $imageData['sort_order']]);
        }

        return redirect()->back()
            ->with('success', 'Görsel sıralaması güncellendi.');
    }

    public function setPrimary(Request $request, Product $product, ProductImage $image)
    {
        // Önce tüm görsellerin primary durumunu kaldır
        $product->images()->update(['is_primary' => false]);
        
        // Seçilen görseli primary yap
        $image->update(['is_primary' => true]);

        return redirect()->back()
            ->with('success', 'Ana görsel güncellendi.');
    }

    public function destroy(Product $product, ProductImage $image)
    {
        // Dosyaları sil
        Storage::disk('public')->delete($image->image_path);
        if ($image->thumbnail_path) {
            Storage::disk('public')->delete($image->thumbnail_path);
        }

        // Eğer ana görsel siliniyorsa, diğer bir görseli ana görsel yap
        $wasPrimary = $image->is_primary;
        $image->delete();

        if ($wasPrimary) {
            $firstImage = $product->images()->orderBy('sort_order')->first();
            if ($firstImage) {
                $firstImage->update(['is_primary' => true]);
            }
        }

        return redirect()->back()
            ->with('success', 'Görsel başarıyla silindi.');
    }

    public function bulkUpload(Request $request)
    {
        $validated = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
            'images' => 'required|array|max:50',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $uploadedCount = 0;

        foreach ($validated['product_ids'] as $productId) {
            $product = Product::find($productId);
            $sortOrder = $product->images()->max('sort_order') ?? 0;

            foreach ($request->file('images') as $image) {
                $sortOrder++;
                
                // Ana resmi kaydet
                $imagePath = $image->store('products/' . $product->id, 'public');
                
                // Thumbnail oluştur
                $thumbnailPath = $this->createThumbnail($image, $product->id);
                
                // Veritabanına kaydet
                $product->images()->create([
                    'image_path' => $imagePath,
                    'thumbnail_path' => $thumbnailPath,
                    'is_primary' => $product->images()->count() === 0,
                    'sort_order' => $sortOrder,
                ]);

                $uploadedCount++;
            }
        }

        return redirect()->back()
            ->with('success', $uploadedCount . ' görsel başarıyla yüklendi.');
    }

    public function optimize(Request $request)
    {
        $validated = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
            'quality' => 'required|integer|min:50|max:100',
            'max_width' => 'required|integer|min:200|max:2000',
            'max_height' => 'required|integer|min:200|max:2000',
        ]);

        $processedCount = 0;

        $products = Product::whereIn('id', $validated['product_ids'])
            ->with('images')
            ->get();

        foreach ($products as $product) {
            foreach ($product->images as $image) {
                try {
                    $this->optimizeImage($image, $validated);
                    $processedCount++;
                } catch (\Exception $e) {
                    // Log error but continue
                    \Log::error('Image optimization failed: ' . $e->getMessage());
                }
            }
        }

        return redirect()->back()
            ->with('success', $processedCount . ' görsel optimize edildi.');
    }

    private function createThumbnail($image, $productId)
    {
        try {
            // Check if Intervention Image is available
            if (!class_exists('Intervention\Image\ImageManager')) {
                Log::warning('Intervention Image package not installed. Skipping thumbnail creation.');
                return null;
            }

            $manager = new \Intervention\Image\ImageManager(new \Intervention\Image\Drivers\Gd\Driver());
            
            // Thumbnail boyutları
            $thumbnailWidth = 300;
            $thumbnailHeight = 300;
            
            // Orijinal resmi yükle
            $processedImage = $manager->read($image->getPathname());
            
            // Thumbnail oluştur
            $processedImage->resize($thumbnailWidth, $thumbnailHeight, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });
            
            // Thumbnail dosya adı
            $filename = 'thumb_' . uniqid() . '.jpg';
            $thumbnailPath = 'products/' . $productId . '/' . $filename;
            
            // Thumbnail'i kaydet
            Storage::disk('public')->put(
                $thumbnailPath,
                $processedImage->toJpeg(85)->toFilePointer()
            );
            
            return $thumbnailPath;
            
        } catch (\Exception $e) {
            // Thumbnail oluşturulamazsa orijinal resmi kullan
            Log::error('Thumbnail creation failed: ' . $e->getMessage());
            return null;
        }
    }

    private function optimizeImage($productImage, $settings)
    {
        try {
            // Check if Intervention Image is available
            if (!class_exists('Intervention\Image\ImageManager')) {
                Log::warning('Intervention Image package not installed. Skipping image optimization.');
                return;
            }

            $manager = new \Intervention\Image\ImageManager(new \Intervention\Image\Drivers\Gd\Driver());
            
            // Orijinal dosya yolu
            $imagePath = storage_path('app/public/' . $productImage->image_path);
            
            if (!file_exists($imagePath)) {
                return;
            }
            
            // Resmi yükle
            $image = $manager->read($imagePath);
            
            // Boyutları kontrol et ve gerekirse küçült
            if ($image->width() > $settings['max_width'] || $image->height() > $settings['max_height']) {
                $image->resize($settings['max_width'], $settings['max_height'], function ($constraint) {
                    $constraint->aspectRatio();
                    $constraint->upsize();
                });
            }
            
            // Kaliteyi ayarla ve kaydet
            $optimizedImage = $image->toJpeg($settings['quality']);
            file_put_contents($imagePath, $optimizedImage);
            
            // Thumbnail'i de optimize et
            if ($productImage->thumbnail_path) {
                $thumbnailPath = storage_path('app/public/' . $productImage->thumbnail_path);
                if (file_exists($thumbnailPath)) {
                    $thumbnail = $manager->read($thumbnailPath);
                    $optimizedThumbnail = $thumbnail->toJpeg($settings['quality']);
                    file_put_contents($thumbnailPath, $optimizedThumbnail);
                }
            }
        } catch (\Exception $e) {
            Log::error('Image optimization failed: ' . $e->getMessage());
        }
    }
}