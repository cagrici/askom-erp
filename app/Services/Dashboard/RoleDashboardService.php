<?php

namespace App\Services\Dashboard;

use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\CurrentAccount;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\InventoryStock;
use App\Models\InventoryMovement;
use App\Models\ShippingOrder;
use App\Models\WarehouseLocation;
use App\Models\WarehouseStaff;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RoleDashboardService
{
    /**
     * Sirket Yonetimi Dashboard Verileri
     */
    public function getCompanyManagerDashboardData(): array
    {
        return app(CompanyManagerDashboardService::class)->getData();
    }

    /**
     * Satis Yoneticisi Dashboard Verileri
     */
    public function getSalesManagerDashboardData(): array
    {
        return [
            'team_sales_summary' => $this->getTeamSalesSummary(),
            'salesperson_performance' => $this->getSalespersonPerformance(),
            'sales_targets' => $this->getSalesTargets(),
            'pending_offers' => $this->getPendingOffers(),
            'top_customers' => $this->getTopCustomers(10),
            'category_sales' => $this->getCategorySales(),
            'conversion_rates' => $this->getConversionRates(),
            'recent_orders' => $this->getRecentOrders(10),
        ];
    }

    /**
     * Depo Yoneticisi Dashboard Verileri
     */
    public function getWarehouseManagerDashboardData(): array
    {
        return [
            'warehouse_capacity' => $this->getWarehouseCapacity(),
            'daily_operations' => $this->getDailyOperations(),
            'low_stock_alerts' => $this->getLowStockAlerts(),
            'pending_shipments' => $this->getPendingShipments(),
            'location_usage' => $this->getLocationUsage(),
            'recent_movements' => $this->getRecentMovements(10),
            'staff_status' => $this->getStaffStatus(),
            'cycle_count_schedule' => $this->getCycleCountSchedule(),
        ];
    }

    // ==================== ORTAK METOTLAR ====================

    /**
     * Satis ozeti (bugun, bu hafta, bu ay)
     */
    private function getSalesSummary(): array
    {
        $today = Carbon::today();
        $weekStart = Carbon::now()->startOfWeek();
        $monthStart = Carbon::now()->startOfMonth();

        return [
            'today' => [
                'total' => SalesOrder::whereDate('order_date', $today)
                    ->whereNotIn('status', ['cancelled', 'draft'])
                    ->sum('total_amount') ?? 0,
                'count' => SalesOrder::whereDate('order_date', $today)
                    ->whereNotIn('status', ['cancelled', 'draft'])
                    ->count(),
            ],
            'this_week' => [
                'total' => SalesOrder::whereBetween('order_date', [$weekStart, $today])
                    ->whereNotIn('status', ['cancelled', 'draft'])
                    ->sum('total_amount') ?? 0,
                'count' => SalesOrder::whereBetween('order_date', [$weekStart, $today])
                    ->whereNotIn('status', ['cancelled', 'draft'])
                    ->count(),
            ],
            'this_month' => [
                'total' => SalesOrder::whereBetween('order_date', [$monthStart, $today])
                    ->whereNotIn('status', ['cancelled', 'draft'])
                    ->sum('total_amount') ?? 0,
                'count' => SalesOrder::whereBetween('order_date', [$monthStart, $today])
                    ->whereNotIn('status', ['cancelled', 'draft'])
                    ->count(),
            ],
        ];
    }

    /**
     * Son 12 ay satis grafigi
     */
    private function getMonthlySalesChart(): array
    {
        $data = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();

            $monthData = SalesOrder::whereBetween('order_date', [$startOfMonth, $endOfMonth])
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->selectRaw('SUM(total_amount) as total, COUNT(*) as count')
                ->first();

            $data[] = [
                'month' => $date->translatedFormat('M Y'),
                'month_short' => $date->translatedFormat('M'),
                'total' => (float) ($monthData->total ?? 0),
                'count' => (int) ($monthData->count ?? 0),
            ];
        }
        return $data;
    }

    /**
     * Son siparisler
     */
    private function getRecentOrders(int $limit = 10): array
    {
        return SalesOrder::with(['customer:id,title,account_code'])
            ->select(['id', 'order_number', 'customer_id', 'order_date', 'total_amount', 'status'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer' => $order->customer->title ?? 'Bilinmeyen',
                    'customer_code' => $order->customer->account_code ?? '-',
                    'date' => Carbon::parse($order->order_date)->format('d.m.Y H:i'),
                    'total' => (float) $order->total_amount,
                    'status' => $order->status,
                ];
            })
            ->toArray();
    }

    /**
     * Siparis durumu dagilimi
     */
    private function getOrderStatusDistribution(): array
    {
        $statuses = SalesOrder::whereMonth('order_date', Carbon::now()->month)
            ->whereYear('order_date', Carbon::now()->year)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $statusLabels = [
            'draft' => 'Taslak',
            'confirmed' => 'Onaylanmis',
            'in_production' => 'Uretimde',
            'ready_to_ship' => 'Sevke Hazir',
            'shipped' => 'Sevk Edildi',
            'delivered' => 'Teslim Edildi',
            'cancelled' => 'Iptal',
            'returned' => 'Iade',
        ];

        $result = [];
        foreach ($statusLabels as $key => $label) {
            if (isset($statuses[$key]) && $statuses[$key] > 0) {
                $result[] = [
                    'status' => $key,
                    'label' => $label,
                    'count' => $statuses[$key],
                ];
            }
        }

        return $result;
    }

    /**
     * Bu ay vs gecen ay karsilastirmasi
     */
    private function getMonthlyComparison(): array
    {
        $thisMonth = Carbon::now();
        $lastMonth = Carbon::now()->subMonth();

        $thisMonthTotal = SalesOrder::whereMonth('order_date', $thisMonth->month)
            ->whereYear('order_date', $thisMonth->year)
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->sum('total_amount') ?? 0;

        $lastMonthTotal = SalesOrder::whereMonth('order_date', $lastMonth->month)
            ->whereYear('order_date', $lastMonth->year)
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->sum('total_amount') ?? 0;

        $change = $lastMonthTotal > 0
            ? (($thisMonthTotal - $lastMonthTotal) / $lastMonthTotal) * 100
            : ($thisMonthTotal > 0 ? 100 : 0);

        return [
            'this_month' => (float) $thisMonthTotal,
            'last_month' => (float) $lastMonthTotal,
            'change_percent' => round($change, 1),
            'trend' => $change >= 0 ? 'up' : 'down',
        ];
    }

    /**
     * En cok satan urunler
     */
    private function getTopProducts(int $limit = 5): array
    {
        return SalesOrderItem::join('sales_orders', 'sales_order_items.sales_order_id', '=', 'sales_orders.id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->whereMonth('sales_orders.order_date', Carbon::now()->month)
            ->whereYear('sales_orders.order_date', Carbon::now()->year)
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->selectRaw('products.id, products.name, products.code, SUM(sales_order_items.quantity) as total_qty, SUM(sales_order_items.line_total) as total_revenue')
            ->groupBy('products.id', 'products.name', 'products.code')
            ->orderBy('total_revenue', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'code' => $item->code,
                    'quantity' => (int) $item->total_qty,
                    'revenue' => (float) $item->total_revenue,
                ];
            })
            ->toArray();
    }

    /**
     * En degerli musteriler
     */
    private function getTopCustomers(int $limit = 5): array
    {
        return CurrentAccount::join('sales_orders', 'current_accounts.id', '=', 'sales_orders.customer_id')
            ->whereMonth('sales_orders.order_date', Carbon::now()->month)
            ->whereYear('sales_orders.order_date', Carbon::now()->year)
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->where('current_accounts.account_type', 'customer')
            ->selectRaw('current_accounts.id, current_accounts.title, current_accounts.account_code, COUNT(sales_orders.id) as order_count, SUM(sales_orders.total_amount) as total_revenue')
            ->groupBy('current_accounts.id', 'current_accounts.title', 'current_accounts.account_code')
            ->orderBy('total_revenue', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'title' => $customer->title,
                    'account_code' => $customer->account_code,
                    'order_count' => (int) $customer->order_count,
                    'total_revenue' => (float) $customer->total_revenue,
                ];
            })
            ->toArray();
    }

    /**
     * Alacak ozeti
     */
    private function getReceivablesSummary(): array
    {
        $today = Carbon::today();

        $totalReceivables = Invoice::where('status', '!=', 'paid')
            ->where('status', '!=', 'cancelled')
            ->sum('gross_total') ?? 0;

        $overdueReceivables = Invoice::where('status', '!=', 'paid')
            ->where('status', '!=', 'cancelled')
            ->whereDate('invoice_date', '<', $today->subDays(30))
            ->sum('gross_total') ?? 0;

        $upcomingReceivables = Invoice::where('status', '!=', 'paid')
            ->where('status', '!=', 'cancelled')
            ->whereBetween('invoice_date', [$today->subDays(7), $today->addDays(7)])
            ->sum('gross_total') ?? 0;

        return [
            'total' => (float) $totalReceivables,
            'overdue' => (float) $overdueReceivables,
            'upcoming' => (float) $upcomingReceivables,
        ];
    }

    // ==================== SATIS YONETICISI METOTLARI ====================

    /**
     * Ekip satis ozeti
     */
    private function getTeamSalesSummary(): array
    {
        return $this->getSalesSummary(); // Ayni metot
    }

    /**
     * Satis temsilcisi performansi
     */
    private function getSalespersonPerformance(): array
    {
        return User::join('sales_orders', 'users.id', '=', 'sales_orders.salesperson_id')
            ->whereMonth('sales_orders.order_date', Carbon::now()->month)
            ->whereYear('sales_orders.order_date', Carbon::now()->year)
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->selectRaw('users.id, users.name, COUNT(sales_orders.id) as order_count, SUM(sales_orders.total_amount) as total_revenue')
            ->groupBy('users.id', 'users.name')
            ->orderBy('total_revenue', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'order_count' => (int) $user->order_count,
                    'total_revenue' => (float) $user->total_revenue,
                ];
            })
            ->toArray();
    }

    /**
     * Satis hedefleri (placeholder - SalesTarget modeli varsa kullanilir)
     */
    private function getSalesTargets(): array
    {
        // Hedef tablosu yoksa statik veri
        $thisMonthTotal = SalesOrder::whereMonth('order_date', Carbon::now()->month)
            ->whereYear('order_date', Carbon::now()->year)
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->sum('total_amount') ?? 0;

        return [
            'target' => 500000, // Varsayilan hedef
            'achieved' => (float) $thisMonthTotal,
            'percentage' => min(100, round(($thisMonthTotal / 500000) * 100, 1)),
        ];
    }

    /**
     * Bekleyen teklifler (placeholder)
     */
    private function getPendingOffers(): array
    {
        // SalesOffer modeli varsa kullanilir
        return [];
    }

    /**
     * Kategori bazli satislar
     */
    private function getCategorySales(): array
    {
        return SalesOrderItem::join('sales_orders', 'sales_order_items.sales_order_id', '=', 'sales_orders.id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->whereMonth('sales_orders.order_date', Carbon::now()->month)
            ->whereYear('sales_orders.order_date', Carbon::now()->year)
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->selectRaw('COALESCE(categories.name, "Kategorisiz") as category, SUM(sales_order_items.line_total) as total')
            ->groupBy('categories.name')
            ->orderBy('total', 'desc')
            ->limit(6)
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'total' => (float) $item->total,
                ];
            })
            ->toArray();
    }

    /**
     * Donusum oranlari (placeholder)
     */
    private function getConversionRates(): array
    {
        // Teklif -> Siparis donusum orani
        return [
            'offers_created' => 0,
            'offers_converted' => 0,
            'conversion_rate' => 0,
        ];
    }

    // ==================== DEPO YONETICISI METOTLARI ====================

    /**
     * Depo kapasite durumu
     */
    private function getWarehouseCapacity(): array
    {
        return Warehouse::where('status', 'active')
            ->select(['id', 'name', 'code', 'max_capacity'])
            ->get()
            ->map(function ($warehouse) {
                $usedCapacity = InventoryStock::where('warehouse_id', $warehouse->id)
                    ->where('status', 'active')
                    ->sum('quantity_on_hand') ?? 0;

                $maxCapacity = $warehouse->max_capacity ?? 10000;
                $percentage = $maxCapacity > 0 ? round(($usedCapacity / $maxCapacity) * 100, 1) : 0;

                return [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                    'code' => $warehouse->code,
                    'used' => (int) $usedCapacity,
                    'max' => (int) $maxCapacity,
                    'percentage' => min(100, $percentage),
                ];
            })
            ->toArray();
    }

    /**
     * Gunluk operasyonlar
     */
    private function getDailyOperations(): array
    {
        $today = Carbon::today();

        $inbound = InventoryMovement::whereDate('movement_date', $today)
            ->where('movement_type', 'receipt')
            ->count();

        $outbound = InventoryMovement::whereDate('movement_date', $today)
            ->where('movement_type', 'issue')
            ->count();

        $transfers = InventoryMovement::whereDate('movement_date', $today)
            ->where('movement_type', 'transfer')
            ->count();

        return [
            'inbound' => $inbound,
            'outbound' => $outbound,
            'transfers' => $transfers,
            'total' => $inbound + $outbound + $transfers,
        ];
    }

    /**
     * Dusuk stok uyarilari
     */
    private function getLowStockAlerts(): array
    {
        return InventoryStock::join('inventory_items', 'inventory_stocks.inventory_item_id', '=', 'inventory_items.id')
            ->join('products', 'inventory_items.product_id', '=', 'products.id')
            ->whereRaw('inventory_stocks.quantity_on_hand <= inventory_items.minimum_stock')
            ->where('inventory_stocks.status', 'active')
            ->select([
                'products.id',
                'products.name',
                'products.code',
                'inventory_stocks.quantity_on_hand as current_stock',
                'inventory_items.minimum_stock as min_stock',
            ])
            ->orderByRaw('inventory_stocks.quantity_on_hand / NULLIF(inventory_items.minimum_stock, 0)')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'code' => $item->code,
                    'current_stock' => (int) $item->current_stock,
                    'min_stock' => (int) $item->min_stock,
                ];
            })
            ->toArray();
    }

    /**
     * Bekleyen sevkiyatlar
     */
    private function getPendingShipments(): array
    {
        return SalesOrder::with(['customer:id,title'])
            ->whereIn('status', ['confirmed', 'ready_to_ship'])
            ->select(['id', 'order_number', 'customer_id', 'order_date', 'total_amount'])
            ->orderBy('order_date', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer' => $order->customer->title ?? 'Bilinmeyen',
                    'date' => Carbon::parse($order->order_date)->format('d.m.Y'),
                    'total' => (float) $order->total_amount,
                ];
            })
            ->toArray();
    }

    /**
     * Lokasyon kullanim durumu
     */
    private function getLocationUsage(): array
    {
        $totalLocations = WarehouseLocation::where('status', 'active')->count();
        $occupiedLocations = WarehouseLocation::where('status', 'active')
            ->where('is_occupied', true)
            ->count();

        $emptyLocations = $totalLocations - $occupiedLocations;
        $usagePercent = $totalLocations > 0 ? round(($occupiedLocations / $totalLocations) * 100, 1) : 0;

        return [
            'total' => $totalLocations,
            'occupied' => $occupiedLocations,
            'empty' => $emptyLocations,
            'usage_percent' => $usagePercent,
        ];
    }

    /**
     * Son stok hareketleri
     */
    private function getRecentMovements(int $limit = 10): array
    {
        return InventoryMovement::with(['inventoryItem.product:id,name,code', 'warehouse:id,name'])
            ->select(['id', 'movement_number', 'movement_type', 'quantity', 'warehouse_id', 'inventory_item_id', 'movement_date'])
            ->orderBy('movement_date', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($movement) {
                $typeLabels = [
                    'receipt' => 'Giris',
                    'issue' => 'Cikis',
                    'transfer' => 'Transfer',
                    'adjustment' => 'Duzeltme',
                ];

                return [
                    'id' => $movement->id,
                    'number' => $movement->movement_number,
                    'type' => $movement->movement_type,
                    'type_label' => $typeLabels[$movement->movement_type] ?? $movement->movement_type,
                    'product' => $movement->inventoryItem->product->name ?? 'Bilinmeyen',
                    'quantity' => (int) $movement->quantity,
                    'warehouse' => $movement->warehouse->name ?? '-',
                    'date' => Carbon::parse($movement->movement_date)->format('d.m.Y H:i'),
                ];
            })
            ->toArray();
    }

    /**
     * Personel durumu
     */
    private function getStaffStatus(): array
    {
        $active = WarehouseStaff::where('status', 'active')->count();
        $inactive = WarehouseStaff::where('status', '!=', 'active')->count();

        return [
            'active' => $active,
            'inactive' => $inactive,
            'total' => $active + $inactive,
        ];
    }

    /**
     * Sayim programi (placeholder)
     */
    private function getCycleCountSchedule(): array
    {
        return [];
    }
}
