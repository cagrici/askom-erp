<?php

namespace App\Services;

use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\InventoryMovement;
use App\Models\InventoryItem;
use App\Models\InventoryStock;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class InventoryService
{
    /**
     * Check if all items in sales order have sufficient stock
     */
    public function checkStockAvailability(SalesOrder $salesOrder): array
    {
        $results = [];
        $allAvailable = true;

        foreach ($salesOrder->items as $item) {
            $product = $item->product;
            $requestedQuantity = $item->quantity;
            $availableStock = $product->stock_quantity;

            $isAvailable = !$product->track_inventory || 
                          $product->allow_backorder || 
                          $availableStock >= $requestedQuantity;

            $results[] = [
                'item_id' => $item->id,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'product_code' => $product->code,
                'requested_quantity' => $requestedQuantity,
                'available_stock' => $availableStock,
                'is_available' => $isAvailable,
                'track_inventory' => $product->track_inventory,
                'allow_backorder' => $product->allow_backorder,
                'shortage' => max(0, $requestedQuantity - $availableStock)
            ];

            if (!$isAvailable) {
                $allAvailable = false;
            }
        }

        return [
            'all_available' => $allAvailable,
            'items' => $results
        ];
    }

    /**
     * Reserve stock for sales order items
     */
    public function reserveStock(SalesOrder $salesOrder): bool
    {
        try {
            DB::beginTransaction();

            foreach ($salesOrder->items as $item) {
                $product = $item->product;

                if (!$product->track_inventory) {
                    continue; // Skip products that don't track inventory
                }

                // Check if there's enough stock
                if (!$product->allow_backorder && $product->stock_quantity < $item->quantity) {
                    throw new \Exception("Insufficient stock for product: {$product->name}. Available: {$product->stock_quantity}, Required: {$item->quantity}");
                }

                // Update inventory_stocks.quantity_reserved
                $this->updateInventoryStockReservation($product->id, $item->quantity, 'reserve');

                // Create inventory movement record
                $this->createInventoryMovement([
                    'movement_type' => 'sales_order_reserve',
                    'direction' => 'out',
                    'product_id' => $product->id,
                    'quantity' => $item->quantity,
                    'reference_type' => 'sales_order',
                    'reference_id' => $salesOrder->id,
                    'reference_number' => $salesOrder->order_number,
                    'notes' => "Stock reserved for sales order {$salesOrder->order_number}",
                    'movement_date' => now(),
                    'created_by_id' => auth()->id()
                ]);

                Log::info("Stock reserved", [
                    'product_id' => $product->id,
                    'quantity' => $item->quantity,
                    'sales_order' => $salesOrder->order_number
                ]);
            }

            DB::commit();
            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Stock reservation failed", [
                'sales_order_id' => $salesOrder->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Release reserved stock (when order is cancelled)
     */
    public function releaseStock(SalesOrder $salesOrder): bool
    {
        try {
            DB::beginTransaction();

            foreach ($salesOrder->items as $item) {
                $product = $item->product;

                if (!$product->track_inventory) {
                    continue;
                }

                // Release reservation in inventory_stocks
                $this->updateInventoryStockReservation($product->id, $item->quantity, 'release');

                // Create inventory movement record for stock release
                $this->createInventoryMovement([
                    'movement_type' => 'sales_order_release',
                    'direction' => 'in',
                    'product_id' => $product->id,
                    'quantity' => $item->quantity,
                    'reference_type' => 'sales_order',
                    'reference_id' => $salesOrder->id,
                    'reference_number' => $salesOrder->order_number,
                    'notes' => "Stock released from cancelled sales order {$salesOrder->order_number}",
                    'movement_date' => now(),
                    'created_by_id' => auth()->id()
                ]);

                Log::info("Stock released", [
                    'product_id' => $product->id,
                    'quantity' => $item->quantity,
                    'sales_order' => $salesOrder->order_number
                ]);
            }

            DB::commit();
            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Stock release failed", [
                'sales_order_id' => $salesOrder->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Commit stock (when order is shipped/delivered)
     */
    public function commitStock(SalesOrder $salesOrder): bool
    {
        try {
            DB::beginTransaction();

            foreach ($salesOrder->items as $item) {
                $product = $item->product;

                if (!$product->track_inventory) {
                    continue;
                }

                // Update inventory_stocks: reduce on_hand, clear reservation
                $this->updateInventoryStockOnCommit($product->id, $item->quantity);

                // Reduce actual stock quantity on product
                $product->decrement('stock_quantity', $item->quantity);

                // Create inventory movement record
                $this->createInventoryMovement([
                    'movement_type' => 'sales_order_shipment',
                    'direction' => 'out',
                    'product_id' => $product->id,
                    'quantity' => $item->quantity,
                    'reference_type' => 'sales_order',
                    'reference_id' => $salesOrder->id,
                    'reference_number' => $salesOrder->order_number,
                    'notes' => "Stock shipped for sales order {$salesOrder->order_number}",
                    'movement_date' => now(),
                    'created_by_id' => auth()->id(),
                    'unit_cost' => $product->cost_price,
                    'total_cost' => $product->cost_price * $item->quantity
                ]);

                Log::info("Stock committed", [
                    'product_id' => $product->id,
                    'quantity' => $item->quantity,
                    'remaining_stock' => $product->stock_quantity,
                    'sales_order' => $salesOrder->order_number
                ]);
            }

            DB::commit();
            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Stock commit failed", [
                'sales_order_id' => $salesOrder->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Handle stock return (when order is returned)
     */
    public function returnStock(SalesOrder $salesOrder): bool
    {
        try {
            DB::beginTransaction();

            foreach ($salesOrder->items as $item) {
                $product = $item->product;

                if (!$product->track_inventory) {
                    continue;
                }

                // Update inventory_stocks: increase on_hand
                $this->updateInventoryStockOnReturn($product->id, $item->quantity);

                // Increase stock quantity back on product
                $product->increment('stock_quantity', $item->quantity);

                // Create inventory movement record
                $this->createInventoryMovement([
                    'movement_type' => 'sales_order_return',
                    'direction' => 'in',
                    'product_id' => $product->id,
                    'quantity' => $item->quantity,
                    'reference_type' => 'sales_order',
                    'reference_id' => $salesOrder->id,
                    'reference_number' => $salesOrder->order_number,
                    'notes' => "Stock returned from sales order {$salesOrder->order_number}",
                    'movement_date' => now(),
                    'created_by_id' => auth()->id()
                ]);

                Log::info("Stock returned", [
                    'product_id' => $product->id,
                    'quantity' => $item->quantity,
                    'current_stock' => $product->stock_quantity,
                    'sales_order' => $salesOrder->order_number
                ]);
            }

            DB::commit();
            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Stock return failed", [
                'sales_order_id' => $salesOrder->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Create inventory movement record
     */
    private function createInventoryMovement(array $data): InventoryMovement
    {
        // Generate movement number
        $data['movement_number'] = $this->generateMovementNumber($data['movement_type']);
        
        // Set default values
        $data['effective_date'] = $data['movement_date'];
        $data['cost_currency'] = $data['cost_currency'] ?? 'TRY';
        
        return InventoryMovement::create($data);
    }

    /**
     * Generate movement number
     */
    private function generateMovementNumber(string $type): string
    {
        $prefix = match($type) {
            'sales_order_reserve' => 'RSV',
            'sales_order_release' => 'REL',
            'sales_order_shipment' => 'SHP',
            'sales_order_return' => 'RET',
            default => 'MOV'
        };

        $year = Carbon::now()->year;
        $date = Carbon::now()->format('md');
        
        $lastNumber = InventoryMovement::where('movement_number', 'like', "{$prefix}-{$year}{$date}%")
            ->orderBy('id', 'desc')
            ->first();
            
        $sequence = $lastNumber ? 
            intval(substr($lastNumber->movement_number, -4)) + 1 : 1;
            
        return "{$prefix}-{$year}{$date}" . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get low stock products
     */
    public function getLowStockProducts(): array
    {
        return Product::where('track_inventory', true)
            ->where('is_active', true)
            ->whereColumn('stock_quantity', '<=', 'min_stock_level')
            ->with(['category', 'brand'])
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'code' => $product->code,
                    'name' => $product->name,
                    'current_stock' => $product->stock_quantity,
                    'min_level' => $product->min_stock_level,
                    'shortage' => max(0, $product->min_stock_level - $product->stock_quantity),
                    'category' => $product->category->name ?? null,
                    'brand' => $product->brand->name ?? null
                ];
            })
            ->toArray();
    }

    /**
     * Update inventory stock reservation
     *
     * @param int $productId
     * @param float $quantity
     * @param string $action 'reserve' or 'release'
     */
    protected function updateInventoryStockReservation(int $productId, float $quantity, string $action): void
    {
        $inventoryItem = InventoryItem::where('product_id', $productId)->first();

        if (!$inventoryItem) {
            Log::warning("No inventory item found for product {$productId}, skipping inventory_stocks update");
            return;
        }

        // Get the default warehouse or first available
        $warehouse = Warehouse::where('is_default', true)->first() ?? Warehouse::first();

        if (!$warehouse) {
            Log::warning("No warehouse found, skipping inventory_stocks update");
            return;
        }

        $inventoryStock = InventoryStock::where('inventory_item_id', $inventoryItem->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();

        if (!$inventoryStock) {
            Log::warning("No inventory stock found for item {$inventoryItem->id} in warehouse {$warehouse->id}");
            return;
        }

        if ($action === 'reserve') {
            $inventoryStock->increment('quantity_reserved', $quantity);
            $inventoryStock->decrement('quantity_available', $quantity);
        } else { // release
            $inventoryStock->decrement('quantity_reserved', max(0, $quantity));
            $inventoryStock->increment('quantity_available', $quantity);
        }
    }

    /**
     * Update inventory stock when order is committed (shipped)
     */
    protected function updateInventoryStockOnCommit(int $productId, float $quantity): void
    {
        $inventoryItem = InventoryItem::where('product_id', $productId)->first();

        if (!$inventoryItem) {
            return;
        }

        $warehouse = Warehouse::where('is_default', true)->first() ?? Warehouse::first();

        if (!$warehouse) {
            return;
        }

        $inventoryStock = InventoryStock::where('inventory_item_id', $inventoryItem->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();

        if (!$inventoryStock) {
            return;
        }

        // Reduce on_hand, clear reservation (if was reserved)
        $inventoryStock->decrement('quantity_on_hand', $quantity);

        // If there was a reservation, release it
        if ($inventoryStock->quantity_reserved > 0) {
            $releaseQty = min($inventoryStock->quantity_reserved, $quantity);
            $inventoryStock->decrement('quantity_reserved', $releaseQty);
        }

        // Recalculate available
        $inventoryStock->quantity_available = max(0, $inventoryStock->quantity_on_hand - $inventoryStock->quantity_reserved);
        $inventoryStock->save();
    }

    /**
     * Update inventory stock when order is returned
     */
    protected function updateInventoryStockOnReturn(int $productId, float $quantity): void
    {
        $inventoryItem = InventoryItem::where('product_id', $productId)->first();

        if (!$inventoryItem) {
            return;
        }

        $warehouse = Warehouse::where('is_default', true)->first() ?? Warehouse::first();

        if (!$warehouse) {
            return;
        }

        $inventoryStock = InventoryStock::where('inventory_item_id', $inventoryItem->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();

        if ($inventoryStock) {
            // Increase on_hand and available
            $inventoryStock->increment('quantity_on_hand', $quantity);
            $inventoryStock->increment('quantity_available', $quantity);
        } else {
            // Create new stock record
            InventoryStock::create([
                'inventory_item_id' => $inventoryItem->id,
                'warehouse_id' => $warehouse->id,
                'quantity_on_hand' => $quantity,
                'quantity_available' => $quantity,
                'quantity_reserved' => 0,
                'status' => 'active',
            ]);
        }
    }
}