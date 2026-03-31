<?php

namespace App\Http\Controllers\Production;

use App\Http\Controllers\Controller;
use App\Models\PrdtWorderM;
use App\Models\ProductionLabel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;


class WorkOrderController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        // Permission kontrolü opsiyonel - aktifleştirmek için:
        // $this->middleware('permission:view_production');
    }

    public function index(Request $request)
    {
        $workOrders = PrdtWorderM::with(['product', 'labels'])
            ->open()
            ->latest('create_date')
            ->paginate(20);

        return Inertia::render('Production/WorkOrder/Index', [
            'workOrders' => $workOrders->through(fn ($workOrder) => [
                'id' => $workOrder->id,
                'worder_no' => $workOrder->worder_no,
                'product' => $workOrder->product ? [
                    'id' => $workOrder->product->id,
                    'item_name' => $workOrder->product->item_name ?? 'N/A',
                ] : null,
                'total_quantity' => $workOrder->total_quantity,
                'scanned_quantity' => $workOrder->scanned_quantity,
                'remaining_quantity' => $workOrder->remaining_quantity,
                'status_name' => $workOrder->status_name,
                'create_date' => $workOrder->create_date?->format('Y-m-d H:i:s'),
            ]),
        ]);
    }

    public function show(PrdtWorderM $workOrder)
    {
        $workOrder->load(['product', 'labels']);

        return Inertia::render('Production/WorkOrder/Show', [
            'workOrder' => [
                'id' => $workOrder->id,
                'worder_no' => $workOrder->worder_no,
                'product' => $workOrder->product ? [
                    'id' => $workOrder->product->id,
                    'name' => $workOrder->product->item_name ?? 'N/A',
                ] : null,
                'total_quantity' => $workOrder->total_quantity,
                'scanned_quantity' => $workOrder->scanned_quantity,
                'remaining_quantity' => $workOrder->remaining_quantity,
                'created_labels_count' => $workOrder->created_labels_count,
                'remaining_labels_to_create' => $workOrder->remaining_labels_to_create,
                'status_name' => $workOrder->status_name,
                'create_date' => $workOrder->create_date?->format('Y-m-d H:i:s'),
                'labels' => $workOrder->labels->map(fn ($label) => [
                    'id' => $label->id,
                    'label_code' => $label->label_code,
                    'is_printed' => $label->is_printed,
                    'is_scanned' => $label->is_scanned,
                    'printed_at' => $label->printed_at?->format('Y-m-d H:i:s'),
                    'scanned_at' => $label->scanned_at?->format('Y-m-d H:i:s'),
                ]),
            ],
        ]);
    }

    public function generateLabels(PrdtWorderM $workOrder, Request $request)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1|max:' . $workOrder->remaining_labels_to_create,
        ]);

        if ($workOrder->remaining_labels_to_create <= 0) {
            return response()->json(['message' => 'Bu iş emri için maksimum etiket sayısına ulaşıldı.'], 400);
        }

        DB::beginTransaction();
        try {
            $labels = [];
            $timestamp = time();

            for ($i = 0; $i < $request->quantity; $i++) {
                $label = ProductionLabel::create([
                    'worder_m_id' => $workOrder->id,
                    'unix_timestamp' => $timestamp,
                    'label_code' => '', // Will be updated after creation
                ]);

                $label->update([
                    'label_code' => $label->generateLabelCode(),
                ]);

                $labels[] = $label;
            }

            DB::commit();

            return response()->json([
                'message' => "{$request->quantity} etiket başarıyla oluşturuldu",
                'labels' => collect($labels)->map(fn ($label) => [
                    'id' => $label->id,
                    'label_code' => $label->label_code,
                    'unix_timestamp' => $label->unix_timestamp,
                ]),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Etiket oluşturma hatası: ' . $e->getMessage()], 500);
        }
    }

    public function printLabels(Request $request)
    {
        $request->validate([
            'label_ids' => 'required|array',
            'label_ids.*' => 'exists:production_labels,id',
        ]);

        $labels = ProductionLabel::whereIn('id', $request->label_ids)
            ->with('workOrder')
            ->get();

        // Zebra printer için ZPL formatında etiket komutları oluştur
        $zplCommands = [];
        foreach ($labels as $label) {
            $zpl = "^XA\n";
            $zpl .= "^FO50,50^A0N,50,50^FD{$label->workOrder->worder_no}^FS\n";
            $zpl .= "^FO50,120^A0N,30,30^FDÜrün: " . ($label->workOrder->product->item_name ?? 'N/A') . "^FS\n";
            $zpl .= "^FO50,180^BY3^BCN,100,Y,N,N^FD{$label->label_code}^FS\n";
            $zpl .= "^FO50,300^A0N,25,25^FDTarih: " . date('Y-m-d H:i:s', $label->unix_timestamp) . "^FS\n";
            $zpl .= "^XZ\n";

            $zplCommands[] = $zpl;
        }

        // Etiketleri yazdırıldı olarak işaretle
        ProductionLabel::whereIn('id', $request->label_ids)->update([
            'is_printed' => true,
            'printed_at' => now(),
        ]);

        return response()->json([
            'message' => count($labels) . ' etiket yazdırma kuyruğuna gönderildi',
            'zpl_commands' => $zplCommands,
        ]);
    }

    public function deleteLabels(Request $request)
    {
        $request->validate([
            'label_ids' => 'required|array',
            'label_ids.*' => 'exists:production_labels,id',
        ]);

        // Sadece yazdırılmamış etiketleri silebilir
        $labels = ProductionLabel::whereIn('id', $request->label_ids)
            ->where('is_printed', false)
            ->get();

        if ($labels->count() !== count($request->label_ids)) {
            return response()->json(['message' => 'Yazdırılmış etiketler silinemez.'], 400);
        }

        $deletedCount = ProductionLabel::whereIn('id', $request->label_ids)
            ->where('is_printed', false)
            ->delete();

        return response()->json([
            'message' => "{$deletedCount} etiket başarıyla silindi",
        ]);
    }
}
