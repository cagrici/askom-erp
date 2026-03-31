<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\SalesReturnImage;
use App\Models\SalesOrder;
use App\Models\CurrentAccount;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class SalesReturnController extends Controller
{
    /**
     * Display a listing of returns
     */
    public function index(Request $request)
    {
        $query = SalesReturn::with([
            'salesOrder',
            'customer',
            'items',
            'createdBy',
            'approvedBy',
            'driver'
        ])->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by customer
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('return_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('return_date', '<=', $request->date_to);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('return_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($customerQuery) use ($search) {
                      $customerQuery->where('title', 'like', "%{$search}%");
                  })
                  ->orWhereHas('salesOrder', function($orderQuery) use ($search) {
                      $orderQuery->where('order_number', 'like', "%{$search}%");
                  });
            });
        }

        // Role-based filtering
        $user = Auth::user();
        if (!$user->hasRole('admin') && !$user->hasRole('warehouse_manager')) {
            // Regular customers can only see their own returns
            $query->where('created_by_id', $user->id);
        }

        $returns = $query->paginate(15)->withQueryString();

        return Inertia::render('Sales/Returns/Index', [
            'returns' => $returns,
            'filters' => $request->only(['status', 'customer_id', 'date_from', 'date_to', 'search']),
            'statuses' => SalesReturn::getStatuses(),
            'reasons' => SalesReturn::getReasons(),
        ]);
    }

    /**
     * Show the form for creating a new return
     */
    public function create()
    {
        // Get user's returnable orders
        $maxReturnDays = Setting::get('sales_return.max_days', 15);
        $minDate = Carbon::now()->subDays($maxReturnDays);

        $returnableOrders = SalesOrder::with(['items.product', 'customer'])
            ->where('customer_id', Auth::user()->id)
            ->where('status', SalesOrder::STATUS_DELIVERED)
            ->where('delivered_at', '>=', $minDate)
            ->whereDoesntHave('returns', function($query) {
                $query->whereIn('status', [
                    SalesReturn::STATUS_PENDING_APPROVAL,
                    SalesReturn::STATUS_APPROVED,
                    SalesReturn::STATUS_PROCESSING,
                    SalesReturn::STATUS_COMPLETED
                ]);
            })
            ->orderBy('delivered_at', 'desc')
            ->get();

        return Inertia::render('Sales/Returns/Create', [
            'returnableOrders' => $returnableOrders,
            'reasons' => SalesReturn::getReasons(),
            'maxReturnDays' => $maxReturnDays,
            'minImages' => Setting::get('sales_return.min_images', 3),
        ]);
    }

    /**
     * Store a newly created return
     */
    public function store(Request $request)
    {
        $minImages = Setting::get('sales_return.min_images', 3);

        $validated = $request->validate([
            'sales_order_id' => 'required|exists:sales_orders,id',
            'return_reason' => 'required|in:damaged,wrong_product,quality_issue,expired,other',
            'return_description' => 'required|string|max:2000',
            'items' => 'required|array|min:1',
            'items.*.sales_order_item_id' => 'required|exists:sales_order_items,id',
            'items.*.quantity_returned' => 'required|numeric|min:0.001',
            'items.*.images' => "required|array|min:{$minImages}",
            'items.*.images.*' => 'required|image|max:10240', // 10MB max
        ]);

        try {
            DB::beginTransaction();

            // Get order and verify ownership
            $order = SalesOrder::with('items')->findOrFail($validated['sales_order_id']);

            // Check if order is returnable
            $maxReturnDays = Setting::get('sales_return.max_days', 15);
            $minDate = Carbon::now()->subDays($maxReturnDays);

            if (!$order->delivered_at || $order->delivered_at < $minDate) {
                return back()->with('error', 'Bu sipariş için iade süresi geçmiş.');
            }

            // Create return
            $return = SalesReturn::create([
                'sales_order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'return_date' => now(),
                'status' => SalesReturn::STATUS_PENDING_APPROVAL,
                'return_reason' => $validated['return_reason'],
                'return_description' => $validated['return_description'],
                'created_by_id' => Auth::id(),
                'location_id' => Auth::user()->location_id,
            ]);

            // Create return items and upload images
            foreach ($validated['items'] as $index => $itemData) {
                $orderItem = $order->items()->findOrFail($itemData['sales_order_item_id']);

                // Validate quantity
                if ($itemData['quantity_returned'] > $orderItem->quantity) {
                    throw new \Exception('İade miktarı sipariş miktarından fazla olamaz.');
                }

                $returnItem = SalesReturnItem::create([
                    'sales_return_id' => $return->id,
                    'sales_order_item_id' => $orderItem->id,
                    'product_id' => $orderItem->product_id,
                    'product_name' => $orderItem->product_name,
                    'product_code' => $orderItem->product_code,
                    'quantity_returned' => $itemData['quantity_returned'],
                    'unit_price' => $orderItem->unit_price,
                    'line_total' => $itemData['quantity_returned'] * $orderItem->unit_price,
                    'sort_order' => $index,
                ]);

                // Upload images
                if (isset($itemData['images'])) {
                    foreach ($itemData['images'] as $imgIndex => $image) {
                        $path = $image->store('returns/' . $return->id, 'public');

                        SalesReturnImage::create([
                            'sales_return_id' => $return->id,
                            'sales_return_item_id' => $returnItem->id,
                            'image_path' => $path,
                            'image_type' => SalesReturnImage::TYPE_RETURN_REQUEST,
                            'uploaded_by_id' => Auth::id(),
                            'sort_order' => $imgIndex,
                        ]);
                    }
                }
            }

            // Calculate total
            $return->calculateTotal();

            DB::commit();

            // Send notification to warehouse manager
            $this->notifyWarehouseManager($return);

            return redirect()->route('sales.returns.show', $return->id)
                ->with('success', 'İade talebiniz başarıyla oluşturuldu.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'İade talebi oluşturulurken hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified return
     */
    public function show($id)
    {
        $return = SalesReturn::with([
            'salesOrder.items',
            'customer',
            'items.product',
            'items.images',
            'images',
            'createdBy',
            'approvedBy',
            'rejectedBy',
            'driver',
            'processedBy',
            'location',
        ])->findOrFail($id);

        // Authorization check
        $user = Auth::user();
        if (!$user->hasRole('admin') && !$user->hasRole('warehouse_manager')) {
            if ($return->created_by_id !== $user->id) {
                abort(403, 'Bu iade talebini görüntüleme yetkiniz yok.');
            }
        }

        return Inertia::render('Sales/Returns/Show', [
            'return' => $return,
            'canApprove' => $user->hasRole('warehouse_manager') && $return->canBeApproved(),
            'canReject' => $user->hasRole('warehouse_manager') && $return->canBeRejected(),
            'canAssignDriver' => $user->hasRole('warehouse_manager') && $return->canAssignDriver(),
            'canProcess' => $user->hasRole('warehouse_manager') && $return->canBeProcessed(),
        ]);
    }

    /**
     * Approve return
     */
    public function approve(Request $request, $id)
    {
        $return = SalesReturn::findOrFail($id);

        if (!$return->canBeApproved()) {
            return back()->with('error', 'Bu iade talebi onaylanamaz.');
        }

        $validated = $request->validate([
            'refund_method' => 'required|in:credit_note,bank_transfer,cash,replacement',
        ]);

        try {
            $return->approve(Auth::id(), $validated['refund_method']);

            // Send email to customer
            $this->notifyCustomerApproval($return);

            return back()->with('success', 'İade talebi onaylandı.');
        } catch (\Exception $e) {
            return back()->with('error', 'Onaylama sırasında hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Reject return
     */
    public function reject(Request $request, $id)
    {
        $return = SalesReturn::findOrFail($id);

        if (!$return->canBeRejected()) {
            return back()->with('error', 'Bu iade talebi reddedilemez.');
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        try {
            $return->reject(Auth::id(), $validated['rejection_reason']);

            // Send email to customer
            $this->notifyCustomerRejection($return);

            return back()->with('success', 'İade talebi reddedildi.');
        } catch (\Exception $e) {
            return back()->with('error', 'Reddetme sırasında hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Assign driver to return
     */
    public function assignDriver(Request $request, $id)
    {
        $return = SalesReturn::findOrFail($id);

        if (!$return->canAssignDriver()) {
            return back()->with('error', 'Bu iade için şoför atanamaz.');
        }

        $validated = $request->validate([
            'driver_id' => 'required|exists:users,id',
            'pickup_date' => 'required|date|after_or_equal:today',
        ]);

        try {
            $return->assignDriver($validated['driver_id'], $validated['pickup_date']);

            // Send notification to driver
            $this->notifyDriver($return);

            return back()->with('success', 'Şoför atandı.');
        } catch (\Exception $e) {
            return back()->with('error', 'Şoför atama sırasında hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Mark return as picked up
     */
    public function markPickedUp(Request $request, $id)
    {
        $return = SalesReturn::findOrFail($id);

        $validated = $request->validate([
            'pickup_notes' => 'nullable|string|max:1000',
            'images' => 'nullable|array',
            'images.*' => 'image|max:10240',
        ]);

        try {
            DB::beginTransaction();

            $return->markAsPickedUp($validated['pickup_notes'] ?? null);

            // Upload pickup confirmation images
            if (isset($validated['images'])) {
                foreach ($validated['images'] as $index => $image) {
                    $path = $image->store('returns/' . $return->id . '/pickup', 'public');

                    SalesReturnImage::create([
                        'sales_return_id' => $return->id,
                        'image_path' => $path,
                        'image_type' => SalesReturnImage::TYPE_PICKUP_CONFIRMATION,
                        'uploaded_by_id' => Auth::id(),
                        'sort_order' => $index,
                    ]);
                }
            }

            DB::commit();

            return back()->with('success', 'İade teslim alındı olarak işaretlendi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'İşlem sırasında hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Complete return processing
     */
    public function complete(Request $request, $id)
    {
        $return = SalesReturn::with('items')->findOrFail($id);

        if (!$return->canBeProcessed()) {
            return back()->with('error', 'Bu iade işlenemiyor.');
        }

        $validated = $request->validate([
            'warehouse_notes' => 'nullable|string|max:2000',
            'items' => 'required|array',
            'items.*.id' => 'required|exists:sales_return_items,id',
            'items.*.condition' => 'required|in:undamaged,minor_damage,major_damage,unusable',
        ]);

        try {
            DB::beginTransaction();

            // Update item conditions
            foreach ($validated['items'] as $itemData) {
                $item = SalesReturnItem::findOrFail($itemData['id']);
                $item->update(['condition' => $itemData['condition']]);
            }

            // Complete return
            $return->complete(Auth::id(), $validated['warehouse_notes'] ?? null);

            // TODO: Update inventory based on item conditions

            DB::commit();

            // Send completion notification to customer
            $this->notifyCustomerCompletion($return);

            return back()->with('success', 'İade işlemi tamamlandı.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'İşlem sırasında hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Download return form PDF
     */
    public function downloadPdf($id)
    {
        $return = SalesReturn::with([
            'salesOrder',
            'customer',
            'items.product',
            'items.images',
            'driver',
        ])->findOrFail($id);

        $pdf = PDF::loadView('pdf.sales-return', ['return' => $return]);

        return $pdf->download("iade-formu-{$return->return_no}.pdf");
    }

    /**
     * Get returnable orders for a customer (AJAX)
     */
    public function getReturnableOrders(Request $request)
    {
        $maxReturnDays = Setting::get('sales_return.max_days', 15);
        $minDate = Carbon::now()->subDays($maxReturnDays);

        $orders = SalesOrder::with(['items.product.images'])
            ->where('customer_id', Auth::user()->id)
            ->where('status', SalesOrder::STATUS_DELIVERED)
            ->where('delivered_at', '>=', $minDate)
            ->orderBy('delivered_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    /**
     * Notification methods
     */
    private function notifyWarehouseManager($return)
    {
        try {
            $emails = explode(',', Setting::get('sales_return.notification_emails', ''));

            if (!empty($emails)) {
                foreach ($emails as $email) {
                    Mail::send('emails.return-new-request', ['return' => $return], function($message) use ($email, $return) {
                        $message->to(trim($email))
                            ->subject("Yeni İade Talebi - {$return->return_no}");
                    });
                }
            }
        } catch (\Exception $e) {
            \Log::error('Return notification failed: ' . $e->getMessage());
        }
    }

    private function notifyCustomerApproval($return)
    {
        try {
            $email = $return->customer->email;

            if ($email) {
                Mail::send('emails.return-approved', ['return' => $return], function($message) use ($email, $return) {
                    $message->to($email)
                        ->subject("İade Talebiniz Onaylandı - {$return->return_no}");
                });
            }
        } catch (\Exception $e) {
            \Log::error('Return approval notification failed: ' . $e->getMessage());
        }
    }

    private function notifyCustomerRejection($return)
    {
        try {
            $email = $return->customer->email;

            if ($email) {
                Mail::send('emails.return-rejected', ['return' => $return], function($message) use ($email, $return) {
                    $message->to($email)
                        ->subject("İade Talebiniz Hakkında - {$return->return_no}");
                });
            }
        } catch (\Exception $e) {
            \Log::error('Return rejection notification failed: ' . $e->getMessage());
        }
    }

    private function notifyDriver($return)
    {
        try {
            $email = $return->driver->email;

            if ($email) {
                Mail::send('emails.return-driver-assigned', ['return' => $return], function($message) use ($email, $return) {
                    $message->to($email)
                        ->subject("İade Teslim Alma Görevi - {$return->return_no}");
                });
            }
        } catch (\Exception $e) {
            \Log::error('Driver notification failed: ' . $e->getMessage());
        }
    }

    private function notifyCustomerCompletion($return)
    {
        try {
            $email = $return->customer->email;

            if ($email) {
                Mail::send('emails.return-completed', ['return' => $return], function($message) use ($email, $return) {
                    $message->to($email)
                        ->subject("İade İşleminiz Tamamlandı - {$return->return_no}");
                });
            }
        } catch (\Exception $e) {
            \Log::error('Return completion notification failed: ' . $e->getMessage());
        }
    }
}
