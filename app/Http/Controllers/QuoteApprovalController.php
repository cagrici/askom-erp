<?php

namespace App\Http\Controllers;

use App\Models\Quote;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Offer;
use App\Models\Entity;
use App\Models\ExchangeRate;
use App\Models\Currency;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;


class QuoteApprovalController extends Controller
{
    public function index()
    {
        return Inertia::render('QuoteApproval/Index');
    }

    public function pendingQuotes()
    {
        // We don't need to pass any data since the component fetches from API
        return Inertia::render('QuoteApproval/PendingQuotes');
    }

    public function show(Quote $quote)
    {
        $quote->load(['items', 'documents', 'creator']);

        return Inertia::render('QuoteApproval/Show', [
            'quote' => [
                'id' => $quote->id,
                'company_name' => $quote->company_name,
                'amount' => $quote->amount,
                'currency' => $quote->currency,
                'formatted_amount' => $quote->formatted_amount,
                'status' => $quote->status,
                'quote_date' => $quote->quote_date->format('Y-m-d'),
                'created_by' => $quote->creator->name,
                'items' => $quote->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'block_no' => $item->block_no,
                        'unit_price' => $item->unit_price,
                        'quantity' => $item->quantity,
                        'unit' => $item->unit,
                        'total' => $item->total,
                        'image_path' => $item->image_path,
                    ];
                }),
                'documents' => $quote->documents->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'file_name' => $doc->file_name,
                        'file_path' => $doc->file_path,
                        'file_type' => $doc->file_type,
                        'file_size' => $doc->file_size,
                    ];
                }),
            ],
        ]);
    }

    public function approve(Quote $quote)
    {
        DB::transaction(function () use ($quote) {
            $quote->update(['status' => 'approved']);

            if ($quote->approvalRequests()->exists()) {
                $quote->approvalRequests()->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                ]);
            }
        });

        return redirect()->route('quote-approvals.pending')
            ->with('success', 'Quote approved successfully.');
    }

    public function reject(Request $request, Quote $quote)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        DB::transaction(function () use ($quote, $request) {
            $quote->update(['status' => 'rejected']);

            if ($quote->approvalRequests()->exists()) {
                $quote->approvalRequests()->update([
                    'status' => 'rejected',
                    'rejected_at' => now(),
                    'rejection_reason' => $request->reason,
                ]);
            }
        });

        return redirect()->route('quote-approvals.pending')
            ->with('success', 'Quote rejected.');
    }

    public function pendingApi(Request $request)
    {
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 20);
        $type = $request->get('type', 'all'); // all, invoices, offers
        $search = $request->get('search', ''); // search term

        // Advanced search parameters
        $docNo = $request->get('doc_no', '');
        $entityName = $request->get('entity_name', '');
        $amountMin = $request->get('amount_min', '');
        $amountMax = $request->get('amount_max', '');
        $dateFrom = $request->get('date_from', '');
        $dateTo = $request->get('date_to', '');

        $results = collect();

        // Invoices with request_status = 1 (pending)
        if ($type === 'all' || $type === 'invoices') {
            $invoicesQuery = Invoice::with('entity')
                ->where('request_status', 1);

            // Add search functionality for invoices
            if (!empty($search)) {
                $invoicesQuery->where(function ($query) use ($search) {
                    $query->where('doc_no', 'like', '%' . $search . '%')
                        ->orWhereHas('entity', function ($q) use ($search) {
                            $q->where('entity_name', 'like', '%' . $search . '%');
                        });
                });
            }

            // Advanced search filters
            if (!empty($docNo)) {
                $invoicesQuery->where('doc_no', 'like', '%' . $docNo . '%');
            }
            if (!empty($entityName)) {
                $invoicesQuery->whereHas('entity', function ($q) use ($entityName) {
                    $q->where('entity_name', 'like', '%' . $entityName . '%');
                });
            }
            if (!empty($amountMin)) {
                $invoicesQuery->where('amt', '>=', $amountMin);
            }
            if (!empty($amountMax)) {
                $invoicesQuery->where('amt', '<=', $amountMax);
            }
            if (!empty($dateFrom)) {
                $invoicesQuery->whereDate('doc_date', '>=', $dateFrom);
            }
            if (!empty($dateTo)) {
                $invoicesQuery->whereDate('doc_date', '<=', $dateTo);
            }

            $invoices = $invoicesQuery->orderBy('doc_date', 'desc')
                ->get()
                ->map(function ($invoice) {
                    return [
                        'id' => $invoice->id,
                        'type' => 'invoice',
                        'doc_no' => $invoice->doc_no,
                        'entity_name' => $invoice->entity?->entity_name ?? 'N/A',
                        'entity_id' => $invoice->entity_id,
                        'amount' => number_format($invoice->amt, 2) . ' TL',
                        'date' => $invoice->doc_date?->format('d.m.Y') ?? 'N/A',
                        'sort_date' => $invoice->doc_date ?? now(),
                    ];
                });

            $results = $results->merge($invoices);
        }

        // Offers with offer_status = 1 (pending)
        if ($type === 'all' || $type === 'offers') {
            $offersQuery = Offer::with('entity')
                ->where('offer_status', 1);

            // Add search functionality for offers
            if (!empty($search)) {
                $offersQuery->where(function ($query) use ($search) {
                    $query->where('doc_no', 'like', '%' . $search . '%')
                        ->orWhereHas('entity', function ($q) use ($search) {
                            $q->where('entity_name', 'like', '%' . $search . '%');
                        });
                });
            }

            // Advanced search filters for offers
            if (!empty($docNo)) {
                $offersQuery->where('doc_no', 'like', '%' . $docNo . '%');
            }
            if (!empty($entityName)) {
                $offersQuery->whereHas('entity', function ($q) use ($entityName) {
                    $q->where('entity_name', 'like', '%' . $entityName . '%');
                });
            }
            if (!empty($amountMin)) {
                $offersQuery->where('amt', '>=', $amountMin);
            }
            if (!empty($amountMax)) {
                $offersQuery->where('amt', '<=', $amountMax);
            }
            if (!empty($dateFrom)) {
                $offersQuery->whereDate('doc_date', '>=', $dateFrom);
            }
            if (!empty($dateTo)) {
                $offersQuery->whereDate('doc_date', '<=', $dateTo);
            }

            $offers = $offersQuery->orderBy('doc_date', 'desc')
                ->get()
                ->map(function ($offer) {
                    return [
                        'id' => $offer->id,
                        'type' => 'offer',
                        'doc_no' => $offer->doc_no,
                        'entity_name' => $offer->entity?->entity_name ?? 'N/A',
                        'entity_id' => $offer->entity_id,
                        'amount' => number_format($offer->amt, 2) . ' TL',
                        'date' => $offer->doc_date?->format('d.m.Y') ?? 'N/A',
                        'sort_date' => $offer->doc_date ?? now(),
                    ];
                });

            $results = $results->merge($offers);
        }

        // Sort by sort_date desc
        $results = $results->sortByDesc('sort_date');

        // Paginate results
        $total = $results->count();
        $offset = ($page - 1) * $perPage;
        $items = $results->skip($offset)->take($perPage)->values();

        return response()->json([
            'data' => $items,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => ceil($total / $perPage),
            'has_more' => $page < ceil($total / $perPage),
        ]);
    }

    public function history(Request $request)
    {
        // We don't need to pass any data since the component fetches from API
        return Inertia::render('QuoteApproval/History');
    }

    public function historyApi(Request $request)
    {
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 20);
        $type = $request->get('type', 'all'); // all, invoices, offers

        $results = collect();

        // Invoices with request_status != 1 (approved/rejected)
        if ($type === 'all' || $type === 'invoices') {
            $invoices = Invoice::with('entity')
                ->where('request_status', '!=', 1)
                ->whereNotNull('request_status')
                ->orderBy('doc_date', 'desc')
                ->get()
                ->map(function ($invoice) {
                    return [
                        'id' => $invoice->id,
                        'type' => 'invoice',
                        'doc_no' => $invoice->doc_no,
                        'entity_name' => $invoice->entity?->entity_name ?? 'N/A',
                        'amount' => number_format($invoice->amt, 2) . ' TL',
                        'date' => $invoice->doc_date?->format('d.m.Y') ?? 'N/A',
                        'sort_date' => $invoice->doc_date ?? now(),
                        'status' => $invoice->request_status,
                    ];
                });

            $results = $results->merge($invoices);
        }

        // Offers with offer_status != 1 (approved/rejected)
        if ($type === 'all' || $type === 'offers') {
            $offers = Offer::with('entity')
                ->where('offer_status', '!=', 1)
                ->whereNotNull('offer_status')
                ->orderBy('doc_date', 'desc')
                ->get()
                ->map(function ($offer) {
                    return [
                        'id' => $offer->id,
                        'type' => 'offer',
                        'doc_no' => $offer->doc_no,
                        'entity_name' => $offer->entity?->entity_name ?? 'N/A',
                        'amount' => number_format($offer->amt, 2) . ' TL',
                        'date' => $offer->doc_date?->format('d.m.Y') ?? 'N/A',
                        'sort_date' => $offer->doc_date ?? now(),
                        'status' => $offer->offer_status,
                    ];
                });

            $results = $results->merge($offers);
        }

        // Sort by sort_date desc
        $results = $results->sortByDesc('sort_date');

        // Paginate results
        $total = $results->count();
        $offset = ($page - 1) * $perPage;
        $items = $results->skip($offset)->take($perPage)->values();

        return response()->json([
            'data' => $items,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => ceil($total / $perPage),
            'has_more' => $page < ceil($total / $perPage),
        ]);
    }

    public function historyDetail(Quote $quote)
    {
        $quote->load(['items', 'documents', 'creator']);

        return Inertia::render('QuoteApproval/HistoryDetail', [
            'quote' => [
                'id' => $quote->id,
                'company_name' => $quote->company_name,
                'amount' => $quote->amount,
                'currency' => $quote->currency,
                'formatted_amount' => $quote->formatted_amount,
                'status' => $quote->status,
                'quote_date' => $quote->quote_date->format('d.m.Y'),
                'created_by' => $quote->creator->name,
                'items' => $quote->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'block_no' => $item->block_no,
                        'unit_price' => $item->unit_price,
                        'quantity' => $item->quantity,
                        'unit' => $item->unit,
                        'total' => $item->total,
                        'image_path' => $item->image_path,
                    ];
                }),
            ],
        ]);
    }

    public function getInvoiceDetail($id)
    {
        try {
            $invoice = Invoice::with(['entity', 'items.product', 'items.unit', 'items.currency'])->findOrFail($id);

            return response()->json([
                'id' => $invoice->id,
                'doc_no' => $invoice->doc_no,
                'entity_name' => $invoice->entity?->entity_name ?? 'N/A',
                'entity_id' => $invoice->entity_id,
                'amount' => number_format($invoice->amt, 2) . ' TL',
                'date' => $invoice->doc_date?->format('d.m.Y') ?? 'N/A',
                'items' => $invoice->items?->map(function ($item) {
                    $isForeignCurrency = ($item->cur_rate_tra ?? 1) > 1 && ($item->cur_tra_id ?? 114) != 114;
                    $priceInfo = [
                        'price_tl' => round($item->unit_price ?? 0, 2),
                        'amount_tl' => round($item->amt ?? 0, 2),
                    ];

                    if ($isForeignCurrency) {
                        $priceInfo['price_foreign'] = round($item->unit_price_tra ?? 0, 2);
                        $priceInfo['amount_foreign'] = round($item->amt_tra ?? 0, 2);
                        $priceInfo['currency_rate'] = round($item->cur_rate_tra ?? 1, 4);
                        $priceInfo['currency_name'] = $item->currency?->description ?? 'Yabancı Para';
                        $priceInfo['currency_code'] = $item->currency?->cur_code ?? 'Yabancı Para';
                        $priceInfo['is_foreign_currency'] = true;
                    } else {
                        $priceInfo['is_foreign_currency'] = false;
                    }

                    return [
                        'quantity' => round($item->qty ?? 0, 2),
                        'unit' => $item->unit?->unit_name ?? $item->unit?->unit_code ?? 'adet',
                        'price' => round($item->unit_price ?? 0, 2),
                        'dimensions' => 'Belirtilmemiş', // Bu alan invoices_d tablosunda yok
                        'product_name' => $item->product?->item_name ?? $item->item_name2 ?? 'Ürün',
                        'item_code' => $item->product?->item_code ?? '-',
                        'price_info' => $priceInfo,
                    ];
                }) ?? [],
                'images' => [], // Invoice'larda resim yok
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invoice not found'], 404);
        }
    }

    public function getOfferDetail($id)
    {
        try {
            $offer = Offer::with(['entity', 'offerItems.product', 'offerItems.unit', 'offerItems.currency'])->findOrFail($id);

            return response()->json([
                'id' => $offer->id,
                'doc_no' => $offer->doc_no,
                'entity_name' => $offer->entity?->entity_name ?? 'N/A',
                'entity_id' => $offer->entity_id,
                'amount' => number_format($offer->amt, 2) . ' TL',
                'date' => $offer->doc_date?->format('d.m.Y') ?? 'N/A',
                'items' => $offer->offerItems?->map(function ($item) {
                    $isForeignCurrency = ($item->cur_rate_tra ?? 1) > 1 && ($item->cur_tra_id ?? 114) != 114;
                    $priceInfo = [
                        'price_tl' => round($item->unit_price ?? 0, 2),
                        'amount_tl' => round($item->amt ?? 0, 2),
                    ];

                    if ($isForeignCurrency) {
                        $priceInfo['price_foreign'] = round($item->unit_price_tra ?? 0, 2);
                        $priceInfo['amount_foreign'] = round($item->amt_tra ?? 0, 2);
                        $priceInfo['currency_rate'] = round($item->cur_rate_tra ?? 1, 4);
                        $priceInfo['currency_name'] = $item->currency?->description ?? 'Yabancı Para';
                        $priceInfo['currency_code'] = $item->currency?->cur_code ?? 'Yabancı Para';
                        $priceInfo['is_foreign_currency'] = true;
                    } else {
                        $priceInfo['is_foreign_currency'] = false;
                    }

                    return [
                        'quantity' => round($item->qty ?? 0, 2),
                        'unit' => $item->unit?->unit_name ?? $item->unit?->unit_code ?? 'adet',
                        'price' => round($item->unit_price ?? 0, 2),
                        'dimensions' => 'Belirtilmemiş', // Bu alan offers_d tablosunda yok
                        'product_name' => $item->product?->item_name ?? $item->item_name_manual ?? 'Ürün',
                        'item_code' => $item->product?->item_code ?? '-',
                        'price_info' => $priceInfo,
                    ];
                }) ?? [],
                'images' => [], // Offer'larda resim yok
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Offer not found'], 404);
        }
    }

    public function getEntityInvoices($id)
    {
        try {
            // Get entity_id from invoice or offer
            $invoice = Invoice::find($id);
            $offer = Offer::find($id);

            $entityId = null;
            if ($invoice) {
                $entityId = $invoice->entity_id;
            } elseif ($offer) {
                $entityId = $offer->entity_id;
            }

            if (!$entityId) {
                return response()->json([]);
            }

            $invoices = Invoice::where('entity_id', $entityId)
                ->orderBy('doc_date', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($invoice) {
                    return [
                        'id' => $invoice->id,
                        'invoice_no' => $invoice->invoice_no ?? $invoice->doc_no ?? 'N/A',
                        'amount' => number_format($invoice->amount ?? $invoice->amt ?? 0, 2) . ' TL',
                        'date' => $invoice->invoice_date?->format('d.m.Y') ?? $invoice->doc_date?->format('d.m.Y') ?? 'N/A',
                        'status' => $invoice->request_status ?? $invoice->status ?? 'pending',
                    ];
                });

            return response()->json($invoices);
        } catch (\Exception $e) {
            \Log::error('Error fetching entity invoices: ' . $e->getMessage());
            return response()->json([]);
        }
    }

    public function approveInvoice($id)
    {
        try {
            $invoice = Invoice::with(['entity', 'companyEntity.salesPerson.user'])->findOrFail($id);

            // Update invoice status to 2 (approved)
            $invoice->update(['request_status' => 2]);

            // Send email notification if sales person exists
            if ($invoice->companyEntity && $invoice->companyEntity->salesPerson && $invoice->companyEntity->salesPerson->user && $invoice->companyEntity->salesPerson->user->email) {
                try {
                    Mail::send('emails.invoice-approved', [
                        'invoice' => $invoice,
                        'entity_name' => $invoice->entity?->entity_name ?? 'N/A',
                        'doc_no' => $invoice->doc_no,
                        'amount' => number_format($invoice->amt, 2) . ' TL'
                    ], function ($message) use ($invoice) {
                        $message->to($invoice->companyEntity->salesPerson->user->email)
                                ->subject('Fatura Onaylandı - ' . $invoice->doc_no);
                    });
                } catch (\Exception $e) {
                    \Log::error('Email send error: ' . $e->getMessage());
                }
            }

            return response()->json(['success' => true, 'message' => 'Fatura onaylandı']);
        } catch (\Exception $e) {
            \Log::error('Invoice approval error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Fatura onaylanamadı'], 500);
        }
    }

    public function rejectInvoice(Request $request, $id)
    {
        try {
            $invoice = Invoice::with(['entity', 'companyEntity.salesPerson.user'])->findOrFail($id);

            $rejectionNote = $request->input('note', '');

            // Update invoice status to 3 (rejected)
            $invoice->update(['request_status' => 3]);

            // Send email notification if sales person exists
            if ($invoice->companyEntity && $invoice->companyEntity->salesPerson && $invoice->companyEntity->salesPerson->user && $invoice->companyEntity->salesPerson->user->email) {
                try {
                    Mail::send('emails.invoice-rejected', [
                        'invoice' => $invoice,
                        'entity_name' => $invoice->entity?->entity_name ?? 'N/A',
                        'doc_no' => $invoice->doc_no,
                        'amount' => number_format($invoice->amt, 2) . ' TL',
                        'rejection_note' => $rejectionNote
                    ], function ($message) use ($invoice) {
                        $message->to($invoice->companyEntity->salesPerson->user->email)
                                ->subject('Fatura Geri Gönderildi - ' . $invoice->doc_no);
                    });
                } catch (\Exception $e) {
                    \Log::error('Email send error: ' . $e->getMessage());
                }
            }

            return response()->json(['success' => true, 'message' => 'Fatura geri gönderildi']);
        } catch (\Exception $e) {
            \Log::error('Invoice rejection error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Fatura geri gönderilemedi'], 500);
        }
    }

    public function approveOffer($id)
    {
        try {
            $offer = Offer::with(['entity', 'salesPerson.user'])->findOrFail($id);

            // Update offer status to 2 (approved)
            $offer->update(['offer_status' => 2]);

            // Send email notification if sales person exists
            if ($offer->salesPerson && $offer->salesPerson->user && $offer->salesPerson->user->email) {
                try {
                    Mail::send('emails.offer-approved', [
                        'offer' => $offer,
                        'entity_name' => $offer->entity?->entity_name ?? 'N/A',
                        'doc_no' => $offer->doc_no,
                        'amount' => number_format($offer->amt, 2) . ' TL'
                    ], function ($message) use ($offer) {
                        $message->to($offer->companyEntity->salesPerson->user->email)
                                ->subject('Teklif Onaylandı - ' . $offer->doc_no);
                    });
                } catch (\Exception $e) {
                    \Log::error('Email send error: ' . $e->getMessage());
                }
            }

            return response()->json(['success' => true, 'message' => 'Teklif onaylandı']);
        } catch (\Exception $e) {
            \Log::error('Offer approval error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Teklif onaylanamadı'], 500);
        }
    }

    public function rejectOffer(Request $request, $id)
    {
        try {
            $offer = Offer::with(['entity', 'companyEntity.salesPerson.user'])->findOrFail($id);

            $rejectionNote = $request->input('note', '');

            // Update offer status to 3 (rejected)
            $offer->update(['offer_status' => 3]);

            // Send email notification if sales person exists
            if ($offer->companyEntity && $offer->companyEntity->salesPerson && $offer->companyEntity->salesPerson->user && $offer->companyEntity->salesPerson->user->email) {
                try {
                    Mail::send('emails.offer-rejected', [
                        'offer' => $offer,
                        'entity_name' => $offer->entity?->entity_name ?? 'N/A',
                        'doc_no' => $offer->doc_no,
                        'amount' => number_format($offer->amt, 2) . ' TL',
                        'rejection_note' => $rejectionNote
                    ], function ($message) use ($offer) {
                        $message->to($offer->companyEntity->salesPerson->user->email)
                                ->subject('Teklif Geri Gönderildi - ' . $offer->doc_no);
                    });
                } catch (\Exception $e) {
                    \Log::error('Email send error: ' . $e->getMessage());
                }
            }

            return response()->json(['success' => true, 'message' => 'Teklif geri gönderildi']);
        } catch (\Exception $e) {
            \Log::error('Offer rejection error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Teklif geri gönderilemedi'], 500);
        }
    }

    public function customerAnalysis()
    {
        return Inertia::render('QuoteApproval/CustomerAnalysis');
    }

    public function searchCustomers(Request $request)
    {
        $search = $request->get('search', '');

        if (strlen($search) < 2) {
            return response()->json([]);
        }

        $normalized = str_replace(['ı', 'İ'], ['i', 'i'], mb_strtolower($search, 'UTF-8'));
        $entities = Entity::where(function($query) use ($normalized) {
            $query->whereRaw("LOWER(REPLACE(REPLACE(entity_code, 'ı', 'i'), 'İ', 'i')) LIKE ?", ["%{$normalized}%"])
                  ->orWhereRaw("LOWER(REPLACE(REPLACE(entity_name, 'ı', 'i'), 'İ', 'i')) LIKE ?", ["%{$normalized}%"]);
        })
        ->select('id', 'entity_code', 'entity_name')
        ->limit(20)
        ->get();

        return response()->json($entities);
    }

    public function getCustomerAnalytics($entityId)
    {
        $entity = Entity::findOrFail($entityId);
        $targetCurrency = request()->get('currency', 'USD'); // Default to USD

        // Get 5-year analytics
        $fiveYearsAgo = now()->subYears(5);

        // Total purchases in last 5 years with currency conversion
        $invoices = Invoice::where('entity_id', $entityId)
            ->where('doc_date', '>=', $fiveYearsAgo)
            ->where('request_status', 4) // approved
            ->get();
            
        $totalInvoices = 0;
        foreach ($invoices as $invoice) {
            $convertedAmount = $this->convertCurrency(
                $invoice->amt,
                $invoice->cur_tra_id ?? 114, // Default to TRY if null
                $targetCurrency,
                $invoice->doc_date
            );
            $totalInvoices += $convertedAmount;
        }

        $invoiceCount = $invoices->count();

        // Recent orders/invoices with currency conversion
        $recentInvoices = Invoice::with(['items'])
            ->where('entity_id', $entityId)
            ->orderBy('doc_date', 'desc')
            ->take(10)
            ->get()
            ->map(function ($invoice) use ($targetCurrency) {
                $convertedAmount = $this->convertCurrency(
                    $invoice->amt,
                    $invoice->cur_tra_id ?? 114,
                    $targetCurrency,
                    $invoice->doc_date
                );
                return [
                    'id' => $invoice->id,
                    'doc_no' => $invoice->doc_no,
                    'doc_date' => $invoice->doc_date?->format('d.m.Y'),
                    'amount' => $this->formatCurrencyAmount($convertedAmount, $targetCurrency),
                    'status' => $invoice->request_status,
                    'items_count' => $invoice->items ? $invoice->items->count() : 0
                ];
            });

        // Recent offers with currency conversion
        $recentOffers = Offer::where('entity_id', $entityId)
            ->orderBy('doc_date', 'desc')
            ->take(10)
            ->get()
            ->map(function ($offer) use ($targetCurrency) {
                $convertedAmount = $this->convertCurrency(
                    $offer->amt,
                    $offer->cur_tra_id ?? 114,
                    $targetCurrency,
                    $offer->doc_date
                );
                return [
                    'id' => $offer->id,
                    'doc_no' => $offer->doc_no,
                    'doc_date' => $offer->doc_date?->format('d.m.Y'),
                    'amount' => $this->formatCurrencyAmount($convertedAmount, $targetCurrency),
                    'status' => $offer->offer_status
                ];
            });

        // Get available years for this entity
        $availableYears = Invoice::where('entity_id', $entityId)
            ->where('request_status', 4)
            ->whereNotNull('doc_date')
            ->selectRaw('DISTINCT YEAR(doc_date) as year')
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->toArray();

        // Monthly purchase analytics for current year (or latest year if current year has no data)
        $currentYear = request()->get('year', now()->year);
        if (!in_array($currentYear, $availableYears) && !empty($availableYears)) {
            $currentYear = $availableYears[0]; // Use the latest available year
        }

        $monthlyData = [];
        for ($month = 1; $month <= 12; $month++) {
            $monthlyInvoices = Invoice::where('entity_id', $entityId)
                ->whereYear('doc_date', $currentYear)
                ->whereMonth('doc_date', $month)
                ->where('request_status', 4)
                ->get();
            
            $monthlyAmount = 0;
            foreach ($monthlyInvoices as $invoice) {
                $convertedAmount = $this->convertCurrency(
                    $invoice->amt,
                    $invoice->cur_tra_id ?? 114,
                    $targetCurrency,
                    $invoice->doc_date
                );
                $monthlyAmount += $convertedAmount;
            }

            $monthName = \Carbon\Carbon::create($currentYear, $month, 1)->format('M Y');
            $monthlyData[] = [
                'month' => $monthName,
                'amount' => $monthlyAmount
            ];
        }

        // Top products/categories (if available) with currency conversion
        $topProductsRaw = Invoice::join('invoices_d', 'invoices.id', '=', 'invoices_d.invoice_m_id')
            ->join('products', 'invoices_d.item_id', '=', 'products.id')
            ->where('invoices.entity_id', $entityId)
            ->where('invoices.doc_date', '>=', $fiveYearsAgo)
            ->where('invoices.request_status', 4)
            ->select('products.item_name as product_name',
                    'invoices_d.qty as quantity',
                    'invoices_d.amt as item_amount',
                    'invoices.cur_tra_id',
                    'invoices.doc_date')
            ->get();
            
        // Group and convert currency for top products
        $topProductsConverted = [];
        foreach ($topProductsRaw as $item) {
            $productName = $item->product_name;
            $convertedAmount = $this->convertCurrency(
                $item->item_amount,
                $item->cur_tra_id ?? 114,
                $targetCurrency,
                $item->doc_date
            );
            
            if (!isset($topProductsConverted[$productName])) {
                $topProductsConverted[$productName] = [
                    'product_name' => $productName,
                    'total_quantity' => 0,
                    'total_amount' => 0
                ];
            }
            
            $topProductsConverted[$productName]['total_quantity'] += $item->quantity;
            $topProductsConverted[$productName]['total_amount'] += $convertedAmount;
        }
        
        // Sort by total amount and take top 10
        $topProducts = collect($topProductsConverted)
            ->sortByDesc('total_amount')
            ->take(10)
            ->values();

        return response()->json([
            'entity' => [
                'id' => $entity->id,
                'code' => $entity->entity_code,
                'name' => $entity->entity_name,
                'address' => $entity->address ?? '',
                'phone' => $entity->phone ?? '',
                'email' => $entity->email ?? '',
                'tax_no' => $entity->tax_no ?? ''
            ],
            'summary' => [
                'total_purchases_5_years_raw' => $totalInvoices,
                'total_purchases_5_years' => $this->formatCurrencyAmount($totalInvoices, $targetCurrency),
                'total_invoice_count' => $invoiceCount,
                'average_order_value_raw' => $invoiceCount > 0 ? ($totalInvoices / $invoiceCount) : 0,
                'average_order_value' => $invoiceCount > 0 ? $this->formatCurrencyAmount($totalInvoices / $invoiceCount, $targetCurrency) : $this->formatCurrencyAmount(0, $targetCurrency),
                'currency' => $targetCurrency
            ],
            'recent_invoices' => $recentInvoices,
            'recent_offers' => $recentOffers,
            'monthly_data' => $monthlyData,
            'top_products' => $topProducts,
            'available_years' => $availableYears,
            'current_year' => $currentYear
        ]);
    }

    public function getMonthlyData($entityId)
    {
        $year = request()->get('year', now()->year);
        $targetCurrency = request()->get('currency', 'USD');
        
        $monthlyData = [];
        for ($month = 1; $month <= 12; $month++) {
            $monthlyInvoices = Invoice::where('entity_id', $entityId)
                ->whereYear('doc_date', $year)
                ->whereMonth('doc_date', $month)
                ->where('request_status', 4)
                ->get();
            
            $monthlyAmount = 0;
            foreach ($monthlyInvoices as $invoice) {
                $convertedAmount = $this->convertCurrency(
                    $invoice->amt,
                    $invoice->cur_tra_id ?? 114,
                    $targetCurrency,
                    $invoice->doc_date
                );
                $monthlyAmount += $convertedAmount;
            }

            $monthName = \Carbon\Carbon::create($year, $month, 1)->format('M Y');
            $monthlyData[] = [
                'month' => $monthName,
                'amount' => $monthlyAmount
            ];
        }

        return response()->json([
            'monthly_data' => $monthlyData,
            'year' => $year
        ]);
    }
    
    /**
     * Convert amount from original currency to target currency using exchange rates
     */
    private function convertCurrency($amount, $originalCurrencyId, $targetCurrency, $date)
    {
        // If amount is 0 or null, return 0
        if (!$amount || $amount == 0) {
            return 0;
        }
        
        // Get original currency info
        $originalCurrency = Currency::find($originalCurrencyId);
        $originalCurrencyCode = $originalCurrency ? $originalCurrency->cur_code : 'TRY';
        
        // If same currency, return original amount
        if ($originalCurrencyCode === $targetCurrency) {
            return $amount;
        }
        
        // If original is TRY, convert to target currency
        if ($originalCurrencyCode === 'TRY') {
            $rate = $this->getExchangeRate($targetCurrency, $date);
            return $rate ? $amount / $rate : $amount;
        }
        
        // If target is TRY, convert from original currency
        if ($targetCurrency === 'TRY') {
            $rate = $this->getExchangeRate($originalCurrencyCode, $date);
            return $rate ? $amount * $rate : $amount;
        }
        
        // Convert through TRY (original -> TRY -> target)
        $originalRate = $this->getExchangeRate($originalCurrencyCode, $date);
        $targetRate = $this->getExchangeRate($targetCurrency, $date);
        
        if ($originalRate && $targetRate) {
            $tryAmount = $amount * $originalRate;
            return $tryAmount / $targetRate;
        }
        
        return $amount; // Fallback to original amount if conversion fails
    }
    
    /**
     * Get exchange rate for a currency on a specific date (or closest date)
     */
    private function getExchangeRate($currencyCode, $date)
    {
        // Try to get rate for exact date
        $rate = ExchangeRate::where('currency', $currencyCode)
            ->where('date', $date)
            ->where('type', 'A') // Buying rate
            ->first();
            
        if ($rate) {
            return $rate->value;
        }
        
        // If no exact date, get the closest previous date within 30 days
        $rate = ExchangeRate::where('currency', $currencyCode)
            ->where('date', '<=', $date)
            ->where('date', '>=', \Carbon\Carbon::parse($date)->subDays(30))
            ->where('type', 'A')
            ->orderBy('date', 'desc')
            ->first();
            
        return $rate ? $rate->value : null;
    }
    
    /**
     * Format currency amount with symbol
     */
    private function formatCurrencyAmount($amount, $currency)
    {
        $symbols = [
            'USD' => '$',
            'EUR' => '€',
            'TRY' => '₺'
        ];
        
        $symbol = $symbols[$currency] ?? $currency;
        return number_format($amount, 2) . ' ' . $symbol;
    }
}
