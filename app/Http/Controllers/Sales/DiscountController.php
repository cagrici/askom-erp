<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use App\Models\DiscountUsage;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\CurrentAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DiscountController extends Controller
{
    public function index(Request $request)
    {
        $query = Discount::with(['creator']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by active status
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Sorting
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $discounts = $query->paginate(15)->withQueryString();

        // Statistics
        $stats = [
            'total' => Discount::count(),
            'active' => Discount::active()->count(),
            'total_application' => Discount::sum('application_count'),
            'total_discount_given' => Discount::sum('total_discount_given'),
        ];

        // Discount types
        $types = [
            ['value' => 'customer', 'label' => 'Müşteriye Özel'],
            ['value' => 'product', 'label' => 'Ürüne Özel'],
            ['value' => 'quantity', 'label' => 'Miktara Dayalı'],
            ['value' => 'cash', 'label' => 'Nakit İskonto'],
            ['value' => 'general', 'label' => 'Genel İskonto'],
            ['value' => 'category', 'label' => 'Kategoriye Özel'],
        ];

        // Statuses
        $statuses = [
            ['value' => 'draft', 'label' => 'Taslak'],
            ['value' => 'active', 'label' => 'Aktif'],
            ['value' => 'inactive', 'label' => 'Pasif'],
            ['value' => 'expired', 'label' => 'Süresi Dolmuş'],
        ];

        return Inertia::render('Sales/Discounts/Index', [
            'discounts' => $discounts,
            'stats' => $stats,
            'filters' => $request->only(['search', 'type', 'status', 'is_active']),
            'types' => $types,
            'statuses' => $statuses,
        ]);
    }

    public function create()
    {
        return Inertia::render('Sales/Discounts/Form', [
            'discount' => null,
            'products' => Product::select('id', 'name', 'code')
                ->where('is_active', true)
                ->limit(1000)
                ->get(),
            'categories' => ProductCategory::select('id', 'name')
                ->where('is_active', true)
                ->get(),
            'customers' => CurrentAccount::where('account_type', 'customer')
                ->where('is_active', true)
                ->select('id', 'title', 'account_code')
                ->limit(500)
                ->get(),
            'types' => [
                ['value' => 'customer', 'label' => 'Müşteriye Özel'],
                ['value' => 'product', 'label' => 'Ürüne Özel'],
                ['value' => 'quantity', 'label' => 'Miktara Dayalı'],
                ['value' => 'cash', 'label' => 'Nakit İskonto'],
                ['value' => 'general', 'label' => 'Genel İskonto'],
                ['value' => 'category', 'label' => 'Kategoriye Özel'],
            ],
            'calculationTypes' => [
                ['value' => 'percentage', 'label' => 'Yüzde'],
                ['value' => 'fixed_amount', 'label' => 'Sabit Tutar'],
            ],
            'statuses' => [
                ['value' => 'draft', 'label' => 'Taslak'],
                ['value' => 'active', 'label' => 'Aktif'],
                ['value' => 'inactive', 'label' => 'Pasif'],
                ['value' => 'expired', 'label' => 'Süresi Dolmuş'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:discounts,code',
            'description' => 'nullable|string',
            'type' => 'required|in:customer,product,quantity,cash,general,category',
            'calculation_type' => 'required|in:percentage,fixed_amount',
            'discount_value' => 'required|numeric|min:0',
            'min_purchase_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
            'quantity_tiers' => 'nullable|array',
            'customer_ids' => 'nullable|array',
            'customer_group_ids' => 'nullable|array',
            'product_ids' => 'nullable|array',
            'category_ids' => 'nullable|array',
            'excluded_product_ids' => 'nullable|array',
            'excluded_category_ids' => 'nullable|array',
            'priority' => 'nullable|integer',
            'can_combine' => 'boolean',
            'applies_to_discounted_products' => 'boolean',
            'payment_method_ids' => 'nullable|array',
            'requires_cash_payment' => 'boolean',
            'min_quantity' => 'nullable|integer|min:1',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_customer' => 'nullable|integer|min:1',
            'show_on_invoice' => 'boolean',
            'show_on_website' => 'boolean',
            'auto_apply' => 'boolean',
            'status' => 'required|in:draft,active,inactive,expired',
            'notes' => 'nullable|string',
        ]);

        $validated['created_by'] = Auth::id();

        $discount = Discount::create($validated);

        return redirect()
            ->route('sales.discounts.show', $discount)
            ->with('success', 'İskonto başarıyla oluşturuldu.');
    }

    public function show(Discount $discount)
    {
        $discount->load(['creator', 'updater']);

        // Get usage statistics
        $usageStats = [
            'total_usages' => $discount->usages()->count(),
            'unique_customers' => $discount->usages()->distinct('customer_id')->count('customer_id'),
            'total_revenue' => $discount->total_revenue,
            'total_discount_given' => $discount->total_discount_given,
            'average_discount' => $discount->usages()->avg('discount_amount'),
        ];

        // Get daily usage for the last 30 days
        $dailyUsage = $discount->usages()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count, SUM(discount_amount) as total_discount')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();

        // Get recent usages
        $recentUsages = $discount->usages()
            ->with(['customer', 'salesOrder', 'user'])
            ->latest()
            ->limit(20)
            ->get();

        return Inertia::render('Sales/Discounts/Show', [
            'discount' => $discount,
            'usageStats' => $usageStats,
            'dailyUsage' => $dailyUsage,
            'recentUsages' => $recentUsages,
        ]);
    }

    public function edit(Discount $discount)
    {
        return Inertia::render('Sales/Discounts/Form', [
            'discount' => $discount,
            'products' => Product::select('id', 'name', 'code')
                ->where('is_active', true)
                ->limit(1000)
                ->get(),
            'categories' => ProductCategory::select('id', 'name')
                ->where('is_active', true)
                ->get(),
            'customers' => CurrentAccount::where('account_type', 'customer')
                ->where('is_active', true)
                ->select('id', 'title', 'account_code')
                ->limit(500)
                ->get(),
            'types' => [
                ['value' => 'customer', 'label' => 'Müşteriye Özel'],
                ['value' => 'product', 'label' => 'Ürüne Özel'],
                ['value' => 'quantity', 'label' => 'Miktara Dayalı'],
                ['value' => 'cash', 'label' => 'Nakit İskonto'],
                ['value' => 'general', 'label' => 'Genel İskonto'],
                ['value' => 'category', 'label' => 'Kategoriye Özel'],
            ],
            'calculationTypes' => [
                ['value' => 'percentage', 'label' => 'Yüzde'],
                ['value' => 'fixed_amount', 'label' => 'Sabit Tutar'],
            ],
            'statuses' => [
                ['value' => 'draft', 'label' => 'Taslak'],
                ['value' => 'active', 'label' => 'Aktif'],
                ['value' => 'inactive', 'label' => 'Pasif'],
                ['value' => 'expired', 'label' => 'Süresi Dolmuş'],
            ],
        ]);
    }

    public function update(Request $request, Discount $discount)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:discounts,code,' . $discount->id,
            'description' => 'nullable|string',
            'type' => 'required|in:customer,product,quantity,cash,general,category',
            'calculation_type' => 'required|in:percentage,fixed_amount',
            'discount_value' => 'required|numeric|min:0',
            'min_purchase_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
            'quantity_tiers' => 'nullable|array',
            'customer_ids' => 'nullable|array',
            'customer_group_ids' => 'nullable|array',
            'product_ids' => 'nullable|array',
            'category_ids' => 'nullable|array',
            'excluded_product_ids' => 'nullable|array',
            'excluded_category_ids' => 'nullable|array',
            'priority' => 'nullable|integer',
            'can_combine' => 'boolean',
            'applies_to_discounted_products' => 'boolean',
            'payment_method_ids' => 'nullable|array',
            'requires_cash_payment' => 'boolean',
            'min_quantity' => 'nullable|integer|min:1',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_customer' => 'nullable|integer|min:1',
            'show_on_invoice' => 'boolean',
            'show_on_website' => 'boolean',
            'auto_apply' => 'boolean',
            'status' => 'required|in:draft,active,inactive,expired',
            'notes' => 'nullable|string',
        ]);

        $validated['updated_by'] = Auth::id();

        $discount->update($validated);

        return redirect()
            ->route('sales.discounts.show', $discount)
            ->with('success', 'İskonto başarıyla güncellendi.');
    }

    public function destroy(Discount $discount)
    {
        $discount->delete();

        return redirect()
            ->route('sales.discounts.index')
            ->with('success', 'İskonto başarıyla silindi.');
    }

    public function toggleStatus(Discount $discount)
    {
        $discount->update([
            'is_active' => !$discount->is_active,
            'updated_by' => Auth::id(),
        ]);

        return back()->with('success', 'İskonto durumu güncellendi.');
    }

    public function duplicate(Discount $discount)
    {
        $newDiscount = $discount->replicate();
        $newDiscount->code = $discount->code . '_COPY_' . time();
        $newDiscount->name = $discount->name . ' (Kopya)';
        $newDiscount->status = 'draft';
        $newDiscount->is_active = false;
        $newDiscount->usage_count = 0;
        $newDiscount->application_count = 0;
        $newDiscount->total_discount_given = 0;
        $newDiscount->total_revenue = 0;
        $newDiscount->created_by = Auth::id();
        $newDiscount->save();

        return redirect()
            ->route('sales.discounts.edit', $newDiscount)
            ->with('success', 'İskonto başarıyla kopyalandı.');
    }
}
