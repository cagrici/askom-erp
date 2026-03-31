<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CurrentAccount;
use App\Models\SalesOffer;
use App\Models\SalesOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $query = trim($request->input('q', ''));

        if (mb_strlen($query) < 2) {
            return response()->json([
                'customers' => [],
                'offers' => [],
                'orders' => [],
            ]);
        }

        $like = "%{$query}%";
        $normalized = str_replace(['ı', 'İ'], ['i', 'i'], mb_strtolower($query, 'UTF-8'));
        $normalizedLike = "%{$normalized}%";

        // Türkçe karakter duyarlı LIKE helper
        $trLike = fn ($col) => "LOWER(REPLACE(REPLACE({$col}, 'ı', 'i'), 'İ', 'i')) LIKE ?";

        // Cari Hesaplar
        $customers = CurrentAccount::turkishSearch(['title', 'account_code', 'tax_number', 'phone_1'], $query)
            ->where('is_active', true)
            ->select('id', 'title', 'account_code', 'phone_1', 'city')
            ->limit(5)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'subtitle' => $c->account_code,
                'extra' => $c->city,
                'url' => "/accounting/current-accounts/{$c->id}",
            ]);

        // Satış Teklifleri
        $offers = SalesOffer::where(function ($q) use ($like, $trLike, $normalizedLike) {
                $q->where('offer_no', 'like', $like)
                  ->orWhereRaw($trLike('customer_name'), [$normalizedLike])
                  ->orWhereHas('entity', fn ($eq) => $eq->whereRaw($trLike('title'), [$normalizedLike]));
            })
            ->with('entity:id,title')
            ->select('id', 'offer_no', 'customer_name', 'entity_id', 'status', 'total_amount')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'title' => $o->offer_no,
                'subtitle' => $o->entity?->title ?? $o->customer_name,
                'status' => $o->status,
                'url' => "/sales/offers/{$o->id}",
            ]);

        // Satış Siparişleri
        $orders = SalesOrder::where(function ($q) use ($like, $trLike, $normalizedLike) {
                $q->where('order_number', 'like', $like)
                  ->orWhere('reference_number', 'like', $like)
                  ->orWhereHas('customer', fn ($cq) => $cq->whereRaw($trLike('title'), [$normalizedLike]));
            })
            ->with('customer:id,title')
            ->select('id', 'order_number', 'customer_id', 'status', 'total_amount')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'title' => $o->order_number,
                'subtitle' => $o->customer?->title,
                'status' => $o->status,
                'url' => "/sales/orders/{$o->id}",
            ]);

        return response()->json([
            'customers' => $customers,
            'offers' => $offers,
            'orders' => $orders,
        ]);
    }
}
