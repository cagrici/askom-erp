<?php

namespace App\Http\Controllers\Portal;

use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\SalesReturnImage;
use App\Models\SalesOrder;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class PortalReturnController extends BasePortalController
{
    public function index(Request $request)
    {
        $customerId = $this->getSelectedAccountId();

        $query = SalesReturn::where('customer_id', $customerId)
            ->with(['salesOrder', 'items', 'approvedBy', 'driver'])
            ->orderBy('created_at', 'desc');

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->where('return_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('return_date', '<=', $request->date_to);
        }

        $returns = $query->paginate(15)->withQueryString();

        return Inertia::render('Portal/Returns/Index', [
            'returns' => $returns,
            'filters' => $request->only(['status', 'date_from', 'date_to']),
            'statuses' => SalesReturn::getStatuses(),
        ]);
    }

    public function create()
    {
        $customerId = $this->getSelectedAccountId();
        $maxReturnDays = Setting::get('sales_return.max_days', 15);
        $minDate = Carbon::now()->subDays($maxReturnDays);

        $returnableOrders = SalesOrder::with(['items.product.images'])
            ->where('customer_id', $customerId)
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

        return Inertia::render('Portal/Returns/Create', [
            'returnableOrders' => $returnableOrders,
            'reasons' => SalesReturn::getReasons(),
            'maxReturnDays' => $maxReturnDays,
            'minImages' => Setting::get('sales_return.min_images', 3),
        ]);
    }

    public function store(Request $request)
    {
        Log::info('Return creation started', [
            'user_id' => Auth::id(),
            'all_keys' => array_keys($request->all()),
            'request_data' => $request->except(['items']),
            'items_count' => $request->has('items') ? count($request->items) : 0,
            'has_files' => $request->hasFile('items.0.images.0')
        ]);

        $customerId = $this->getSelectedAccountId();

        Log::info('Selected account', ['customer_id' => $customerId]);

        if (!$customerId) {
            Log::error('No customer account selected');
            return back()->withErrors(['error' => 'Lütfen bir müşteri hesabı seçin.']);
        }

        $minImages = Setting::get('sales_return.min_images', 3);

        $validated = $request->validate([
            'sales_order_id' => 'required|exists:sales_orders,id',
            'return_reason' => 'required|in:damaged,wrong_product,quality_issue,expired,other',
            'return_description' => 'required|string|max:2000',
            'items' => 'required|array|min:1',
            'items.*.sales_order_item_id' => 'required|exists:sales_order_items,id',
            'items.*.quantity_returned' => 'required|numeric|min:0.001',
            'items.*.images' => "required|array|min:{$minImages}",
            'items.*.images.*' => 'required|image|max:10240',
        ], [
            'sales_order_id.required' => 'Sipariş seçmelisiniz.',
            'sales_order_id.exists' => 'Geçersiz sipariş.',
            'return_reason.required' => 'İade nedenini seçmelisiniz.',
            'return_description.required' => 'İade açıklaması girmelisiniz.',
            'items.required' => 'En az bir ürün seçmelisiniz.',
            'items.min' => 'En az bir ürün seçmelisiniz.',
            'items.*.sales_order_item_id.required' => 'Ürün ID bilgisi eksik.',
            'items.*.quantity_returned.required' => 'İade miktarı girmelisiniz.',
            'items.*.quantity_returned.min' => 'İade miktarı en az 0.001 olmalıdır.',
            'items.*.images.required' => "Her ürün için en az {$minImages} fotoğraf yüklemelisiniz.",
            'items.*.images.min' => "Her ürün için en az {$minImages} fotoğraf yüklemelisiniz.",
            'items.*.images.*.required' => 'Fotoğraf yüklemelisiniz.',
            'items.*.images.*.image' => 'Sadece resim dosyaları yükleyebilirsiniz.',
            'items.*.images.*.max' => 'Resim boyutu maksimum 10MB olabilir.',
        ]);

        Log::info('Validation passed', ['validated_items_count' => count($validated['items'])]);

        try {
            DB::beginTransaction();

            $order = SalesOrder::with('items')->findOrFail($validated['sales_order_id']);
            Log::info('Order found', ['order_id' => $order->id, 'customer_id' => $order->customer_id]);

            // Verify ownership
            if ($order->customer_id != $customerId) {
                abort(403);
            }

            // Check return period
            $maxReturnDays = Setting::get('sales_return.max_days', 15);
            $minDate = Carbon::now()->subDays($maxReturnDays);

            if (!$order->delivered_at || $order->delivered_at < $minDate) {
                return back()->with('error', 'Bu sipariş için iade süresi geçmiş.');
            }

            Log::info('Creating return record');

            $return = SalesReturn::create([
                'sales_order_id' => $order->id,
                'customer_id' => $customerId,
                'return_date' => now(),
                'status' => SalesReturn::STATUS_PENDING_APPROVAL,
                'return_reason' => $validated['return_reason'],
                'return_description' => $validated['return_description'],
                'created_by_id' => Auth::id(),
            ]);

            Log::info('Return created', ['return_id' => $return->id, 'return_no' => $return->return_no]);

            foreach ($validated['items'] as $index => $itemData) {
                $orderItem = $order->items()->findOrFail($itemData['sales_order_item_id']);

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

                if (isset($itemData['images'])) {
                    Log::info('Processing images for item', [
                        'item_id' => $returnItem->id,
                        'images_count' => count($itemData['images'])
                    ]);

                    foreach ($itemData['images'] as $imgIndex => $image) {
                        Log::info('Processing image', ['index' => $imgIndex, 'is_file' => is_object($image)]);

                        // Resize and optimize image before storing
                        $path = $this->storeOptimizedImage($image, $return->id);

                        Log::info('Image stored', ['path' => $path]);

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

            $return->calculateTotal();

            Log::info('Return total calculated', ['total' => $return->total_amount]);

            DB::commit();

            Log::info('Transaction committed, sending notification');

            // Notify warehouse manager
            $this->notifyWarehouseManager($return);

            Log::info('Redirecting to return detail', ['return_id' => $return->id]);

            // Check if request expects JSON (for axios requests)
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'İade talebiniz başarıyla oluşturuldu.',
                    'return_id' => $return->id,
                    'return_no' => $return->return_no,
                ]);
            }

            return redirect()->route('portal.returns.show', $return->id)
                ->with('success', 'İade talebiniz başarıyla oluşturuldu.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Return creation failed: ' . $e->getMessage(), [
                'customer_id' => $customerId,
                'request' => $request->except(['items']),
                'trace' => $e->getTraceAsString()
            ]);
            return back()
                ->withInput()
                ->withErrors(['error' => 'İade talebi oluşturulurken hata oluştu: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        $customerId = $this->getSelectedAccountId();

        $return = SalesReturn::with([
            'salesOrder',
            'items.images',
            'approvedBy',
            'rejectedBy',
            'driver',
        ])->findOrFail($id);

        // Verify ownership
        if ($return->customer_id != $customerId) {
            abort(403);
        }

        return Inertia::render('Portal/Returns/Show', [
            'return' => $return,
        ]);
    }

    public function getReturnableOrders(Request $request)
    {
        $customerId = $this->getSelectedAccountId();
        $maxReturnDays = Setting::get('sales_return.max_days', 15);
        $minDate = Carbon::now()->subDays($maxReturnDays);

        $orders = SalesOrder::with(['items.product.images'])
            ->where('customer_id', $customerId)
            ->where('status', SalesOrder::STATUS_DELIVERED)
            ->where('delivered_at', '>=', $minDate)
            ->orderBy('delivered_at', 'desc')
            ->get();

        return response()->json($orders);
    }

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
            Log::error('Return notification failed: ' . $e->getMessage());
        }
    }

    /**
     * Store and optimize return image
     * Resizes image to max 1920x1920 and quality 85%
     */
    private function storeOptimizedImage($uploadedFile, $returnId)
    {
        try {
            $manager = new ImageManager(new Driver());

            // Read the uploaded image
            $image = $manager->read($uploadedFile->getPathname());

            // Max dimensions for return images
            $maxWidth = 1920;
            $maxHeight = 1920;
            $quality = 85;

            // Resize if necessary (maintain aspect ratio)
            if ($image->width() > $maxWidth || $image->height() > $maxHeight) {
                $image->scale(width: $maxWidth, height: $maxHeight);
            }

            // Generate unique filename
            $filename = uniqid() . '.jpg';
            $path = 'returns/' . $returnId . '/' . $filename;

            // Convert to JPEG and save with compression
            Storage::disk('public')->put(
                $path,
                $image->toJpeg($quality)->toFilePointer()
            );

            return $path;

        } catch (\Exception $e) {
            Log::error('Return image optimization failed: ' . $e->getMessage());
            // Fallback to normal store without optimization
            return $uploadedFile->store('returns/' . $returnId, 'public');
        }
    }
}
