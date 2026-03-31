<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\SalesOffer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class OfferApprovalController extends Controller
{
    /**
     * Show the public offer approval page
     */
    public function show(string $token)
    {
        $offer = SalesOffer::where('approval_token', $token)
            ->with(['items.product', 'items.unit', 'entity', 'currency'])
            ->first();

        if (!$offer) {
            return Inertia::render('Public/OfferApproval', [
                'error' => 'Teklif bulunamadi veya gecersiz link.',
                'offer' => null,
                'canApprove' => false,
            ]);
        }

        $canApprove = $offer->isApprovalTokenValid();
        $errorMessage = null;

        if (!$canApprove) {
            if ($offer->status === 'accepted' || $offer->status === 'approved') {
                $errorMessage = 'Bu teklif zaten onaylanmis.';
            } elseif ($offer->status === 'rejected') {
                $errorMessage = 'Bu teklif reddedilmis.';
            } elseif ($offer->status === 'converted_to_order') {
                $errorMessage = 'Bu teklif siparise donusturulmus.';
            } elseif ($offer->approval_token_expires_at && $offer->approval_token_expires_at < now()) {
                $errorMessage = 'Onay linkinin suresi dolmus. Lutfen satici ile iletisime gecin.';
            }
        }

        return Inertia::render('Public/OfferApproval', [
            'offer' => [
                'id' => $offer->id,
                'offer_no' => $offer->offer_no,
                'offer_date' => $offer->offer_date->format('Y-m-d'),
                'valid_until_date' => $offer->valid_until_date->format('Y-m-d'),
                'status' => $offer->status,
                'customer_display_name' => $offer->customer_display_name,
                'subtotal' => $offer->subtotal,
                'discount_rate' => $offer->discount_rate,
                'discount_amount' => $offer->discount_amount,
                'tax_rate' => $offer->tax_rate,
                'tax_amount' => $offer->tax_amount,
                'total_amount' => $offer->total_amount,
                'currency' => $offer->currency ? [
                    'cur_code' => $offer->currency->cur_code,
                    'cur_symbol' => $offer->currency->cur_symbol,
                ] : null,
                'customer_notes' => $offer->customer_notes,
                'terms_conditions' => $offer->terms_conditions,
                'items' => $offer->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_name' => $item->product_name ?? $item->product?->name,
                        'product_code' => $item->product_code,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'discount_rate' => $item->discount_rate,
                        'tax_rate' => $item->tax_rate,
                        'total_amount' => $item->total_amount,
                        'unit' => $item->unit ? ['name' => $item->unit->name] : null,
                    ];
                }),
            ],
            'canApprove' => $canApprove,
            'error' => $errorMessage,
            'token' => $token,
        ]);
    }

    /**
     * Process the customer approval
     */
    public function approve(Request $request, string $token)
    {
        $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $offer = SalesOffer::where('approval_token', $token)->first();

        if (!$offer) {
            return back()->with('error', 'Teklif bulunamadi.');
        }

        if (!$offer->isApprovalTokenValid()) {
            return back()->with('error', 'Bu teklif onaylanamaz. Lutfen satici ile iletisime gecin.');
        }

        $approved = $offer->approveByCustomer(
            $request->input('notes'),
            $request->ip()
        );

        if ($approved) {
            return redirect()->route('offers.public.approved', ['token' => $token])
                ->with('success', 'Teklif basariyla onaylandi!');
        }

        return back()->with('error', 'Teklif onaylanirken bir hata olustu.');
    }

    /**
     * Show approval success page
     */
    public function approved(string $token)
    {
        $offer = SalesOffer::where('approval_token', $token)
            ->with(['currency'])
            ->first();

        if (!$offer || !in_array($offer->status, ['accepted', 'approved'])) {
            return Inertia::render('Public/OfferApprovalSuccess', [
                'error' => 'Teklif bulunamadi.',
                'offer' => null,
            ]);
        }

        return Inertia::render('Public/OfferApprovalSuccess', [
            'offer' => [
                'offer_no' => $offer->offer_no,
                'total_amount' => $offer->total_amount,
                'customer_display_name' => $offer->customer_display_name,
                'currency' => $offer->currency ? [
                    'cur_symbol' => $offer->currency->cur_symbol ?? $offer->currency->cur_code,
                ] : null,
                'customer_approved_at' => $offer->customer_approved_at?->format('d.m.Y H:i'),
            ],
        ]);
    }

    /**
     * Download offer PDF from public page
     */
    public function downloadPdf(string $token)
    {
        $offer = SalesOffer::where('approval_token', $token)
            ->with(['items.product', 'items.unit', 'entity', 'currency'])
            ->first();

        if (!$offer) {
            abort(404, 'Teklif bulunamadi.');
        }

        $pdf = PDF::loadView('pdf.sales-offer', ['offer' => $offer]);

        return $pdf->download("teklif-{$offer->offer_no}.pdf");
    }
}
