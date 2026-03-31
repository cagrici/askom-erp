<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\PickingTask;
use App\Models\PickingTaskItem;
use App\Models\PickingScan;
use App\Models\ShippingOrder;
use App\Models\ShippingOrderItem;
use App\Models\Product;
use App\Models\Barcode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PickingTaskController extends Controller
{
    /**
     * Depo elemanının toplama görevleri listesi
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();

        $query = PickingTask::with([
            'shippingOrder.salesOrder.customer',
            'assignedTo',
            'assignedBy',
        ]);

        // Filter by assigned user (for warehouse workers)
        if ($request->filled('my_tasks') || !$user->hasAnyRole(['warehouse_manager', 'depo_yoneticisi', 'admin'])) {
            $query->where('assigned_to_id', $user->id);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            // Default: active tasks
            $query->active();
        }

        // Date filter
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $query->orderByRaw("FIELD(status, 'in_progress', 'assigned', 'completed', 'cancelled')")
            ->orderBy('created_at', 'desc');

        $pickingTasks = $query->paginate(20)->withQueryString();

        // Get stats
        $stats = [
            'my_assigned' => PickingTask::where('assigned_to_id', $user->id)
                ->where('status', PickingTask::STATUS_ASSIGNED)
                ->count(),
            'my_in_progress' => PickingTask::where('assigned_to_id', $user->id)
                ->where('status', PickingTask::STATUS_IN_PROGRESS)
                ->count(),
            'total_pending' => PickingTask::whereIn('status', [
                PickingTask::STATUS_ASSIGNED,
                PickingTask::STATUS_IN_PROGRESS,
            ])->count(),
        ];

        return Inertia::render('Warehouse/PickingTasks/Index', [
            'pickingTasks' => $pickingTasks,
            'stats' => $stats,
            'filters' => $request->only(['status', 'date', 'my_tasks']),
            'statuses' => PickingTask::getStatuses(),
        ]);
    }

    /**
     * Toplama görevi detayı (Barkod okuma ekranı)
     */
    public function show(PickingTask $pickingTask): Response
    {
        $pickingTask->load([
            'shippingOrder.salesOrder.customer',
            'assignedTo',
            'assignedBy',
            'items.product',
            'items.shippingOrderItem',
            'scans' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(20);
            },
        ]);

        // Check authorization
        $user = auth()->user();
        if ($pickingTask->assigned_to_id !== $user->id &&
            !$user->hasAnyRole(['warehouse_manager', 'depo_yoneticisi', 'admin'])) {
            abort(403, 'Bu toplama görevini görüntüleme yetkiniz yok.');
        }

        // Group items by corridor for optimized picking route
        $itemsByCorridor = $pickingTask->items
            ->sortBy(['corridor', 'shelf', 'bin_location'])
            ->groupBy('corridor');

        return Inertia::render('Warehouse/PickingTasks/Show', [
            'pickingTask' => $pickingTask,
            'itemsByCorridor' => $itemsByCorridor,
            'canStart' => $pickingTask->isAssigned() && $pickingTask->assigned_to_id === $user->id,
            'canComplete' => $pickingTask->isInProgress(),
            'isOwner' => $pickingTask->assigned_to_id === $user->id,
        ]);
    }

    /**
     * Toplama görevini başlat
     */
    public function start(PickingTask $pickingTask)
    {
        $user = auth()->user();

        if ($pickingTask->assigned_to_id !== $user->id) {
            return back()->withErrors(['error' => 'Bu toplama görevi size atanmamış.']);
        }

        if (!$pickingTask->isAssigned()) {
            return back()->withErrors(['error' => 'Bu toplama görevi başlatılamaz.']);
        }

        $pickingTask->start();

        return back()->with('success', 'Toplama görevi başlatıldı.');
    }

    /**
     * Barkod okuma API
     */
    public function scanBarcode(Request $request, PickingTask $pickingTask)
    {
        $user = auth()->user();

        // Authorization check
        if ($pickingTask->assigned_to_id !== $user->id) {
            return response()->json([
                'success' => false,
                'error' => 'Bu toplama görevi size atanmamış.',
                'scan_result' => 'wrong_order',
            ], 403);
        }

        if (!$pickingTask->isInProgress()) {
            return response()->json([
                'success' => false,
                'error' => 'Toplama görevi aktif değil.',
                'scan_result' => 'wrong_order',
            ], 400);
        }

        $validated = $request->validate([
            'barcode' => 'required|string|max:100',
            'quantity' => 'nullable|numeric|min:0.001',
            'picking_task_item_id' => 'nullable|exists:picking_task_items,id',
        ]);

        $barcode = $validated['barcode'];
        $quantity = $validated['quantity'] ?? 1;

        DB::beginTransaction();

        try {
            // Find product by barcode
            $product = $this->findProductByBarcode($barcode);

            if (!$product) {
                // Log failed scan
                PickingScan::create([
                    'picking_task_id' => $pickingTask->id,
                    'picking_task_item_id' => $validated['picking_task_item_id'] ?? null,
                    'product_id' => null,
                    'scanned_by_id' => $user->id,
                    'barcode' => $barcode,
                    'quantity' => $quantity,
                    'scan_result' => 'not_found',
                    'error_message' => 'Barkod bulunamadı',
                ]);

                DB::commit();

                return response()->json([
                    'success' => false,
                    'error' => 'Barkod bulunamadı: ' . $barcode,
                    'scan_result' => 'not_found',
                ]);
            }

            // Find matching picking task item
            $pickingTaskItem = null;

            if ($validated['picking_task_item_id']) {
                // Specific item targeted
                $pickingTaskItem = PickingTaskItem::find($validated['picking_task_item_id']);
                if ($pickingTaskItem && $pickingTaskItem->product_id !== $product->id) {
                    // Wrong product for this item
                    PickingScan::create([
                        'picking_task_id' => $pickingTask->id,
                        'picking_task_item_id' => $pickingTaskItem->id,
                        'product_id' => $product->id,
                        'scanned_by_id' => $user->id,
                        'barcode' => $barcode,
                        'quantity' => $quantity,
                        'scan_result' => 'wrong_product',
                        'error_message' => 'Yanlış ürün. Beklenen: ' . $pickingTaskItem->product->name,
                    ]);

                    DB::commit();

                    return response()->json([
                        'success' => false,
                        'error' => 'Yanlış ürün! Beklenen: ' . $pickingTaskItem->product->name,
                        'scan_result' => 'wrong_product',
                        'expected_product' => $pickingTaskItem->product->name,
                        'scanned_product' => $product->name,
                    ]);
                }
            } else {
                // Find any pending item for this product
                $pickingTaskItem = $pickingTask->items()
                    ->where('product_id', $product->id)
                    ->whereIn('status', [
                        PickingTaskItem::STATUS_PENDING,
                        PickingTaskItem::STATUS_IN_PROGRESS,
                    ])
                    ->first();
            }

            if (!$pickingTaskItem) {
                // Product not in this picking task
                PickingScan::create([
                    'picking_task_id' => $pickingTask->id,
                    'picking_task_item_id' => null,
                    'product_id' => $product->id,
                    'scanned_by_id' => $user->id,
                    'barcode' => $barcode,
                    'quantity' => $quantity,
                    'scan_result' => 'wrong_order',
                    'error_message' => 'Bu ürün bu toplama görevinde yok',
                ]);

                DB::commit();

                return response()->json([
                    'success' => false,
                    'error' => 'Bu ürün bu toplama görevinde yok: ' . $product->name,
                    'scan_result' => 'wrong_order',
                    'product_name' => $product->name,
                ]);
            }

            // Check quantity limit
            $remainingQuantity = $pickingTaskItem->remaining_quantity;
            if ($quantity > $remainingQuantity) {
                $quantity = $remainingQuantity; // Auto-adjust to remaining
            }

            // Record successful scan
            $scan = $pickingTaskItem->recordScan($barcode, $quantity, $user, 'success');

            // Refresh item
            $pickingTaskItem->refresh();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Ürün tarandı: ' . $product->name,
                'scan_result' => 'success',
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'code' => $product->code,
                ],
                'picking_task_item' => [
                    'id' => $pickingTaskItem->id,
                    'required_quantity' => $pickingTaskItem->required_quantity,
                    'picked_quantity' => $pickingTaskItem->picked_quantity,
                    'remaining_quantity' => $pickingTaskItem->remaining_quantity,
                    'status' => $pickingTaskItem->status,
                    'is_completed' => $pickingTaskItem->isCompleted(),
                ],
                'scan' => [
                    'id' => $scan->id,
                    'quantity' => $scan->quantity,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Barcode scan failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => 'Tarama hatası: ' . $e->getMessage(),
                'scan_result' => 'error',
            ], 500);
        }
    }

    /**
     * Kalemi atla
     */
    public function skipItem(Request $request, PickingTask $pickingTask, PickingTaskItem $pickingTaskItem)
    {
        if ($pickingTaskItem->picking_task_id !== $pickingTask->id) {
            return response()->json(['error' => 'Kalem bu göreve ait değil.'], 400);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:200',
        ]);

        $pickingTaskItem->skip($validated['reason'] ?? null);
        $pickingTask->updateProgress();

        return response()->json([
            'success' => true,
            'message' => 'Kalem atlandı.',
        ]);
    }

    /**
     * Kalemi kısmi tamamla
     */
    public function markItemPartial(PickingTask $pickingTask, PickingTaskItem $pickingTaskItem)
    {
        if ($pickingTaskItem->picking_task_id !== $pickingTask->id) {
            return response()->json(['error' => 'Kalem bu göreve ait değil.'], 400);
        }

        $pickingTaskItem->markAsPartial();
        $pickingTask->updateProgress();

        return response()->json([
            'success' => true,
            'message' => 'Kalem kısmi olarak işaretlendi.',
        ]);
    }

    /**
     * Toplama görevini tamamla
     */
    public function complete(PickingTask $pickingTask)
    {
        $user = auth()->user();

        if ($pickingTask->assigned_to_id !== $user->id &&
            !$user->hasAnyRole(['warehouse_manager', 'depo_yoneticisi', 'admin'])) {
            return back()->withErrors(['error' => 'Bu işlemi yapma yetkiniz yok.']);
        }

        if (!$pickingTask->isInProgress()) {
            return back()->withErrors(['error' => 'Bu toplama görevi tamamlanamaz.']);
        }

        // Check if there are pending items
        $pendingItems = $pickingTask->items()
            ->where('status', PickingTaskItem::STATUS_PENDING)
            ->count();

        if ($pendingItems > 0) {
            return back()->withErrors([
                'error' => "Tamamlanmamış {$pendingItems} kalem var. Önce tüm kalemleri toplayın veya atlayın.",
            ]);
        }

        $pickingTask->complete();

        return back()->with('success', 'Toplama görevi tamamlandı.');
    }

    /**
     * Toplama görevi iptal
     */
    public function cancel(Request $request, PickingTask $pickingTask)
    {
        $user = auth()->user();

        if (!$user->hasAnyRole(['warehouse_manager', 'depo_yoneticisi', 'admin'])) {
            return back()->withErrors(['error' => 'Bu işlemi yapma yetkiniz yok.']);
        }

        if (!$pickingTask->isActive()) {
            return back()->withErrors(['error' => 'Bu toplama görevi iptal edilemez.']);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:200',
        ]);

        $pickingTask->cancel();

        // Revert shipping order status if needed
        $shippingOrder = $pickingTask->shippingOrder;
        if ($shippingOrder->status === ShippingOrder::STATUS_PICKING) {
            // Check if there are other active picking tasks
            $otherActiveTasks = $shippingOrder->pickingTasks()
                ->where('id', '!=', $pickingTask->id)
                ->active()
                ->exists();

            if (!$otherActiveTasks) {
                $shippingOrder->updateStatus(ShippingOrder::STATUS_PENDING);
            }
        }

        return back()->with('success', 'Toplama görevi iptal edildi.');
    }

    /**
     * Barkoddan ürün bul
     */
    protected function findProductByBarcode(string $barcode): ?Product
    {
        // First check barcode table
        $barcodeRecord = Barcode::where('barcode', $barcode)->first();
        if ($barcodeRecord) {
            return $barcodeRecord->product;
        }

        // Then check product code
        $product = Product::where('code', $barcode)->first();
        if ($product) {
            return $product;
        }

        // Check product barcode field
        $product = Product::where('barcode', $barcode)->first();
        if ($product) {
            return $product;
        }

        return null;
    }

    /**
     * Toplama listesi PDF
     */
    public function downloadPdf(PickingTask $pickingTask)
    {
        $pickingTask->load([
            'shippingOrder.salesOrder.customer',
            'assignedTo',
            'items.product',
        ]);

        // Group items by corridor for optimized picking
        $itemsByCorridor = $pickingTask->items
            ->sortBy(['corridor', 'shelf', 'bin_location'])
            ->groupBy('corridor');

        $pdf = \PDF::loadView('pdf.picking-list', [
            'pickingTask' => $pickingTask,
            'itemsByCorridor' => $itemsByCorridor,
        ]);

        $filename = "toplama-listesi-{$pickingTask->task_number}.pdf";

        return $pdf->download($filename);
    }
}
