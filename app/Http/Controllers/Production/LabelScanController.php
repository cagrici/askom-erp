<?php

namespace App\Http\Controllers\Production;

use App\Http\Controllers\Controller;
use App\Models\ProductionLabel;
use App\Models\PrdtWorderM;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class LabelScanController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        // Permission kontrolü opsiyonel - aktifleştirmek için:
        // $this->middleware('permission:view_production');
    }

    public function index()
    {
        return Inertia::render('Production/LabelScan/Index');
    }

    public function scan(Request $request)
    {
        $request->validate([
            'label_code' => 'required|string|exists:production_labels,label_code',
        ]);

        $label = ProductionLabel::where('label_code', $request->label_code)
            ->with(['workOrder.product'])
            ->first();

        if ($label->is_scanned) {
            return response()->json([
                'success' => false,
                'message' => 'Bu etiket daha önce okutulmuş!',
            ], 400);
        }

        DB::beginTransaction();
        try {
            $label->update([
                'is_scanned' => true,
                'scanned_at' => now(),
                'scanned_by' => auth()->id(),
            ]);

            $workOrder = $label->workOrder;
            
            // Tüm etiketler okutulduysa iş emrini kapat
            if ($workOrder->remaining_quantity == 0) {
                $workOrder->update([
                    'open_close' => '2',
                    'update_date' => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Ürün başarıyla kaydedildi',
                'data' => [
                    'label_code' => $label->label_code,
                    'work_order' => [
                        'worder_no' => $workOrder->worder_no,
                        'product_name' => $workOrder->product->name ?? 'N/A',
                        'total_quantity' => $workOrder->total_quantity,
                        'scanned_quantity' => $workOrder->scanned_quantity,
                        'remaining_quantity' => $workOrder->remaining_quantity,
                        'is_completed' => $workOrder->remaining_quantity == 0,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Kayıt sırasında hata oluştu: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function statistics()
    {
        $today = now()->startOfDay();
        
        $stats = [
            'today_scanned' => ProductionLabel::where('scanned_at', '>=', $today)->count(),
            'total_pending' => ProductionLabel::where('is_scanned', false)->where('is_printed', true)->count(),
            'recent_scans' => ProductionLabel::with(['workOrder.product', 'scannedByUser'])
                ->where('is_scanned', true)
                ->latest('scanned_at')
                ->take(10)
                ->get()
                ->map(fn ($label) => [
                    'label_code' => $label->label_code,
                    'work_order_no' => $label->workOrder->worder_no,
                    'product_name' => $label->workOrder->product->name ?? 'N/A',
                    'scanned_at' => $label->scanned_at->format('H:i:s'),
                    'scanned_by' => $label->scannedByUser->name ?? 'N/A',
                ]),
        ];

        return response()->json($stats);
    }
}