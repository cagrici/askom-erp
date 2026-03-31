<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\CurrentAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices.
     */
    public function index(Request $request): Response
    {
        $query = Invoice::query()
            ->with(['currentAccount', 'salesOrder', 'items'])
            ->orderBy('invoice_date', 'desc')
            ->orderBy('invoice_number', 'desc');

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('invoice_series', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_code', 'like', "%{$search}%")
                    ->orWhere('waybill_number', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Customer filter
        if ($request->filled('current_account_id')) {
            $query->where('current_account_id', $request->current_account_id);
        }

        // Invoice type filter
        if ($request->filled('invoice_type')) {
            $query->where('invoice_type', $request->invoice_type);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->where('invoice_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('invoice_date', '<=', $request->date_to);
        }

        // Currency filter
        if ($request->filled('currency_code')) {
            $query->where('currency_code', $request->currency_code);
        }

        // Sorting
        if ($request->filled('sort')) {
            $direction = $request->get('direction', 'asc');
            $query->orderBy($request->sort, $direction);
        }

        $invoices = $query->paginate($request->get('per_page', 15))
            ->withQueryString();

        // Get customers for filter dropdown
        $customers = CurrentAccount::select('id', 'account_code', 'title')
            ->where('is_active', true)
            ->orderBy('title')
            ->get();

        // Invoice types and statuses
        $invoiceTypes = [
            'sales' => 'Satış Faturası',
            'sales_return' => 'Satış İade Faturası',
            'purchase' => 'Alış Faturası',
            'purchase_return' => 'Alış İade Faturası',
            'proforma' => 'Proforma Fatura',
        ];

        $statuses = [
            'synced' => 'Senkronize',
            'approved' => 'Onaylandı',
            'sent' => 'Gönderildi',
            'paid' => 'Ödendi',
            'cancelled' => 'İptal',
            'pending' => 'Beklemede',
        ];

        $currencies = ['TRY', 'USD', 'EUR', 'GBP'];

        return Inertia::render('Sales/Invoices/Index', [
            'invoices' => $invoices,
            'filters' => $request->only([
                'search',
                'status',
                'current_account_id',
                'invoice_type',
                'date_from',
                'date_to',
                'currency_code',
                'sort',
                'direction',
            ]),
            'customers' => $customers,
            'invoiceTypes' => $invoiceTypes,
            'statuses' => $statuses,
            'currencies' => $currencies,
            'stats' => $this->getInvoiceStats(),
        ]);
    }

    /**
     * Display the specified invoice.
     */
    public function show(Invoice $invoice): Response
    {
        $invoice->load([
            'currentAccount',
            'salesOrder',
            'deliveryAddress',
            'items.product',
        ]);

        return Inertia::render('Sales/Invoices/Show', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Get invoice statistics for dashboard.
     */
    private function getInvoiceStats(): array
    {
        $thisMonth = now()->startOfMonth();

        return [
            'total_invoices' => Invoice::count(),
            'this_month_count' => Invoice::where('invoice_date', '>=', $thisMonth)->count(),
            'this_month_total' => Invoice::where('invoice_date', '>=', $thisMonth)
                ->sum('gross_total'),
            'pending_count' => Invoice::whereIn('status', ['draft', 'approved'])->count(),
            'paid_count' => Invoice::where('status', 'paid')->count(),
            'unpaid_total' => Invoice::whereIn('status', ['sent', 'approved'])
                ->sum('gross_total'),
        ];
    }

    /**
     * Export invoices to Excel.
     */
    public function export(Request $request)
    {
        // TODO: Implement Excel export functionality
        return response()->json(['message' => 'Export functionality coming soon']);
    }

    /**
     * Download invoice PDF.
     */
    public function downloadPdf(Invoice $invoice)
    {
        // TODO: Implement PDF generation
        return response()->json(['message' => 'PDF generation coming soon']);
    }

    /**
     * Mark invoice as paid.
     */
    public function markAsPaid(Request $request, Invoice $invoice)
    {
        $invoice->update([
            'status' => 'paid',
        ]);

        return redirect()->back()->with('success', 'Fatura ödendi olarak işaretlendi.');
    }

    /**
     * Cancel invoice.
     */
    public function cancel(Request $request, Invoice $invoice)
    {
        $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        $invoice->update([
            'status' => 'cancelled',
            'notes' => $request->notes,
        ]);

        return redirect()->back()->with('success', 'Fatura iptal edildi.');
    }
}
