<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Barcode;
use App\Models\InventoryItem;
use App\Models\WarehouseLocation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;

class BarcodeController extends Controller
{
    /**
     * Display barcodes
     */
    public function index(Request $request)
    {
        $query = Barcode::with(['entity', 'creator']);

        // Search filter
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('barcode', 'like', '%' . $request->search . '%')
                  ->orWhere('entity_type', 'like', '%' . $request->search . '%');
            });
        }

        // Entity type filter
        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        // Barcode type filter
        if ($request->filled('barcode_type')) {
            $query->where('barcode_type', $request->barcode_type);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Active filter
        if ($request->filled('active')) {
            $query->where('is_active', $request->active === 'yes');
        }

        // Sorting
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $barcodes = $query->paginate(20)->withQueryString();

        return Inertia::render('Inventory/Barcodes/Index', [
            'barcodes' => $barcodes,
            'filters' => $request->all(['search', 'entity_type', 'barcode_type', 'status', 'active', 'sort_field', 'sort_direction']),
        ]);
    }

    /**
     * Show barcode details
     */
    public function show(Barcode $barcode)
    {
        $barcode->load(['entity', 'creator', 'updater', 'lastScannedBy']);

        return Inertia::render('Inventory/Barcodes/Show', [
            'barcode' => $barcode,
        ]);
    }

    /**
     * Generate barcode for entity
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'entity_type' => 'required|string',
            'entity_id' => 'required|integer',
            'barcode_type' => 'required|in:CODE128,EAN13,QR,PDF417,DATAMATRIX',
            'purpose' => 'nullable|string|max:100',
            'width' => 'nullable|integer|min:100|max:1000',
            'height' => 'nullable|integer|min:50|max:500',
            'custom_barcode' => 'nullable|string|max:100|unique:barcodes,barcode',
        ]);

        // Generate barcode value if not provided
        if (!$validated['custom_barcode']) {
            $barcode = $this->generateBarcodeValue($validated['entity_type'], $validated['entity_id']);
        } else {
            $barcode = $validated['custom_barcode'];
        }

        $barcodeRecord = Barcode::create([
            'barcode' => $barcode,
            'barcode_type' => $validated['barcode_type'],
            'entity_type' => $validated['entity_type'],
            'entity_id' => $validated['entity_id'],
            'width' => $validated['width'] ?? 300,
            'height' => $validated['height'] ?? 100,
            'purpose' => $validated['purpose'] ?? 'identification',
            'is_primary' => !Barcode::where('entity_type', $validated['entity_type'])
                ->where('entity_id', $validated['entity_id'])
                ->where('is_primary', true)
                ->exists(),
            'is_active' => true,
            'status' => 'active',
            'created_by' => auth()->id(),
        ]);

        // Generate barcode image
        $imagePath = $this->generateBarcodeImage($barcodeRecord);

        return response()->json([
            'success' => true,
            'barcode' => $barcodeRecord->fresh(),
            'image_path' => $imagePath,
        ]);
    }

    /**
     * Scan barcode
     */
    public function scan(Request $request)
    {
        $validated = $request->validate([
            'barcode' => 'required|string',
            'scanner_device' => 'nullable|string|max:100',
            'location' => 'nullable|array',
        ]);

        $barcode = Barcode::where('barcode', $validated['barcode'])
            ->where('is_active', true)
            ->where('status', 'active')
            ->first();

        if (!$barcode) {
            return response()->json([
                'success' => false,
                'message' => 'Barkod bulunamadı veya aktif değil.',
            ], 404);
        }

        // Check if barcode is valid
        if (!$barcode->is_valid) {
            return response()->json([
                'success' => false,
                'message' => 'Barkod geçerli değil veya süresi dolmuş.',
            ], 400);
        }

        // Record scan
        $barcode->scan(auth()->id(), $validated['scanner_device']);

        // Load entity data
        $barcode->load('entity');

        return response()->json([
            'success' => true,
            'barcode' => $barcode,
            'entity' => $barcode->entity,
            'scan_info' => [
                'scan_count' => $barcode->scan_count,
                'last_scanned_at' => $barcode->last_scanned_at,
                'scanner_device' => $validated['scanner_device'],
            ],
        ]);
    }

    /**
     * Print barcode
     */
    public function print(Request $request, Barcode $barcode)
    {
        $validated = $request->validate([
            'format' => 'nullable|in:PNG,PDF,SVG',
            'width' => 'nullable|integer|min:100|max:1000',
            'height' => 'nullable|integer|min:50|max:500',
            'label_template' => 'nullable|string',
            'quantity' => 'nullable|integer|min:1|max:100',
        ]);

        $format = $validated['format'] ?? $barcode->format ?? 'PNG';
        $width = $validated['width'] ?? $barcode->width ?? 300;
        $height = $validated['height'] ?? $barcode->height ?? 100;
        $quantity = $validated['quantity'] ?? 1;

        try {
            // Generate barcode file
            $filePath = $this->generateBarcodeFile($barcode, $format, $width, $height);

            // Record print
            for ($i = 0; $i < $quantity; $i++) {
                $barcode->print(auth()->id());
            }

            // Return file download response
            return $this->downloadBarcodeFile($filePath, $barcode->barcode, $format);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Barkod yazdırılırken hata oluştu: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk generate barcodes
     */
    public function bulkGenerate(Request $request)
    {
        $validated = $request->validate([
            'entities' => 'required|array|min:1|max:100',
            'entities.*.entity_type' => 'required|string',
            'entities.*.entity_id' => 'required|integer',
            'barcode_type' => 'required|in:CODE128,EAN13,QR,PDF417,DATAMATRIX',
            'purpose' => 'nullable|string|max:100',
        ]);

        $generatedBarcodes = [];
        $errors = [];

        foreach ($validated['entities'] as $index => $entityData) {
            try {
                // Check if barcode already exists
                $existingBarcode = Barcode::where('entity_type', $entityData['entity_type'])
                    ->where('entity_id', $entityData['entity_id'])
                    ->where('is_primary', true)
                    ->where('is_active', true)
                    ->first();

                if ($existingBarcode) {
                    $errors[] = "Entity {$entityData['entity_type']}:{$entityData['entity_id']} already has a primary barcode";
                    continue;
                }

                $barcode = $this->generateBarcodeValue($entityData['entity_type'], $entityData['entity_id']);

                $barcodeRecord = Barcode::create([
                    'barcode' => $barcode,
                    'barcode_type' => $validated['barcode_type'],
                    'entity_type' => $entityData['entity_type'],
                    'entity_id' => $entityData['entity_id'],
                    'purpose' => $validated['purpose'] ?? 'identification',
                    'is_primary' => true,
                    'is_active' => true,
                    'status' => 'active',
                    'created_by' => auth()->id(),
                ]);

                $generatedBarcodes[] = $barcodeRecord;

            } catch (\Exception $e) {
                $errors[] = "Error generating barcode for entity {$entityData['entity_type']}:{$entityData['entity_id']}: " . $e->getMessage();
            }
        }

        return response()->json([
            'success' => count($generatedBarcodes) > 0,
            'generated_count' => count($generatedBarcodes),
            'barcodes' => $generatedBarcodes,
            'errors' => $errors,
        ]);
    }

    /**
     * Update barcode
     */
    public function update(Request $request, Barcode $barcode)
    {
        $validated = $request->validate([
            'is_active' => 'boolean',
            'status' => 'in:active,inactive,expired,damaged,replaced',
            'purpose' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
        ]);

        $barcode->update(array_merge($validated, [
            'updated_by' => auth()->id(),
        ]));

        return response()->json([
            'success' => true,
            'barcode' => $barcode->fresh(),
        ]);
    }

    /**
     * Replace barcode
     */
    public function replace(Request $request, Barcode $barcode)
    {
        $validated = $request->validate([
            'barcode_type' => 'nullable|in:CODE128,EAN13,QR,PDF417,DATAMATRIX',
            'custom_barcode' => 'nullable|string|max:100|unique:barcodes,barcode',
            'reason' => 'required|string|max:255',
        ]);

        try {
            $newBarcodeData = [];
            
            if ($validated['barcode_type']) {
                $newBarcodeData['barcode_type'] = $validated['barcode_type'];
            }

            if ($validated['custom_barcode']) {
                $newBarcodeData['barcode'] = $validated['custom_barcode'];
            }

            $newBarcode = $barcode->replace($newBarcodeData, $validated['reason']);

            return response()->json([
                'success' => true,
                'old_barcode' => $barcode->fresh(),
                'new_barcode' => $newBarcode,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Barkod değiştirilirken hata oluştu: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete barcode
     */
    public function destroy(Barcode $barcode)
    {
        if ($barcode->scan_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Daha önce taranmış barkodlar silinemez.',
            ], 400);
        }

        $barcode->delete();

        return response()->json([
            'success' => true,
            'message' => 'Barkod başarıyla silindi.',
        ]);
    }

    /**
     * Generate barcode value
     */
    private function generateBarcodeValue($entityType, $entityId)
    {
        $prefix = match($entityType) {
            'InventoryItem' => 'ITM',
            'WarehouseLocation' => 'LOC',
            'Product' => 'PRD',
            default => 'GEN'
        };

        return $prefix . str_pad($entityId, 10, '0', STR_PAD_LEFT);
    }

    /**
     * Generate barcode image
     */
    private function generateBarcodeImage(Barcode $barcode)
    {
        // This would integrate with a barcode generation library
        // For now, return placeholder path
        $filename = "barcode_{$barcode->id}.{$barcode->format}";
        $path = "barcodes/{$filename}";

        // Here you would integrate with libraries like:
        // - picqer/php-barcode-generator
        // - milon/barcode
        // - tecnickcom/tcpdf

        // Example with picqer/php-barcode-generator:
        /*
        $generator = new \Picqer\Barcode\BarcodeGeneratorPNG();
        $barcodeData = $generator->getBarcode($barcode->barcode, $generator::TYPE_CODE_128);
        Storage::put($path, $barcodeData);
        */

        $barcode->update(['image_path' => $path]);

        return $path;
    }

    /**
     * Generate barcode file for printing
     */
    private function generateBarcodeFile(Barcode $barcode, $format, $width, $height)
    {
        $filename = "print_barcode_{$barcode->id}_{$width}x{$height}.{$format}";
        $path = "temp/barcodes/{$filename}";

        // Generate barcode based on format
        switch ($format) {
            case 'PNG':
                return $this->generatePNG($barcode, $path, $width, $height);
            case 'PDF':
                return $this->generatePDF($barcode, $path, $width, $height);
            case 'SVG':
                return $this->generateSVG($barcode, $path, $width, $height);
            default:
                throw new \Exception('Unsupported format: ' . $format);
        }
    }

    private function generatePNG(Barcode $barcode, $path, $width, $height)
    {
        // PNG generation logic
        // Placeholder implementation
        $image = imagecreate($width, $height);
        $white = imagecolorallocate($image, 255, 255, 255);
        $black = imagecolorallocate($image, 0, 0, 0);
        
        // Add barcode text
        imagestring($image, 5, 10, $height/2, $barcode->barcode, $black);
        
        $fullPath = storage_path('app/' . $path);
        imagepng($image, $fullPath);
        imagedestroy($image);
        
        return $path;
    }

    private function generatePDF(Barcode $barcode, $path, $width, $height)
    {
        // PDF generation logic would go here
        // This would typically use libraries like TCPDF or mPDF
        return $path;
    }

    private function generateSVG(Barcode $barcode, $path, $width, $height)
    {
        // SVG generation logic would go here
        return $path;
    }

    /**
     * Download barcode file
     */
    private function downloadBarcodeFile($filePath, $barcodeValue, $format)
    {
        $fullPath = storage_path('app/' . $filePath);
        
        if (!file_exists($fullPath)) {
            throw new \Exception('Barcode file not found');
        }

        $filename = "barcode_{$barcodeValue}.{$format}";
        
        return Response::download($fullPath, $filename)->deleteFileAfterSend();
    }

    /**
     * Validate barcode
     */
    public function validateBarcode(Request $request)
    {
        $validated = $request->validate([
            'barcode' => 'required|string',
        ]);

        $barcode = Barcode::where('barcode', $validated['barcode'])->first();

        if (!$barcode) {
            return response()->json([
                'valid' => false,
                'message' => 'Barkod bulunamadı.',
            ]);
        }

        $isValid = $barcode->validate();

        return response()->json([
            'valid' => $isValid,
            'barcode' => $barcode,
            'message' => $isValid ? 'Barkod geçerli.' : 'Barkod geçersiz.',
        ]);
    }

    /**
     * Get barcode statistics
     */
    public function statistics(Request $request)
    {
        $stats = [
            'total_barcodes' => Barcode::count(),
            'active_barcodes' => Barcode::where('is_active', true)->count(),
            'by_type' => Barcode::selectRaw('barcode_type, COUNT(*) as count')
                ->groupBy('barcode_type')
                ->pluck('count', 'barcode_type'),
            'by_entity_type' => Barcode::selectRaw('entity_type, COUNT(*) as count')
                ->groupBy('entity_type')
                ->pluck('count', 'entity_type'),
            'scan_statistics' => [
                'total_scans' => Barcode::sum('scan_count'),
                'most_scanned' => Barcode::orderBy('scan_count', 'desc')->limit(10)->get(),
                'recent_scans' => Barcode::whereNotNull('last_scanned_at')
                    ->orderBy('last_scanned_at', 'desc')
                    ->limit(10)
                    ->get(),
            ],
            'print_statistics' => [
                'total_prints' => Barcode::sum('times_printed'),
                'most_printed' => Barcode::orderBy('times_printed', 'desc')->limit(10)->get(),
            ],
        ];

        return response()->json($stats);
    }
}