<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Picqer\Barcode\BarcodeGeneratorPNG;
use Picqer\Barcode\BarcodeGeneratorHTML;

class ProductBarcodeController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'brand']);

        // Arama
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%')
                  ->orWhere('sku', 'like', '%' . $request->search . '%')
                  ->orWhere('barcode', 'like', '%' . $request->search . '%');
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

        // Sadece barkodu olan ürünler
        if ($request->boolean('only_with_barcode')) {
            $query->whereNotNull('barcode')->where('barcode', '!=', '');
        }

        // Sadece barkodu olmayan ürünler
        if ($request->boolean('only_without_barcode')) {
            $query->where(function($q) {
                $q->whereNull('barcode')->orWhere('barcode', '');
            });
        }

        $products = $query->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Products/Barcodes/Index', [
            'products' => $products,
            'filters' => $request->all(['search', 'category_id', 'brand_id', 'only_with_barcode', 'only_without_barcode']),
            'categories' => \App\Models\Category::active()->orderBy('name')->get(),
            'brands' => \App\Models\Brand::active()->orderBy('name')->get(),
        ]);
    }

    public function generateBarcode(Request $request, Product $product)
    {
        $validated = $request->validate([
            'barcode' => 'required|string|max:50|unique:products,barcode,' . $product->id,
            'barcode_type' => 'required|in:CODE128,EAN13,CODE39,UPCA'
        ]);

        $product->update(['barcode' => $validated['barcode']]);

        return redirect()->back()
            ->with('success', 'Barkod başarıyla güncellendi.');
    }

    public function bulkGenerateBarcodes(Request $request)
    {
        $validated = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
            'barcode_type' => 'required|in:CODE128,EAN13,CODE39,UPCA',
            'prefix' => 'nullable|string|max:10',
        ]);

        $successCount = 0;
        $products = Product::whereIn('id', $validated['product_ids'])->get();

        foreach ($products as $product) {
            if (empty($product->barcode)) {
                $barcode = $this->generateUniqueBarcode($validated['prefix'] ?? '', $validated['barcode_type']);
                $product->update(['barcode' => $barcode]);
                $successCount++;
            }
        }

        return redirect()->back()
            ->with('success', "{$successCount} ürün için barkod oluşturuldu.");
    }

    public function downloadBarcodes(Request $request)
    {
        $validated = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
            'barcode_type' => 'required|in:CODE128,EAN13,CODE39,UPCA',
            'format' => 'required|in:pdf,png',
            'size' => 'required|in:small,medium,large',
        ]);

        $products = Product::whereIn('id', $validated['product_ids'])
            ->whereNotNull('barcode')
            ->where('barcode', '!=', '')
            ->get();

        if ($products->isEmpty()) {
            return redirect()->back()
                ->withErrors(['error' => 'Seçilen ürünlerde barkod bulunmuyor.']);
        }

        if ($validated['format'] === 'pdf') {
            return $this->generateBarcodePDF($products, $validated);
        } else {
            return $this->generateBarcodeZip($products, $validated);
        }
    }

    public function printBarcodes(Request $request)
    {
        $validated = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
            'barcode_type' => 'required|in:CODE128,EAN13,CODE39,UPCA',
            'label_size' => 'required|in:30x20,40x30,50x25,70x35',
            'columns' => 'required|integer|min:1|max:10',
            'show_product_name' => 'boolean',
            'show_price' => 'boolean',
        ]);

        $products = Product::whereIn('id', $validated['product_ids'])
            ->whereNotNull('barcode')
            ->where('barcode', '!=', '')
            ->with(['category', 'brand'])
            ->get();

        return Inertia::render('Products/Barcodes/Print', [
            'products' => $products,
            'settings' => $validated,
        ]);
    }

    private function generateUniqueBarcode($prefix = '', $type = 'CODE128')
    {
        do {
            if ($type === 'EAN13') {
                $barcode = $prefix . str_pad(rand(100000000000, 999999999999), 12, '0', STR_PAD_LEFT);
            } else {
                $barcode = $prefix . strtoupper(\Str::random(8)) . rand(1000, 9999);
            }
        } while (Product::where('barcode', $barcode)->exists());

        return $barcode;
    }

    private function generateBarcodePDF($products, $settings)
    {
        // PDF generation logic will be implemented here
        // Using libraries like TCPDF or DomPDF
        
        return response()->json(['message' => 'PDF generation not implemented yet']);
    }

    private function generateBarcodeZip($products, $settings)
    {
        // ZIP generation logic will be implemented here
        
        return response()->json(['message' => 'ZIP generation not implemented yet']);
    }
}