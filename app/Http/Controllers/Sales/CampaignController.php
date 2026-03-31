<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Product;
use App\Models\CurrentAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class CampaignController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Campaign::with(['creator', 'giftProduct']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('coupon_code', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by is_active
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active == '1');
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('start_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('end_date', '<=', $request->date_to);
        }

        // Sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $campaigns = $query->paginate(20)->withQueryString();

        // Statistics
        $stats = [
            'total' => Campaign::count(),
            'active' => Campaign::active()->count(),
            'scheduled' => Campaign::scheduled()->count(),
            'expired' => Campaign::expired()->count(),
            'total_usage' => Campaign::sum('usage_count'),
            'total_revenue' => Campaign::sum('total_revenue'),
            'total_discount_given' => Campaign::sum('total_discount_given'),
        ];

        // Type and Status options
        $types = [
            'discount_percentage' => 'İndirim Yüzdesi',
            'discount_amount' => 'İndirim Tutarı',
            'buy_x_get_y' => 'X Al Y Öde',
            'free_shipping' => 'Ücretsiz Kargo',
            'bundle' => 'Paket Kampanya',
            'gift' => 'Hediye',
            'cashback' => 'Para İadesi',
        ];

        $statuses = [
            'draft' => 'Taslak',
            'scheduled' => 'Planlanmış',
            'active' => 'Aktif',
            'paused' => 'Duraklatılmış',
            'expired' => 'Süresi Dolmuş',
            'completed' => 'Tamamlanmış',
        ];

        return Inertia::render('Sales/Campaigns/Index', [
            'campaigns' => $campaigns,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'type', 'is_active', 'date_from', 'date_to']),
            'types' => $types,
            'statuses' => $statuses,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Sales/Campaigns/Form', [
            'campaign' => null,
            'products' => Product::select('id', 'name', 'code')
                ->where('is_active', true)
                ->limit(1000)
                ->get(),
            'customers' => CurrentAccount::where('account_type', 'customer')
                ->where('is_active', true)
                ->select('id', 'title', 'account_code')
                ->limit(500)
                ->get(),
            'types' => $this->getTypes(),
            'targetTypes' => $this->getTargetTypes(),
            'statuses' => $this->getStatuses(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:campaigns,code',
            'description' => 'nullable|string',
            'type' => 'required|in:discount_percentage,discount_amount,buy_x_get_y,free_shipping,bundle,gift,cashback',
            'target_type' => 'required|in:all,customer,customer_group,new_customer,location',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
            'discount_value' => 'nullable|numeric|min:0',
            'min_purchase_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'buy_quantity' => 'nullable|integer|min:1',
            'get_quantity' => 'nullable|integer|min:1',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_customer' => 'nullable|integer|min:1',
            'product_ids' => 'nullable|array',
            'category_ids' => 'nullable|array',
            'excluded_product_ids' => 'nullable|array',
            'excluded_category_ids' => 'nullable|array',
            'customer_ids' => 'nullable|array',
            'customer_group_ids' => 'nullable|array',
            'location_ids' => 'nullable|array',
            'gift_product_id' => 'nullable|exists:products,id',
            'gift_quantity' => 'nullable|integer|min:1',
            'priority' => 'nullable|integer',
            'can_stack' => 'boolean',
            'requires_coupon' => 'boolean',
            'coupon_code' => 'nullable|string|max:100|unique:campaigns,coupon_code',
            'show_on_website' => 'boolean',
            'banner_image' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
            'status' => 'required|in:draft,scheduled,active,paused,expired,completed',
            'notes' => 'nullable|string',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['updated_by'] = auth()->id();

        $campaign = Campaign::create($validated);

        return redirect()
            ->route('sales.campaigns.show', $campaign)
            ->with('success', 'Kampanya başarıyla oluşturuldu.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Campaign $campaign)
    {
        $campaign->load([
            'creator',
            'updater',
            'giftProduct',
            'usages' => function ($query) {
                $query->with(['customer', 'salesOrder'])
                    ->latest()
                    ->limit(50);
            }
        ]);

        // Usage statistics
        $usageStats = [
            'total_usage' => $campaign->usage_count,
            'usage_limit' => $campaign->usage_limit,
            'usage_percentage' => $campaign->usage_percentage,
            'total_revenue' => $campaign->total_revenue,
            'total_discount_given' => $campaign->total_discount_given,
            'average_discount' => $campaign->usage_count > 0
                ? $campaign->total_discount_given / $campaign->usage_count
                : 0,
            'days_remaining' => $campaign->days_remaining,
            'is_currently_active' => $campaign->is_currently_active,
        ];

        // Daily usage chart data (last 30 days)
        $dailyUsage = DB::table('campaign_usages')
            ->where('campaign_id', $campaign->id)
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(discount_amount) as total_discount')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('Sales/Campaigns/Show', [
            'campaign' => $campaign,
            'usageStats' => $usageStats,
            'dailyUsage' => $dailyUsage,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Campaign $campaign)
    {
        return Inertia::render('Sales/Campaigns/Form', [
            'campaign' => $campaign,
            'products' => Product::select('id', 'name', 'code')
                ->where('is_active', true)
                ->limit(1000)
                ->get(),
            'customers' => CurrentAccount::where('account_type', 'customer')
                ->where('is_active', true)
                ->select('id', 'title', 'account_code')
                ->limit(500)
                ->get(),
            'types' => $this->getTypes(),
            'targetTypes' => $this->getTargetTypes(),
            'statuses' => $this->getStatuses(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Campaign $campaign)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:campaigns,code,' . $campaign->id,
            'description' => 'nullable|string',
            'type' => 'required|in:discount_percentage,discount_amount,buy_x_get_y,free_shipping,bundle,gift,cashback',
            'target_type' => 'required|in:all,customer,customer_group,new_customer,location',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
            'discount_value' => 'nullable|numeric|min:0',
            'min_purchase_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'buy_quantity' => 'nullable|integer|min:1',
            'get_quantity' => 'nullable|integer|min:1',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_customer' => 'nullable|integer|min:1',
            'product_ids' => 'nullable|array',
            'category_ids' => 'nullable|array',
            'excluded_product_ids' => 'nullable|array',
            'excluded_category_ids' => 'nullable|array',
            'customer_ids' => 'nullable|array',
            'customer_group_ids' => 'nullable|array',
            'location_ids' => 'nullable|array',
            'gift_product_id' => 'nullable|exists:products,id',
            'gift_quantity' => 'nullable|integer|min:1',
            'priority' => 'nullable|integer',
            'can_stack' => 'boolean',
            'requires_coupon' => 'boolean',
            'coupon_code' => 'nullable|string|max:100|unique:campaigns,coupon_code,' . $campaign->id,
            'show_on_website' => 'boolean',
            'banner_image' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
            'status' => 'required|in:draft,scheduled,active,paused,expired,completed',
            'notes' => 'nullable|string',
        ]);

        $validated['updated_by'] = auth()->id();

        $campaign->update($validated);

        return redirect()
            ->route('sales.campaigns.show', $campaign)
            ->with('success', 'Kampanya başarıyla güncellendi.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Campaign $campaign)
    {
        $campaign->delete();

        return redirect()
            ->route('sales.campaigns.index')
            ->with('success', 'Kampanya başarıyla silindi.');
    }

    /**
     * Toggle campaign status (activate/deactivate)
     */
    public function toggleStatus(Campaign $campaign)
    {
        $campaign->update([
            'is_active' => !$campaign->is_active,
            'updated_by' => auth()->id(),
        ]);

        $status = $campaign->is_active ? 'aktifleştirildi' : 'devre dışı bırakıldı';

        return back()->with('success', "Kampanya {$status}.");
    }

    /**
     * Duplicate campaign
     */
    public function duplicate(Campaign $campaign)
    {
        $newCampaign = $campaign->replicate();
        $newCampaign->name = $campaign->name . ' (Kopya)';
        $newCampaign->code = $campaign->code . '-copy-' . time();
        $newCampaign->coupon_code = $campaign->coupon_code ? $campaign->coupon_code . '-copy-' . time() : null;
        $newCampaign->usage_count = 0;
        $newCampaign->total_revenue = 0;
        $newCampaign->total_discount_given = 0;
        $newCampaign->view_count = 0;
        $newCampaign->status = 'draft';
        $newCampaign->created_by = auth()->id();
        $newCampaign->updated_by = auth()->id();
        $newCampaign->save();

        return redirect()
            ->route('sales.campaigns.edit', $newCampaign)
            ->with('success', 'Kampanya kopyalandı.');
    }

    /**
     * Get campaign types
     */
    private function getTypes()
    {
        return [
            'discount_percentage' => 'İndirim Yüzdesi',
            'discount_amount' => 'İndirim Tutarı',
            'buy_x_get_y' => 'X Al Y Öde',
            'free_shipping' => 'Ücretsiz Kargo',
            'bundle' => 'Paket Kampanya',
            'gift' => 'Hediye',
            'cashback' => 'Para İadesi',
        ];
    }

    /**
     * Get target types
     */
    private function getTargetTypes()
    {
        return [
            'all' => 'Tüm Müşteriler',
            'customer' => 'Belirli Müşteri',
            'customer_group' => 'Müşteri Grubu',
            'new_customer' => 'Yeni Müşteriler',
            'location' => 'Belirli Lokasyon',
        ];
    }

    /**
     * Get statuses
     */
    private function getStatuses()
    {
        return [
            'draft' => 'Taslak',
            'scheduled' => 'Planlanmış',
            'active' => 'Aktif',
            'paused' => 'Duraklatılmış',
            'expired' => 'Süresi Dolmuş',
            'completed' => 'Tamamlanmış',
        ];
    }
}
