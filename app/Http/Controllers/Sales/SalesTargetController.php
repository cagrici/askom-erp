<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\SalesTarget;
use App\Models\User;
use App\Models\Department;
use App\Models\Location;
use App\Models\SalesOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class SalesTargetController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesTarget::with(['user', 'department', 'location', 'creator']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Filter by period type
        if ($request->filled('period_type')) {
            $query->where('period_type', $request->period_type);
        }

        // Filter by assignment type
        if ($request->filled('assignment_type')) {
            $query->where('assignment_type', $request->assignment_type);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by year
        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        // Filter by user
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Sorting
        $sortField = $request->input('sort_field', 'start_date');
        $sortDirection = $request->input('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $targets = $query->paginate(15)->withQueryString();

        // Statistics
        $stats = [
            'total' => SalesTarget::count(),
            'active' => SalesTarget::running()->count(),
            'completed' => SalesTarget::where('status', 'completed')->count(),
            'avg_achievement' => SalesTarget::active()->avg('overall_achievement') ?? 0,
        ];

        // Period types
        $periodTypes = [
            ['value' => 'monthly', 'label' => 'Aylık'],
            ['value' => 'quarterly', 'label' => 'Çeyreklik'],
            ['value' => 'yearly', 'label' => 'Yıllık'],
            ['value' => 'custom', 'label' => 'Özel'],
        ];

        // Assignment types
        $assignmentTypes = [
            ['value' => 'salesperson', 'label' => 'Satış Temsilcisi'],
            ['value' => 'team', 'label' => 'Takım'],
            ['value' => 'department', 'label' => 'Departman'],
            ['value' => 'location', 'label' => 'Lokasyon'],
            ['value' => 'company', 'label' => 'Şirket'],
        ];

        // Statuses
        $statuses = [
            ['value' => 'active', 'label' => 'Aktif'],
            ['value' => 'completed', 'label' => 'Tamamlandı'],
            ['value' => 'cancelled', 'label' => 'İptal Edildi'],
        ];

        // Years for filter
        $years = range(date('Y') - 2, date('Y') + 1);

        return Inertia::render('Sales/Targets/Index', [
            'targets' => $targets,
            'stats' => $stats,
            'filters' => $request->only(['search', 'period_type', 'assignment_type', 'status', 'year', 'user_id']),
            'periodTypes' => $periodTypes,
            'assignmentTypes' => $assignmentTypes,
            'statuses' => $statuses,
            'years' => $years,
        ]);
    }

    public function create()
    {
        return Inertia::render('Sales/Targets/Form', [
            'target' => null,
            'users' => User::select('id', 'name', 'email')->get(),
            'departments' => Department::select('id', 'name')->where('is_active', true)->get(),
            'locations' => Location::select('id', 'name')->where('is_active', true)->get(),
            'periodTypes' => [
                ['value' => 'monthly', 'label' => 'Aylık'],
                ['value' => 'quarterly', 'label' => 'Çeyreklik'],
                ['value' => 'yearly', 'label' => 'Yıllık'],
                ['value' => 'custom', 'label' => 'Özel'],
            ],
            'assignmentTypes' => [
                ['value' => 'salesperson', 'label' => 'Satış Temsilcisi'],
                ['value' => 'team', 'label' => 'Takım'],
                ['value' => 'department', 'label' => 'Departman'],
                ['value' => 'location', 'label' => 'Lokasyon'],
                ['value' => 'company', 'label' => 'Şirket'],
            ],
            'statuses' => [
                ['value' => 'active', 'label' => 'Aktif'],
                ['value' => 'completed', 'label' => 'Tamamlandı'],
                ['value' => 'cancelled', 'label' => 'İptal Edildi'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:sales_targets,code',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'period_type' => 'required|in:monthly,quarterly,yearly,custom',
            'year' => 'required|integer|min:2020|max:2100',
            'month' => 'nullable|integer|min:1|max:12',
            'quarter' => 'nullable|integer|min:1|max:4',
            'assignment_type' => 'required|in:salesperson,team,department,location,company',
            'user_id' => 'nullable|exists:users,id',
            'department_id' => 'nullable|exists:departments,id',
            'location_id' => 'nullable|exists:locations,id',
            'revenue_target' => 'required|numeric|min:0',
            'quantity_target' => 'required|integer|min:0',
            'order_target' => 'required|integer|min:0',
            'new_customer_target' => 'required|integer|min:0',
            'revenue_weight' => 'required|integer|min:0|max:100',
            'quantity_weight' => 'required|integer|min:0|max:100',
            'order_weight' => 'required|integer|min:0|max:100',
            'new_customer_weight' => 'required|integer|min:0|max:100',
            'is_active' => 'boolean',
            'bonus_amount' => 'nullable|numeric|min:0',
            'bonus_percentage' => 'nullable|numeric|min:0|max:100',
            'bonus_conditions' => 'nullable|string',
            'status' => 'required|in:active,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $validated['created_by'] = Auth::id();

        $target = SalesTarget::create($validated);

        return redirect()
            ->route('sales.targets.show', $target)
            ->with('success', 'Satış hedefi başarıyla oluşturuldu.');
    }

    public function show(SalesTarget $target)
    {
        $target->load(['user', 'department', 'location', 'creator', 'updater']);

        // Get performance data
        $performanceData = $this->calculatePerformanceData($target);

        // Get daily progress for the period
        $dailyProgress = $this->getDailyProgress($target);

        return Inertia::render('Sales/Targets/Show', [
            'target' => $target,
            'performanceData' => $performanceData,
            'dailyProgress' => $dailyProgress,
        ]);
    }

    public function edit(SalesTarget $target)
    {
        return Inertia::render('Sales/Targets/Form', [
            'target' => $target,
            'users' => User::select('id', 'name', 'email')->get(),
            'departments' => Department::select('id', 'name')->where('is_active', true)->get(),
            'locations' => Location::select('id', 'name')->where('is_active', true)->get(),
            'periodTypes' => [
                ['value' => 'monthly', 'label' => 'Aylık'],
                ['value' => 'quarterly', 'label' => 'Çeyreklik'],
                ['value' => 'yearly', 'label' => 'Yıllık'],
                ['value' => 'custom', 'label' => 'Özel'],
            ],
            'assignmentTypes' => [
                ['value' => 'salesperson', 'label' => 'Satış Temsilcisi'],
                ['value' => 'team', 'label' => 'Takım'],
                ['value' => 'department', 'label' => 'Departman'],
                ['value' => 'location', 'label' => 'Lokasyon'],
                ['value' => 'company', 'label' => 'Şirket'],
            ],
            'statuses' => [
                ['value' => 'active', 'label' => 'Aktif'],
                ['value' => 'completed', 'label' => 'Tamamlandı'],
                ['value' => 'cancelled', 'label' => 'İptal Edildi'],
            ],
        ]);
    }

    public function update(Request $request, SalesTarget $target)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:sales_targets,code,' . $target->id,
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'period_type' => 'required|in:monthly,quarterly,yearly,custom',
            'year' => 'required|integer|min:2020|max:2100',
            'month' => 'nullable|integer|min:1|max:12',
            'quarter' => 'nullable|integer|min:1|max:4',
            'assignment_type' => 'required|in:salesperson,team,department,location,company',
            'user_id' => 'nullable|exists:users,id',
            'department_id' => 'nullable|exists:departments,id',
            'location_id' => 'nullable|exists:locations,id',
            'revenue_target' => 'required|numeric|min:0',
            'quantity_target' => 'required|integer|min:0',
            'order_target' => 'required|integer|min:0',
            'new_customer_target' => 'required|integer|min:0',
            'revenue_weight' => 'required|integer|min:0|max:100',
            'quantity_weight' => 'required|integer|min:0|max:100',
            'order_weight' => 'required|integer|min:0|max:100',
            'new_customer_weight' => 'required|integer|min:0|max:100',
            'is_active' => 'boolean',
            'bonus_amount' => 'nullable|numeric|min:0',
            'bonus_percentage' => 'nullable|numeric|min:0|max:100',
            'bonus_conditions' => 'nullable|string',
            'status' => 'required|in:active,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $validated['updated_by'] = Auth::id();

        $target->update($validated);

        return redirect()
            ->route('sales.targets.show', $target)
            ->with('success', 'Satış hedefi başarıyla güncellendi.');
    }

    public function destroy(SalesTarget $target)
    {
        $target->delete();

        return redirect()
            ->route('sales.targets.index')
            ->with('success', 'Satış hedefi başarıyla silindi.');
    }

    public function toggleStatus(SalesTarget $target)
    {
        $target->update([
            'is_active' => !$target->is_active,
            'updated_by' => Auth::id(),
        ]);

        return back()->with('success', 'Hedef durumu güncellendi.');
    }

    public function recalculate(SalesTarget $target)
    {
        // Recalculate actuals from sales orders
        $query = SalesOrder::whereBetween('order_date', [$target->start_date, $target->end_date]);

        // Filter by assignment
        switch ($target->assignment_type) {
            case 'salesperson':
                $query->where('sales_person_id', $target->user_id);
                break;
            case 'department':
                $query->whereHas('salesPerson', function ($q) use ($target) {
                    $q->where('department_id', $target->department_id);
                });
                break;
            case 'location':
                $query->where('location_id', $target->location_id);
                break;
        }

        // Calculate actuals
        $revenue = $query->sum('total_amount');
        $orders = $query->count();
        $quantity = $query->sum('total_quantity');

        // Calculate new customers (orders with customer's first order in period)
        $newCustomers = 0;
        // This would require more complex logic to determine first-time customers

        $target->updateActuals($revenue, $quantity, $orders, $newCustomers);

        return back()->with('success', 'Hedef değerleri yeniden hesaplandı.');
    }

    private function calculatePerformanceData(SalesTarget $target): array
    {
        return [
            'revenue' => [
                'target' => $target->revenue_target,
                'actual' => $target->actual_revenue,
                'achievement' => $target->revenue_achievement,
                'remaining' => max(0, $target->revenue_target - $target->actual_revenue),
            ],
            'quantity' => [
                'target' => $target->quantity_target,
                'actual' => $target->actual_quantity,
                'achievement' => $target->quantity_achievement,
                'remaining' => max(0, $target->quantity_target - $target->actual_quantity),
            ],
            'orders' => [
                'target' => $target->order_target,
                'actual' => $target->actual_orders,
                'achievement' => $target->order_achievement,
                'remaining' => max(0, $target->order_target - $target->actual_orders),
            ],
            'new_customers' => [
                'target' => $target->new_customer_target,
                'actual' => $target->actual_new_customers,
                'achievement' => $target->new_customer_achievement,
                'remaining' => max(0, $target->new_customer_target - $target->actual_new_customers),
            ],
        ];
    }

    private function getDailyProgress(SalesTarget $target): array
    {
        // Get daily revenue data for the period
        $query = SalesOrder::whereBetween('order_date', [$target->start_date, $target->end_date]);

        // Filter by assignment
        switch ($target->assignment_type) {
            case 'salesperson':
                $query->where('sales_person_id', $target->user_id);
                break;
            case 'department':
                $query->whereHas('salesPerson', function ($q) use ($target) {
                    $q->where('department_id', $target->department_id);
                });
                break;
            case 'location':
                $query->where('location_id', $target->location_id);
                break;
        }

        $dailyData = $query->selectRaw('DATE(order_date) as date, SUM(total_amount) as revenue, COUNT(*) as orders')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $dailyData->toArray();
    }
}
