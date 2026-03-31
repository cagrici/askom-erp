<?php

namespace App\Http\Controllers\Portal;

use App\Models\SalesOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class PortalInvoiceController extends BasePortalController
{
    /**
     * Display a listing of invoices (orders with invoice status)
     */
    public function index(Request $request)
    {
        $customerId = $this->getSelectedAccountId();

        $query = SalesOrder::where('customer_id', $customerId)
            ->whereIn('status', ['invoiced', 'paid', 'completed'])
            ->with(['items'])
            ->orderBy('order_date', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where('order_number', 'like', "%{$request->search}%");
        }

        if ($request->filled('date_from')) {
            $query->where('order_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('order_date', '<=', $request->date_to);
        }

        $invoices = $query->paginate(15)->withQueryString();

        return Inertia::render('Portal/Invoices/Index', [
            'invoices' => $invoices,
            'filters' => $request->only(['status', 'search', 'date_from', 'date_to']),
            'statuses' => [
                'invoiced' => 'Faturalandı',
                'paid' => 'Ödendi',
                'completed' => 'Tamamlandı',
            ],
        ]);
    }

    /**
     * Display the specified invoice
     */
    public function show($id)
    {
        $customerId = $this->getSelectedAccountId();

        $invoice = SalesOrder::with(['items.product', 'customer', 'salesperson'])
            ->findOrFail($id);

        if ($invoice->customer_id != $customerId) {
            abort(403);
        }

        return Inertia::render('Portal/Invoices/Show', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Download invoice PDF
     */
    public function downloadPdf($id)
    {
        $customerId = $this->getSelectedAccountId();

        $invoice = SalesOrder::with(['items.product', 'customer'])->findOrFail($id);

        if ($invoice->customer_id != $customerId) {
            abort(403);
        }

        $pdf = PDF::loadView('pdf.sales-order', ['order' => $invoice]);
        return $pdf->download("fatura-{$invoice->order_number}.pdf");
    }
}
