<?php

namespace App\Http\Controllers\Portal;

use App\Models\SalesOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class PortalOrderController extends BasePortalController
{
    public function index(Request $request)
    {
        $customerId = $this->getSelectedAccountId();

        $query = SalesOrder::where('customer_id', $customerId)
            ->with(['items'])
            ->orderBy('order_date', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where('order_number', 'like', "%{$request->search}%");
        }

        $orders = $query->paginate(15)->withQueryString();

        return Inertia::render('Portal/Orders/Index', [
            'orders' => $orders,
            'filters' => $request->only(['status', 'search']),
            'statuses' => SalesOrder::getStatuses(),
        ]);
    }

    public function show($id)
    {
        $customerId = $this->getSelectedAccountId();

        $order = SalesOrder::with(['items.product', 'salesperson'])
            ->findOrFail($id);

        if ($order->customer_id != $customerId) {
            abort(403);
        }

        return Inertia::render('Portal/Orders/Show', [
            'order' => $order,
        ]);
    }

    public function downloadPdf($id)
    {
        $customerId = $this->getSelectedAccountId();

        $order = SalesOrder::with(['items', 'customer'])->findOrFail($id);

        if ($order->customer_id != $customerId) {
            abort(403);
        }

        $pdf = PDF::loadView('pdf.sales-order', ['order' => $order]);
        return $pdf->download("siparis-{$order->order_number}.pdf");
    }

    public function track($id)
    {
        $customerId = $this->getSelectedAccountId();

        $order = SalesOrder::with(['statusHistory'])->findOrFail($id);

        if ($order->customer_id != $customerId) {
            abort(403);
        }

        return response()->json([
            'order' => $order,
            'timeline' => $order->statusHistory,
        ]);
    }
}
