<?php

namespace App\Http\Controllers\Portal;

use App\Models\SalesOrder;
use App\Models\SalesOffer;
use App\Models\SalesReturn;
use Inertia\Inertia;
use Carbon\Carbon;

class PortalDashboardController extends BasePortalController
{
    public function index()
    {
        $customerId = $this->getSelectedAccountId();

        // Son 30 günün istatistikleri
        $stats = [
            'orders_count' => SalesOrder::where('customer_id', $customerId)
                ->where('order_date', '>=', Carbon::now()->subDays(30))
                ->count(),

            'orders_total' => SalesOrder::where('customer_id', $customerId)
                ->where('order_date', '>=', Carbon::now()->subDays(30))
                ->sum('total_amount'),

            'pending_offers_count' => SalesOffer::where('entity_id', $customerId)
                ->whereIn('status', ['draft', 'sent'])
                ->count(),

            'active_returns_count' => SalesReturn::where('customer_id', $customerId)
                ->whereIn('status', ['pending_approval', 'approved', 'processing'])
                ->count(),
        ];

        // Son siparişler
        $recentOrders = SalesOrder::where('customer_id', $customerId)
            ->with(['items'])
            ->latest('order_date')
            ->take(5)
            ->get();

        // Son teklifler
        $recentOffers = SalesOffer::where('entity_id', $customerId)
            ->with(['items'])
            ->latest('offer_date')
            ->take(5)
            ->get();

        // Aktif iadeler
        $activeReturns = SalesReturn::where('customer_id', $customerId)
            ->whereIn('status', ['pending_approval', 'approved', 'processing'])
            ->with(['salesOrder', 'items'])
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Portal/Dashboard', [
            'stats' => $stats,
            'recentOrders' => $recentOrders,
            'recentOffers' => $recentOffers,
            'activeReturns' => $activeReturns,
        ]);
    }
}
