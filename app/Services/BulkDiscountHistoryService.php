<?php

namespace App\Services;

use App\Models\BulkDiscountHistory;
use App\Models\SalesOrder;
use Illuminate\Support\Facades\Auth;

class BulkDiscountHistoryService
{
    /**
     * Record bulk discount application
     */
    public function recordBulkDiscount(
        SalesOrder $salesOrder,
        string $discountType,
        string $discountTarget,
        string $discountTargetName,
        float $discountPercentage,
        array $affectedItems,
        float $totalDiscountAmount,
        array $discountRules = null,
        string $notes = null
    ): BulkDiscountHistory {
        return BulkDiscountHistory::create([
            'sales_order_id' => $salesOrder->id,
            'applied_by_user_id' => Auth::id(),
            'discount_type' => $discountType,
            'discount_target' => $discountTarget,
            'discount_target_name' => $discountTargetName,
            'discount_percentage' => $discountPercentage,
            'items_affected' => count($affectedItems),
            'total_discount_amount' => $totalDiscountAmount,
            'applied_items' => $this->formatAppliedItems($affectedItems),
            'discount_rules' => $discountRules,
            'notes' => $notes,
        ]);
    }

    /**
     * Format applied items for storage
     */
    private function formatAppliedItems(array $items): array
    {
        return collect($items)->map(function ($item) {
            return [
                'item_id' => $item['id'] ?? null,
                'product_id' => $item['product_id'],
                'product_name' => $item['product']['name'] ?? '',
                'product_code' => $item['product']['code'] ?? '',
                'quantity' => $item['quantity'],
                'original_unit_price' => $item['original_unit_price'] ?? $item['unit_price'],
                'discount_percentage' => $item['discount_percentage'],
                'discount_amount' => $item['discount_amount'],
                'line_savings' => ($item['discount_amount'] ?? 0) * ($item['quantity'] ?? 0),
            ];
        })->toArray();
    }

    /**
     * Get discount history for a sales order
     */
    public function getDiscountHistory(SalesOrder $salesOrder): array
    {
        return $salesOrder->bulkDiscountHistory()
            ->with('appliedByUser:id,name')
            ->get()
            ->map(function ($history) {
                return [
                    'id' => $history->id,
                    'discount_type' => $history->discount_type,
                    'discount_type_label' => $history->discount_type_label,
                    'discount_target_name' => $history->discount_target_name,
                    'discount_percentage' => $history->discount_percentage,
                    'formatted_discount_percentage' => $history->formatted_discount_percentage,
                    'items_affected' => $history->items_affected,
                    'total_discount_amount' => $history->total_discount_amount,
                    'formatted_total_discount_amount' => $history->formatted_total_discount_amount,
                    'applied_by' => $history->appliedByUser->name ?? 'Bilinmeyen',
                    'applied_at' => $history->created_at->format('d.m.Y H:i'),
                    'applied_items' => $history->applied_items,
                    'notes' => $history->notes,
                ];
            })
            ->toArray();
    }

    /**
     * Get discount summary statistics
     */
    public function getDiscountSummary(SalesOrder $salesOrder): array
    {
        $history = $salesOrder->bulkDiscountHistory;

        $totalApplications = $history->count();
        $totalSavings = $history->sum('total_discount_amount');
        $totalItemsAffected = $history->sum('items_affected');

        $typeBreakdown = $history->groupBy('discount_type')->map(function ($group, $type) {
            return [
                'type' => $type,
                'type_label' => BulkDiscountHistory::getDiscountTypes()[$type] ?? $type,
                'applications' => $group->count(),
                'total_savings' => $group->sum('total_discount_amount'),
                'items_affected' => $group->sum('items_affected'),
            ];
        })->values()->toArray();

        return [
            'total_applications' => $totalApplications,
            'total_savings' => $totalSavings,
            'total_items_affected' => $totalItemsAffected,
            'type_breakdown' => $typeBreakdown,
            'last_applied' => $history->first()?->created_at?->format('d.m.Y H:i'),
        ];
    }

    /**
     * Calculate discount impact analysis
     */
    public function getDiscountImpactAnalysis(SalesOrder $salesOrder): array
    {
        $orderSubtotal = $salesOrder->items->sum('line_total');
        $totalBulkDiscounts = $salesOrder->bulkDiscountHistory->sum('total_discount_amount');
        
        $discountPercentageOfOrder = $orderSubtotal > 0 
            ? ($totalBulkDiscounts / $orderSubtotal) * 100 
            : 0;

        $averageDiscountPerApplication = $salesOrder->bulkDiscountHistory->count() > 0
            ? $totalBulkDiscounts / $salesOrder->bulkDiscountHistory->count()
            : 0;

        $mostEffectiveDiscount = $salesOrder->bulkDiscountHistory
            ->sortByDesc('total_discount_amount')
            ->first();

        return [
            'order_subtotal' => $orderSubtotal,
            'total_bulk_discounts' => $totalBulkDiscounts,
            'discount_percentage_of_order' => round($discountPercentageOfOrder, 2),
            'average_discount_per_application' => $averageDiscountPerApplication,
            'most_effective_discount' => $mostEffectiveDiscount ? [
                'type' => $mostEffectiveDiscount->discount_type_label,
                'target' => $mostEffectiveDiscount->discount_target_name,
                'savings' => $mostEffectiveDiscount->total_discount_amount,
                'applied_at' => $mostEffectiveDiscount->created_at->format('d.m.Y H:i'),
            ] : null,
        ];
    }
}