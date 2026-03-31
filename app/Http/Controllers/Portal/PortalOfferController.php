<?php

namespace App\Http\Controllers\Portal;

use App\Models\SalesOffer;
use App\Models\SalesOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Mail;

class PortalOfferController extends BasePortalController
{
    public function index(Request $request)
    {
        $customerId = $this->getSelectedAccountId();

        $query = SalesOffer::where('entity_id', $customerId)
            ->with(['currency', 'createdBy'])
            ->orderBy('offer_date', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where('offer_no', 'like', "%{$request->search}%");
        }

        $offers = $query->paginate(15)->withQueryString();

        return Inertia::render('Portal/Offers/Index', [
            'offers' => $offers,
            'filters' => $request->only(['status', 'search']),
            'statuses' => SalesOffer::getStatuses(),
        ]);
    }

    public function show($id)
    {
        $customerId = $this->getSelectedAccountId();

        $offer = SalesOffer::with(['items.product', 'currency', 'createdBy'])
            ->findOrFail($id);

        if ($offer->entity_id != $customerId) {
            abort(403);
        }

        return Inertia::render('Portal/Offers/Show', [
            'offer' => $offer,
        ]);
    }

    public function downloadPdf($id)
    {
        $customerId = $this->getSelectedAccountId();

        $offer = SalesOffer::with(['items.product', 'currency'])->findOrFail($id);

        if ($offer->entity_id != $customerId) {
            abort(403);
        }

        $pdf = PDF::loadView('pdf.sales-offer', ['offer' => $offer]);
        return $pdf->download("teklif-{$offer->offer_no}.pdf");
    }

    public function accept(Request $request, $id)
    {
        $customerId = $this->getSelectedAccountId();

        $offer = SalesOffer::with(['items'])->findOrFail($id);

        if ($offer->entity_id != $customerId) {
            abort(403);
        }

        if ($offer->status !== 'sent') {
            return back()->with('error', 'Bu teklif kabul edilemez. Sadece gönderilmiş teklifler kabul edilebilir.');
        }

        DB::beginTransaction();

        try {
            // Update offer status
            $offer->update([
                'status' => 'accepted',
                'accepted_at' => now(),
            ]);

            // Create order from offer
            $order = SalesOrder::create([
                'order_number' => SalesOrder::generateOrderNumber(),
                'customer_id' => $offer->entity_id,
                'order_date' => now(),
                'status' => 'pending',
                'currency_id' => $offer->currency_id,
                'subtotal' => $offer->subtotal,
                'discount_amount' => $offer->discount_amount,
                'tax_amount' => $offer->tax_amount,
                'total_amount' => $offer->total_amount,
                'notes' => $offer->notes,
                'created_by_id' => Auth::id(),
                'location_id' => $offer->location_id,
            ]);

            // Copy offer items to order items
            foreach ($offer->items as $index => $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'product_code' => $item->product_code,
                    'product_name' => $item->product_name,
                    'product_description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_id' => $item->unit_id,
                    'unit_price' => $item->unit_price,
                    'discount_percent' => $item->discount_percent,
                    'discount_amount' => $item->discount_amount,
                    'tax_percent' => $item->tax_percent,
                    'tax_amount' => $item->tax_amount,
                    'line_total' => $item->line_total,
                    'sort_order' => $index + 1,
                ]);
            }

            // Send email to sales team
            $notificationEmail = setting('sales_offer.notification_email');
            if ($notificationEmail) {
                Mail::send('emails.offer-accepted', ['offer' => $offer, 'order' => $order], function ($message) use ($notificationEmail, $offer) {
                    $message->to($notificationEmail)
                        ->subject("Teklif Kabul Edildi - {$offer->offer_no}");
                });
            }

            DB::commit();

            return redirect()->route('portal.orders.show', $order->id)
                ->with('success', 'Teklif başarıyla kabul edildi ve siparişe dönüştürüldü.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Teklif kabul edilirken hata oluştu: ' . $e->getMessage());
        }
    }

    public function reject(Request $request, $id)
    {
        $customerId = $this->getSelectedAccountId();

        $offer = SalesOffer::findOrFail($id);

        if ($offer->entity_id != $customerId) {
            abort(403);
        }

        if ($offer->status !== 'sent') {
            return back()->with('error', 'Bu teklif reddedilemez. Sadece gönderilmiş teklifler reddedilebilir.');
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $offer->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        // Send email to sales team
        $notificationEmail = setting('sales_offer.notification_email');
        if ($notificationEmail) {
            Mail::send('emails.offer-rejected', ['offer' => $offer], function ($message) use ($notificationEmail, $offer) {
                $message->to($notificationEmail)
                    ->subject("Teklif Reddedildi - {$offer->offer_no}");
            });
        }

        return redirect()->route('portal.offers.index')
            ->with('success', 'Teklif reddedildi.');
    }
}
