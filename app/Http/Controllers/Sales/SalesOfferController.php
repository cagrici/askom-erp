<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\SalesOffer;
use App\Models\SalesOfferItem;
use App\Models\CurrentAccount;
use App\Models\Product;
use App\Models\Unit;
use App\Models\Currency;
use App\Models\Location;
use App\Models\SalesOrder;
use App\Models\User;
use App\Models\ExchangeRate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Mail\SalesOfferMail;
use App\Services\SalesOfferExportService;
use App\Services\ProductSearchService;

class SalesOfferController extends Controller
{
    /**
     * Display a listing of sales offers
     */
    public function index(Request $request)
    {
        $query = SalesOffer::with(['entity', 'creator', 'currency', 'location'])
            ->orderBy('created_at', 'desc');

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $normalized = str_replace(['ı', 'İ'], ['i', 'i'], mb_strtolower($search, 'UTF-8'));
            $query->where(function($q) use ($search, $normalized) {
                $q->where('offer_no', 'like', "%{$search}%")
                  ->orWhereRaw("LOWER(REPLACE(REPLACE(customer_name, 'ı', 'i'), 'İ', 'i')) LIKE ?", ["%{$normalized}%"])
                  ->orWhereHas('entity', function($eq) use ($normalized) {
                      $eq->whereRaw("LOWER(REPLACE(REPLACE(title, 'ı', 'i'), 'İ', 'i')) LIKE ?", ["%{$normalized}%"]);
                  });
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('offer_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('offer_date', '<=', $request->date_to);
        }

        $offers = $query->paginate(20);

        return Inertia::render('Sales/Offers/Index', [
            'offers' => $offers,
            'filters' => $request->only(['status', 'search', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show the form for creating a new offer
     */
    public function create()
    {
        // Sadece desteklenen para birimleri
        $allowedCurrencies = ['TRY', 'USD', 'EUR', 'GBP'];

        return Inertia::render('Sales/Offers/Create', [
            // entities kaldırıldı - AJAX ile yüklenecek
            // products kaldırıldı - AJAX ile aranacak
            'units' => Unit::where('is_active', true)->orderBy('name')->get(),
            'currencies' => Currency::active()
                ->whereIn('cur_code', $allowedCurrencies)
                ->orderByRaw("FIELD(cur_code, 'TRY', 'USD', 'EUR', 'GBP')")
                ->get(),
            'locations' => Location::active()->orderBy('name')->get(),
        ]);
    }

    /**
     * Store a newly created offer
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'offer_date' => 'required|date',
            'valid_until_date' => 'required|date|after:offer_date',
            'entity_id' => 'nullable|exists:current_accounts,id',
            'customer_name' => 'nullable|required_without:entity_id|string|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'customer_email' => 'nullable|email|max:255',
            'customer_address' => 'nullable|string',
            'customer_tax_no' => 'nullable|string|max:50',
            'discount_rate' => 'nullable|numeric|min:0|max:100',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'currency_id' => 'required|exists:currencies,id',
            'notes' => 'nullable|string',
            'customer_notes' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
            'location_id' => 'nullable|exists:locations,id',
            'sales_person_id' => 'nullable|exists:users,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_name' => 'required_without:items.*.product_id|string',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_id' => 'nullable|exists:units,id',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_rate1' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_rate2' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_rate3' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.description' => 'nullable|string|max:500',
        ]);

        try {
            DB::beginTransaction();

            // Convert empty strings to null for better data consistency
            foreach (['customer_name', 'customer_phone', 'customer_email', 'customer_address', 'customer_tax_no'] as $field) {
                if (isset($validated[$field]) && $validated[$field] === '') {
                    $validated[$field] = null;
                }
            }

            // If entity_id is provided, clear temporary customer fields
            if (!empty($validated['entity_id'])) {
                $validated['customer_name'] = null;
                $validated['customer_phone'] = null;
                $validated['customer_email'] = null;
                $validated['customer_address'] = null;
                $validated['customer_tax_no'] = null;
            }

            // Create offer
            $offer = SalesOffer::create([
                'offer_date' => $validated['offer_date'],
                'valid_until_date' => $validated['valid_until_date'],
                'entity_id' => $validated['entity_id'] ?? null,
                'customer_name' => $validated['customer_name'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_address' => $validated['customer_address'] ?? null,
                'customer_tax_no' => $validated['customer_tax_no'] ?? null,
                'discount_rate' => $validated['discount_rate'] ?? 0,
                'tax_rate' => $validated['tax_rate'] ?? 20,
                'currency_id' => $validated['currency_id'],
                'notes' => $validated['notes'] ?? null,
                'customer_notes' => $validated['customer_notes'] ?? null,
                'terms_conditions' => $validated['terms_conditions'] ?? null,
                'created_by' => Auth::id(),
                'sales_person_id' => $validated['sales_person_id'] ?? Auth::id(),
                'location_id' => $validated['location_id'] ?? null,
                'status' => 'draft',
            ]);

            // Create offer items
            foreach ($validated['items'] as $index => $itemData) {
                $item = new SalesOfferItem([
                    'product_id' => $itemData['product_id'] ?? null,
                    'product_name' => $itemData['product_name'] ?? null,
                    'product_code' => $itemData['product_code'] ?? null,
                    'description' => $itemData['description'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'unit_id' => $itemData['unit_id'] ?? null,
                    'unit_price' => $itemData['unit_price'],
                    'discount_rate1' => $itemData['discount_rate1'] ?? 0,
                    'discount_rate2' => $itemData['discount_rate2'] ?? 0,
                    'discount_rate3' => $itemData['discount_rate3'] ?? 0,
                    'tax_rate' => $itemData['tax_rate'] ?? 20,
                    'sort_order' => $index,
                ]);

                $item->calculateTotal();
                $offer->items()->save($item);
            }

            // Calculate offer totals
            $offer->load('items');
            $offer->calculateTotals();
            $offer->save();

            DB::commit();

            return redirect()->route('sales.offers.show', $offer->id)
                ->with('success', 'Teklif başarıyla oluşturuldu.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Teklif oluşturulurken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified offer
     */
    public function show($id)
    {
        $offer = SalesOffer::with([
            'items.product.images',
            'items.unit',
            'entity',
            'currency',
            'creator',
            'salesPerson',
            'approver',
            'location',
            'convertedOrder',
            'emailLogs.sender',
        ])->findOrFail($id);

        return Inertia::render('Sales/Offers/Show', [
            'offer' => $offer,
            'canConvert' => $offer->canConvertToOrder(),
        ]);
    }

    /**
     * Show the form for editing the specified offer
     */
    public function edit($id)
    {
        $offer = SalesOffer::with(['items.product.images', 'items.unit', 'entity'])->findOrFail($id);

        // Only draft and sent offers can be edited
        if (!in_array($offer->status, ['draft', 'sent'])) {
            return redirect()->route('sales.offers.show', $id)
                ->with('error', 'Sadece taslak ve gönderilmiş teklifler düzenlenebilir.');
        }

        return Inertia::render('Sales/Offers/Edit', [
            'offer' => $offer,
            'units' => Unit::where('is_active', true)->orderBy('name')->get(),
            'currencies' => Currency::active()->orderBy('description')->get(),
            'locations' => Location::active()->orderBy('name')->get(),
        ]);
    }

    /**
     * Update the specified offer
     */
    public function update(Request $request, $id)
    {
        $offer = SalesOffer::findOrFail($id);

        if (!in_array($offer->status, ['draft', 'sent'])) {
            return back()->with('error', 'Sadece taslak ve gönderilmiş teklifler düzenlenebilir.');
        }

        $validated = $request->validate([
            'offer_date' => 'required|date',
            'valid_until_date' => 'required|date|after:offer_date',
            'entity_id' => 'nullable|exists:current_accounts,id',
            'customer_name' => 'nullable|required_without:entity_id|string|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'customer_email' => 'nullable|email|max:255',
            'customer_address' => 'nullable|string',
            'customer_tax_no' => 'nullable|string|max:50',
            'discount_rate' => 'nullable|numeric|min:0|max:100',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'currency_id' => 'required|exists:currencies,id',
            'notes' => 'nullable|string',
            'customer_notes' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
            'location_id' => 'nullable|exists:locations,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_name' => 'nullable|string|max:255',
            'items.*.product_code' => 'nullable|string|max:100',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_id' => 'nullable|exists:units,id',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_rate1' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_rate2' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_rate3' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        try {
            DB::beginTransaction();

            // Convert empty strings to null for better data consistency
            foreach (['customer_name', 'customer_phone', 'customer_email', 'customer_address', 'customer_tax_no'] as $field) {
                if (isset($validated[$field]) && $validated[$field] === '') {
                    $validated[$field] = null;
                }
            }

            // If entity_id is provided, clear temporary customer fields
            if (!empty($validated['entity_id'])) {
                $validated['customer_name'] = null;
                $validated['customer_phone'] = null;
                $validated['customer_email'] = null;
                $validated['customer_address'] = null;
                $validated['customer_tax_no'] = null;
            } else {
                // If no entity_id, clear it to null
                $validated['entity_id'] = null;
            }

            \Log::info('Updating offer', ['offer_id' => $id, 'entity_id' => $validated['entity_id'] ?? 'not set']);

            $offer->update($validated);

            // Delete old items and create new ones
            $offer->items()->delete();

            foreach ($validated['items'] as $index => $itemData) {
                $item = new SalesOfferItem([
                    'product_id' => $itemData['product_id'] ?? null,
                    'product_name' => $itemData['product_name'] ?? null,
                    'product_code' => $itemData['product_code'] ?? null,
                    'description' => $itemData['description'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'unit_id' => $itemData['unit_id'] ?? null,
                    'unit_price' => $itemData['unit_price'],
                    'discount_rate1' => $itemData['discount_rate1'] ?? 0,
                    'discount_rate2' => $itemData['discount_rate2'] ?? 0,
                    'discount_rate3' => $itemData['discount_rate3'] ?? 0,
                    'tax_rate' => $itemData['tax_rate'] ?? 20,
                    'sort_order' => $index,
                ]);

                $item->calculateTotal();
                $offer->items()->save($item);
            }

            $offer->load('items');
            $offer->calculateTotals();
            $offer->save();

            DB::commit();

            \Log::info('Offer updated successfully', ['offer_id' => $id, 'entity_id_after_commit' => $offer->fresh()->entity_id]);

            return redirect()->route('sales.offers.show', $offer->id)
                ->with('success', 'Teklif başarıyla güncellendi.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Teklif güncellenirken hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified offer
     */
    public function destroy($id)
    {
        $offer = SalesOffer::findOrFail($id);

        if ($offer->status === 'converted_to_order') {
            return back()->with('error', 'Siparişe dönüştürülmüş teklifler silinemez.');
        }

        $offer->delete();

        return redirect()->route('sales.offers.index')
            ->with('success', 'Teklif başarıyla silindi.');
    }

    /**
     * Send offer to customer (legacy - redirects to new method)
     */
    public function send($id)
    {
        return $this->sendEmail(new Request([
            'format' => 'pdf',
            'message' => '',
        ]), $id);
    }

    /**
     * Send offer via email with format selection (PDF or Excel)
     */
    public function sendEmail(Request $request, $id)
    {
        $request->validate([
            'format' => 'required|in:pdf,excel',
            'email' => 'nullable|email',
            'message' => 'nullable|string|max:2000',
        ]);

        $offer = SalesOffer::with(['items.product.images', 'items.unit', 'entity', 'currency'])->findOrFail($id);

        // Get recipient email
        $email = $request->input('email') ?: $offer->getRecipientEmail();

        if (!$email) {
            return back()->with('error', 'Musteri email adresi bulunamadi.');
        }

        try {
            $format = $request->input('format', 'pdf');
            $customMessage = $request->input('message');

            // Generate approval token if not exists
            if (!$offer->approval_token) {
                $offer->generateApprovalToken(30); // Valid for 30 days
            }

            // Get approval URL
            $approvalUrl = $offer->getApprovalUrl();

            // Generate attachment based on format
            if ($format === 'excel') {
                $exportService = new SalesOfferExportService();
                $attachmentContent = $exportService->generateExcel($offer);
            } else {
                $pdf = PDF::loadView('pdf.sales-offer', ['offer' => $offer]);
                $attachmentContent = $pdf->output();
            }

            // Record email sent (before sending, to get tracking hash)
            $emailLog = $offer->recordEmailSent($email, $format, $customMessage, auth()->id());
            $trackingPixelUrl = $emailLog->getTrackingPixelUrl();

            // Send email using Mailable
            Mail::to($email)->send(new SalesOfferMail(
                $offer,
                $customMessage,
                $attachmentContent,
                $format,
                $approvalUrl,
                $trackingPixelUrl
            ));

            return back()->with('success', 'Teklif basariyla gonderildi: ' . $email);
        } catch (\Exception $e) {
            \Log::error('Offer email failed', [
                'offer_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $offer->recordEmailFailed($email, $format ?? 'pdf', $e->getMessage(), $customMessage ?? null);

            return back()->with('error', 'Teklif gonderilirken hata olustu: ' . $e->getMessage());
        }
    }

    /**
     * Get offer email information for modal
     */
    public function getEmailInfo($id)
    {
        $offer = SalesOffer::with(['entity'])->findOrFail($id);
        $recentLogs = $offer->emailLogs()->with('sender')->take(5)->get();

        return response()->json([
            'email' => $offer->getRecipientEmail(),
            'customer_name' => $offer->customer_display_name,
            'offer_no' => $offer->offer_no,
            'total_amount' => $offer->total_amount,
            'email_sent_count' => $offer->email_sent_count,
            'last_sent_at' => $offer->email_sent_at?->format('d.m.Y H:i'),
            'last_format' => $offer->email_attachment_type,
            'recent_logs' => $recentLogs->map(fn($log) => [
                'id' => $log->id,
                'sent_to' => $log->sent_to,
                'attachment_type' => $log->attachment_type,
                'status' => $log->status,
                'error_message' => $log->error_message,
                'sent_by_name' => $log->sender?->name ?? 'Sistem',
                'sent_at' => $log->created_at->format('d.m.Y H:i'),
                'opened_at' => $log->opened_at?->format('d.m.Y H:i'),
                'open_count' => $log->open_count,
            ]),
        ]);
    }

    /**
     * Get full email history for an offer
     */
    public function emailHistory($id)
    {
        $offer = SalesOffer::findOrFail($id);
        $logs = $offer->emailLogs()->with('sender')->get();

        return response()->json([
            'logs' => $logs->map(fn($log) => [
                'id' => $log->id,
                'sent_to' => $log->sent_to,
                'attachment_type' => $log->attachment_type,
                'custom_message' => $log->custom_message,
                'status' => $log->status,
                'error_message' => $log->error_message,
                'sent_by_name' => $log->sender?->name ?? 'Sistem',
                'sent_at' => $log->created_at->format('d.m.Y H:i'),
                'opened_at' => $log->opened_at?->format('d.m.Y H:i'),
                'open_count' => $log->open_count,
            ]),
            'total_count' => $logs->count(),
        ]);
    }

    /**
     * Send a reminder email for an offer
     */
    public function sendReminder(Request $request, $id)
    {
        $offer = SalesOffer::with(['items.product.images', 'items.unit', 'entity', 'currency'])->findOrFail($id);

        // Only send reminders for sent/draft offers that haven't been converted
        if (in_array($offer->status, ['converted_to_order', 'approved', 'accepted'])) {
            return back()->with('error', 'Bu teklif icin hatirlatma gonderilemez.');
        }

        $email = $request->input('email') ?: $offer->getRecipientEmail();
        if (!$email) {
            return back()->with('error', 'Musteri email adresi bulunamadi.');
        }

        try {
            // Regenerate approval token if expired
            if (!$offer->isApprovalTokenValid()) {
                $offer->generateApprovalToken(30);
            }

            $approvalUrl = $offer->getApprovalUrl();

            $reminderMessage = $request->input('message') ?: "Daha once gonderdigimiz {$offer->offer_no} numarali teklifimiz hakkinda bilgi almak istiyoruz. Teklifimiz {$offer->valid_until_date->format('d.m.Y')} tarihine kadar gecerlidir.";

            // Generate PDF attachment
            $pdf = PDF::loadView('pdf.sales-offer', ['offer' => $offer]);
            $attachmentContent = $pdf->output();

            // Record before sending (to get tracking hash)
            $emailLog = $offer->recordEmailSent($email, 'pdf', $reminderMessage, auth()->id());
            $trackingPixelUrl = $emailLog->getTrackingPixelUrl();

            Mail::to($email)->send(new SalesOfferMail(
                $offer,
                $reminderMessage,
                $attachmentContent,
                'pdf',
                $approvalUrl,
                $trackingPixelUrl
            ));

            return back()->with('success', 'Hatirlatma emaili gonderildi: ' . $email);
        } catch (\Exception $e) {
            \Log::error('Offer reminder email failed', [
                'offer_id' => $id,
                'error' => $e->getMessage(),
            ]);

            $offer->recordEmailFailed($email, 'pdf', $e->getMessage(), $reminderMessage ?? null);

            return back()->with('error', 'Hatirlatma gonderilirken hata olustu: ' . $e->getMessage());
        }
    }

    /**
     * Email tracking dashboard - bulk overview of all offer emails
     */
    public function trackingDashboard(Request $request)
    {
        // Stats
        $totalOffers = SalesOffer::count();
        $sentOffers = SalesOffer::where('email_sent_count', '>', 0)->count();
        $awaitingResponse = SalesOffer::where('email_sent_count', '>', 0)
            ->whereIn('status', ['sent', 'draft'])
            ->where('valid_until_date', '>=', now())
            ->count();
        $expiredOffers = SalesOffer::where('email_sent_count', '>', 0)
            ->whereNotIn('status', ['converted_to_order', 'approved', 'accepted'])
            ->where('valid_until_date', '<', now())
            ->count();
        $approvedOffers = SalesOffer::whereIn('status', ['approved', 'accepted'])->count();
        $convertedOffers = SalesOffer::where('status', 'converted_to_order')->count();

        // Open rate from logs
        $totalEmailsSent = \App\Models\OfferEmailLog::where('status', 'sent')->count();
        $totalOpened = \App\Models\OfferEmailLog::where('status', 'sent')->whereNotNull('opened_at')->count();

        // Filter
        $tab = $request->input('tab', 'awaiting');
        $query = SalesOffer::with(['entity', 'creator', 'currency'])
            ->where('email_sent_count', '>', 0);

        switch ($tab) {
            case 'awaiting':
                $query->whereIn('status', ['sent', 'draft'])
                    ->where('valid_until_date', '>=', now())
                    ->orderByDesc('email_sent_at');
                break;
            case 'expired':
                $query->whereNotIn('status', ['converted_to_order', 'approved', 'accepted'])
                    ->where('valid_until_date', '<', now())
                    ->orderByDesc('valid_until_date');
                break;
            case 'approved':
                $query->whereIn('status', ['approved', 'accepted'])
                    ->orderByDesc('customer_approved_at');
                break;
            case 'converted':
                $query->where('status', 'converted_to_order')
                    ->orderByDesc('converted_at');
                break;
            default:
                $query->orderByDesc('email_sent_at');
        }

        $offers = $query->paginate(20);

        return Inertia::render('Sales/Offers/TrackingDashboard', [
            'stats' => [
                'total_offers' => $totalOffers,
                'sent_offers' => $sentOffers,
                'awaiting_response' => $awaitingResponse,
                'expired_offers' => $expiredOffers,
                'approved_offers' => $approvedOffers,
                'converted_offers' => $convertedOffers,
                'total_emails_sent' => $totalEmailsSent,
                'total_opened' => $totalOpened,
                'open_rate' => $totalEmailsSent > 0 ? round(($totalOpened / $totalEmailsSent) * 100, 1) : 0,
            ],
            'offers' => $offers,
            'tab' => $tab,
        ]);
    }

    /**
     * Download offer as Excel
     */
    public function downloadExcel($id)
    {
        $offer = SalesOffer::with(['items.product', 'items.unit', 'entity', 'currency'])->findOrFail($id);

        $exportService = new SalesOfferExportService();
        return $exportService->download($offer);
    }

    /**
     * Show form to convert offer to order (with customer selection)
     */
    public function convertToOrder($id)
    {
        $offer = SalesOffer::with(['items', 'entity', 'currency'])->findOrFail($id);

        if (!$offer->canConvertToOrder()) {
            return back()->with('error', 'Bu teklif siparişe dönüştürülemez.');
        }

        return Inertia::render('Sales/Offers/ConvertToOrder', [
            'offer' => $offer,
        ]);
    }

    /**
     * Process the conversion of offer to order
     */
    public function storeConvertToOrder(Request $request, $id)
    {
        $offer = SalesOffer::with(['items.unit', 'entity', 'currency'])->findOrFail($id);

        if (!$offer->canConvertToOrder()) {
            return back()->with('error', 'Bu teklif siparişe dönüştürülemez.');
        }

        $validated = $request->validate([
            'customer_id' => 'required|exists:current_accounts,id',
        ]);

        try {
            DB::beginTransaction();

            $entityId = $validated['customer_id'];

            // Teklif carisi (ID: 7576) için taslak, diğerleri için onaylandı
            $orderStatus = ($entityId == 7576)
                ? SalesOrder::STATUS_DRAFT
                : SalesOrder::STATUS_CONFIRMED;

            // Create order
            $order = SalesOrder::create([
                'customer_id' => $entityId,
                'order_date' => now(),
                'status' => $orderStatus,
                'total_amount' => 0, // calculateTotals() tarafindan hesaplanacak
                'currency' => $offer->currency ? $offer->currency->cur_code : 'TRY',
                'created_by_id' => Auth::id(),
                'notes' => "Teklif No: {$offer->offer_no}"
                    . ($offer->discount_rate > 0 ? " (Genel İskonto: %{$offer->discount_rate})" : '')
                    . ($offer->notes ? " - {$offer->notes}" : ''),
            ]);

            // Genel iskonto oranı (teklif header'daki İskonto %)
            $generalDiscountRate = (float) ($offer->discount_rate ?? 0);

            // Copy items to order
            foreach ($offer->items as $index => $item) {
                // 3 kademeli iskonto hesabı
                $subtotal = $item->quantity * $item->unit_price;
                $d1 = (float) ($item->discount_rate1 ?? 0);
                $d2 = (float) ($item->discount_rate2 ?? 0);
                $d3 = (float) ($item->discount_rate3 ?? 0);
                $afterD1 = $subtotal * (1 - $d1 / 100);
                $afterD2 = $afterD1 * (1 - $d2 / 100);
                $afterD3 = $afterD2 * (1 - $d3 / 100);

                // Genel iskonto uygula (kademeli iskontolardan sonra)
                $afterGeneral = $generalDiscountRate > 0
                    ? $afterD3 * (1 - $generalDiscountRate / 100)
                    : $afterD3;
                $discountAmount = round($subtotal - $afterGeneral, 2);

                // KDV oranı ve tutarını hesapla (iskonto sonrası tutar üzerinden)
                $taxRate = (float) ($item->tax_rate ?? 20); // Varsayılan %20 KDV
                $taxAmount = round($afterGeneral * ($taxRate / 100), 2);
                $lineTotal = round($afterGeneral + $taxAmount, 2);

                $order->items()->create([
                    'product_id' => $item->product_id,
                    'product_code' => $item->product_code,
                    'product_name' => $item->product_name,
                    'product_description' => $item->description,
                    'notes' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_id' => $item->unit_id,
                    'unit_of_measure' => $item->unit ? $item->unit->name : null,
                    'unit_price' => $item->unit_price,
                    'discount_rate1' => $d1,
                    'discount_rate2' => $d2,
                    'discount_rate3' => $d3,
                    'discount_amount' => $discountAmount,
                    'tax_rate' => $taxRate,
                    'tax_amount' => $taxAmount,
                    'line_total' => $lineTotal,
                    'remaining_quantity' => $item->quantity,
                    'sort_order' => $index,
                    'status' => 'pending',
                ]);
            }

            // Update offer status
            $offer->update([
                'status' => 'converted_to_order',
                'converted_order_id' => $order->id,
                'converted_at' => now(),
                'converted_by' => Auth::id(),
            ]);

            // Recalculate totals so $order has correct values for Logo sync
            $order->calculateTotals();

            DB::commit();

            // Logo sync oncesi guncel degerleri yukle
            $order->refresh();

            // Sync to Logo ERP if enabled
            $logoSyncResult = null;
            if (config('services.logo.auto_sync_orders', false)) {
                $firmNo = config('services.logo.firm_no', 12);
                try {
                    \Log::info('Logo sync starting for converted offer to order', [
                        'firm_no' => $firmNo,
                        'order_id' => $order->id,
                        'offer_id' => $offer->id,
                        'order_subtotal' => $order->subtotal,
                        'order_tax' => $order->tax_amount,
                        'order_total' => $order->total_amount,
                    ]);
                    $logoSyncResult = $order->syncToLogo($firmNo);
                    if (!$logoSyncResult['success']) {
                        \Log::warning('Logo sync failed for converted order', [
                            'order_id' => $order->id,
                            'error' => $logoSyncResult['error'] ?? 'Unknown error'
                        ]);
                    }
                } catch (\Exception $e) {
                    \Log::error('Logo sync exception for converted order', [
                        'order_id' => $order->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Send email notification to customer
            try {
                $customer = CurrentAccount::find($entityId);
                $email = $customer->email;

                if ($email) {
                    Mail::send('emails.sales-order', [
                        'order' => $order->load('customer'),
                        'offerNo' => $offer->offer_no
                    ], function($message) use ($order, $email) {
                        $message->to($email)
                            ->subject("Sipariş Onayı - {$order->order_no}");
                    });
                }
            } catch (\Exception $e) {
                // Log email error but don't fail the order creation
                \Log::error('Order confirmation email failed: ' . $e->getMessage());
            }

            $successMessage = 'Teklif başarıyla siparişe dönüştürüldü.';
            if ($logoSyncResult && $logoSyncResult['success']) {
                $successMessage .= ' Logo ERP\'ye aktarıldı.';
            } elseif ($logoSyncResult && !$logoSyncResult['success']) {
                $successMessage .= ' Logo ERP aktarımı başarısız oldu.';
            }

            return redirect()->route('sales.orders.show', $order->id)
                ->with('success', $successMessage);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Sipariş oluşturulurken hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Approve offer
     */
    public function approve($id)
    {
        $offer = SalesOffer::findOrFail($id);

        if (!in_array($offer->status, ['draft', 'sent'])) {
            return back()->with('error', 'Bu teklif onaylanamaz.');
        }

        $offer->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Teklif onaylandı.');
    }

    /**
     * Reject offer
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $offer = SalesOffer::findOrFail($id);

        $offer->update([
            'status' => 'rejected',
            'rejected_reason' => $request->reason,
        ]);

        return back()->with('success', 'Teklif reddedildi.');
    }

    /**
     * Download PDF
     */
    public function downloadPdf($id)
    {
        $offer = SalesOffer::with(['items.product.images', 'items.unit', 'entity', 'currency'])->findOrFail($id);

        $pdf = PDF::loadView('pdf.sales-offer', ['offer' => $offer]);

        return $pdf->download("teklif-{$offer->offer_no}.pdf");
    }

    /**
     * Search products for offer creation
     */
    public function searchProducts(Request $request, ProductSearchService $searchService)
    {
        $search = $request->get('q', '');
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 20);

        if (strlen($search) < 2) {
            return response()->json(['data' => [], 'next_page_url' => null]);
        }

        $paginated = $searchService->search(
            query: $search,
            page: (int) $page,
            perPage: (int) $perPage,
            canBeSoldOnly: false,
            columns: ['*'],
            with: ['activeUnits.unit', 'baseUnit', 'images', 'category', 'brand', 'supplier']
        );

        $paginated->getCollection()->transform(function ($product) {
            $firstImage = $product->images->first();
            return [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'sale_price' => $product->sale_price,
                'sale_price_try' => $product->sale_price_try,
                'currency' => $product->currency ?? $product->logo_currency ?? 'TRY',
                'tax_rate' => $product->tax_rate,
                'stock_quantity' => $product->stock_quantity,
                'active_units' => $product->activeUnits,
                'baseUnit' => $product->baseUnit ? [
                    'id' => $product->baseUnit->id,
                    'name' => $product->baseUnit->name,
                    'symbol' => $product->baseUnit->symbol,
                ] : null,
                'image_url' => $firstImage ? asset('storage/' . $firstImage->image_path) : null,
                'category_id' => $product->category_id,
                'brand_id' => $product->brand_id,
                'supplier_id' => $product->supplier_id,
                'category' => $product->category ? [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                ] : null,
                'brand' => $product->brand ? [
                    'id' => $product->brand->id,
                    'name' => $product->brand->name,
                ] : null,
                'supplier' => $product->supplier ? [
                    'id' => $product->supplier->id,
                    'title' => $product->supplier->title,
                    'account_code' => $product->supplier->account_code,
                ] : null,
            ];
        });

        return response()->json($paginated);
    }

    /**
     * Search customers/entities for offer creation
     */
    public function searchCustomers(Request $request)
    {
        $search = $request->get('q', '');

        if (strlen($search) < 2) {
            return response()->json([]);
        }

        $customers = CurrentAccount::turkishSearch(['title', 'account_code', 'tax_number', 'phone_1'], $search)
            ->where('is_active', true)
            ->select('id', 'title', 'account_code', 'phone_1', 'email', 'address', 'tax_number', 'current_balance', 'currency')
            ->limit(20)
            ->get()
            ->map(function($customer) {
                return [
                    'id' => $customer->id,
                    'entity_name' => $customer->title,
                    'entity_code' => $customer->account_code,
                    'phone' => $customer->phone_1,
                    'email' => $customer->email,
                    'address' => $customer->address,
                    'tax_number' => $customer->tax_number,
                    'current_balance' => $customer->current_balance,
                    'currency' => $customer->currency,
                ];
            });

        return response()->json($customers);
    }

    /**
     * Convert product price to offer currency
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function convertPrice(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric',
            'from_currency' => 'required|string|size:3',
            'to_currency' => 'required|string|size:3',
        ]);

        $amount = $validated['amount'];
        $fromCurrency = strtoupper($validated['from_currency']);
        $toCurrency = strtoupper($validated['to_currency']);

        // Aynı para birimiyse dönüşüm gerekmiyor
        if ($fromCurrency === $toCurrency) {
            return response()->json([
                'success' => true,
                'original_amount' => $amount,
                'converted_amount' => $amount,
                'from_currency' => $fromCurrency,
                'to_currency' => $toCurrency,
                'exchange_rate' => 1,
            ]);
        }

        // Döviz kurlarını al
        $convertedAmount = ExchangeRate::convert($amount, $fromCurrency, $toCurrency);

        if ($convertedAmount === null) {
            // Kur bulunamadıysa bugünden önceki en yakın kurları dene
            $latestRates = ExchangeRate::getLatestRates('A');

            if ($fromCurrency === 'TRY') {
                $toRate = $latestRates[$toCurrency] ?? null;
                if ($toRate) {
                    $convertedAmount = $amount / $toRate->value;
                }
            } elseif ($toCurrency === 'TRY') {
                $fromRate = $latestRates[$fromCurrency] ?? null;
                if ($fromRate) {
                    $convertedAmount = $amount * $fromRate->value;
                }
            } else {
                // İki döviz arasında dönüşüm (TRY üzerinden)
                $fromRate = $latestRates[$fromCurrency] ?? null;
                $toRate = $latestRates[$toCurrency] ?? null;

                if ($fromRate && $toRate) {
                    $tryAmount = $amount * $fromRate->value;
                    $convertedAmount = $tryAmount / $toRate->value;
                }
            }
        }

        if ($convertedAmount === null) {
            return response()->json([
                'success' => false,
                'error' => "Döviz kuru bulunamadı: {$fromCurrency} → {$toCurrency}",
                'original_amount' => $amount,
                'from_currency' => $fromCurrency,
                'to_currency' => $toCurrency,
            ], 422);
        }

        // Kullanılan kuru hesapla
        $exchangeRate = $amount > 0 ? $convertedAmount / $amount : 0;

        return response()->json([
            'success' => true,
            'original_amount' => $amount,
            'converted_amount' => round($convertedAmount, 4),
            'from_currency' => $fromCurrency,
            'to_currency' => $toCurrency,
            'exchange_rate' => round($exchangeRate, 6),
        ]);
    }

    /**
     * Get current exchange rates
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getExchangeRates()
    {
        $rates = ExchangeRate::getLatestRates('A');

        $formattedRates = [];
        foreach ($rates as $currency => $rate) {
            $formattedRates[$currency] = [
                'code' => $currency,
                'name' => $rate->currency_name,
                'rate' => (float) $rate->value, // Ensure it's a number
                'date' => $rate->date->format('Y-m-d'),
            ];
        }

        // TRY için 1.0 ekle
        $formattedRates['TRY'] = [
            'code' => 'TRY',
            'name' => 'Türk Lirası',
            'rate' => 1.0,
            'date' => now()->format('Y-m-d'),
        ];

        return response()->json([
            'success' => true,
            'rates' => $formattedRates,
        ]);
    }
}
