<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductPriceList;
use App\Models\ProductPrice;
use App\Models\CurrentAccount;
use Carbon\Carbon;

class PricingService
{
    /**
     * Get the best price for a product based on customer and quantity
     */
    public function getBestPrice(
        Product $product, 
        float $quantity = 1, 
        ?CurrentAccount $customer = null,
        ?string $currency = null,
        ?Carbon $date = null
    ): array {
        $date = $date ?: now();
        $currency = $currency ?: 'TRY';

        // 1. Get applicable price lists for customer
        $priceLists = $this->getApplicablePriceLists($customer, $currency, $date);

        // 2. Find best price from price lists
        $bestPrice = $this->findBestPriceFromLists($product, $quantity, $priceLists);

        // 3. Fallback to product's default sale price
        if (!$bestPrice) {
            return [
                'price' => $product->sale_price,
                'original_price' => $product->sale_price,
                'discount_percentage' => 0,
                'discount_amount' => 0,
                'price_list' => null,
                'source' => 'default'
            ];
        }

        return [
            'price' => $bestPrice['final_price'],
            'original_price' => $bestPrice['base_price'],
            'discount_percentage' => $bestPrice['discount_percentage'] ?? 0,
            'discount_amount' => $bestPrice['discount_amount'] ?? 0,
            'price_list' => $bestPrice['price_list'],
            'min_quantity' => $bestPrice['min_quantity'],
            'source' => 'price_list'
        ];
    }

    /**
     * Get multiple product prices efficiently
     */
    public function getMultipleProductPrices(
        array $productIds,
        float $quantity = 1,
        ?CurrentAccount $customer = null,
        ?string $currency = null,
        ?Carbon $date = null
    ): array {
        $date = $date ?: now();
        $currency = $currency ?: 'TRY';
        
        // Get applicable price lists
        $priceLists = $this->getApplicablePriceLists($customer, $currency, $date);
        $priceListIds = $priceLists->pluck('id')->toArray();

        // Bulk load products and their prices
        $products = Product::whereIn('id', $productIds)->get();
        
        $productPrices = ProductPrice::whereIn('product_id', $productIds)
            ->whereIn('price_list_id', $priceListIds)
            ->where('min_quantity', '<=', $quantity)
            ->with('priceList')
            ->get()
            ->groupBy('product_id');

        $results = [];
        
        foreach ($products as $product) {
            $prices = $productPrices->get($product->id, collect());
            $bestPrice = $this->findBestPriceFromPrices($prices, $quantity);
            
            if ($bestPrice) {
                $results[$product->id] = [
                    'price' => $bestPrice['final_price'],
                    'original_price' => $bestPrice['base_price'],
                    'discount_percentage' => $bestPrice['discount_percentage'] ?? 0,
                    'discount_amount' => $bestPrice['discount_amount'] ?? 0,
                    'price_list' => $bestPrice['price_list'],
                    'source' => 'price_list'
                ];
            } else {
                $results[$product->id] = [
                    'price' => $product->sale_price,
                    'original_price' => $product->sale_price,
                    'discount_percentage' => 0,
                    'discount_amount' => 0,
                    'price_list' => null,
                    'source' => 'default'
                ];
            }
        }

        return $results;
    }

    /**
     * Get applicable price lists for a customer
     */
    protected function getApplicablePriceLists(
        ?CurrentAccount $customer = null,
        string $currency = 'TRY',
        Carbon $date = null
    ) {
        $query = ProductPriceList::active()
            ->valid()
            ->where('currency', $currency)
            ->where('type', 'sale');

        // If customer exists, filter by customer groups
        if ($customer && $customer->customer_segment) {
            $query->where(function ($q) use ($customer) {
                $q->whereNull('customer_groups')
                  ->orWhereJsonContains('customer_groups', $customer->customer_segment);
            });
        }

        return $query->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Find best price from price lists
     */
    protected function findBestPriceFromLists(Product $product, float $quantity, $priceLists): ?array
    {
        $prices = ProductPrice::where('product_id', $product->id)
            ->whereIn('price_list_id', $priceLists->pluck('id'))
            ->where('min_quantity', '<=', $quantity)
            ->with('priceList')
            ->get();

        return $this->findBestPriceFromPrices($prices, $quantity);
    }

    /**
     * Find best price from a collection of prices
     */
    protected function findBestPriceFromPrices($prices, float $quantity): ?array
    {
        if ($prices->isEmpty()) {
            return null;
        }

        $bestPrice = null;
        $bestFinalPrice = PHP_FLOAT_MAX;

        foreach ($prices as $price) {
            if (!$price->appliesTo($quantity)) {
                continue;
            }

            $finalPrice = $price->getFinalPrice();
            
            if ($finalPrice < $bestFinalPrice) {
                $bestFinalPrice = $finalPrice;
                $bestPrice = [
                    'base_price' => $price->price,
                    'final_price' => $finalPrice,
                    'discount_percentage' => $price->discount_percentage,
                    'discount_amount' => $price->discount_amount,
                    'min_quantity' => $price->min_quantity,
                    'price_list' => $price->priceList
                ];
            }
        }

        return $bestPrice;
    }

    /**
     * Get quantity-based pricing tiers for a product
     */
    public function getQuantityTiers(
        Product $product,
        ?CurrentAccount $customer = null,
        ?string $currency = null
    ): array {
        $currency = $currency ?: 'TRY';
        $priceLists = $this->getApplicablePriceLists($customer, $currency);
        
        $prices = ProductPrice::where('product_id', $product->id)
            ->whereIn('price_list_id', $priceLists->pluck('id'))
            ->with('priceList')
            ->orderBy('min_quantity')
            ->get();

        $tiers = [];
        foreach ($prices as $price) {
            $tiers[] = [
                'min_quantity' => $price->min_quantity,
                'price' => $price->getFinalPrice(),
                'original_price' => $price->price,
                'discount_percentage' => $price->discount_percentage,
                'discount_amount' => $price->discount_amount,
                'price_list' => $price->priceList->name
            ];
        }

        // Add default price if no tiers exist
        if (empty($tiers)) {
            $tiers[] = [
                'min_quantity' => 1,
                'price' => $product->sale_price,
                'original_price' => $product->sale_price,
                'discount_percentage' => 0,
                'discount_amount' => 0,
                'price_list' => 'Varsayılan'
            ];
        }

        return $tiers;
    }

    /**
     * Check if customer has special pricing
     */
    public function hasSpecialPricing(Product $product, ?CurrentAccount $customer = null): bool
    {
        if (!$customer) {
            return false;
        }

        $priceLists = $this->getApplicablePriceLists($customer);
        
        return ProductPrice::where('product_id', $product->id)
            ->whereIn('price_list_id', $priceLists->pluck('id'))
            ->exists();
    }

    /**
     * Get pricing summary for reporting
     */
    public function getPricingSummary(Product $product): array
    {
        $defaultPrice = $product->sale_price;
        
        $prices = ProductPrice::where('product_id', $product->id)
            ->with('priceList')
            ->get();

        $summary = [
            'default_price' => $defaultPrice,
            'has_special_pricing' => $prices->isNotEmpty(),
            'price_lists_count' => $prices->groupBy('price_list_id')->count(),
            'lowest_price' => $defaultPrice,
            'highest_price' => $defaultPrice,
            'quantity_tiers' => $prices->groupBy('min_quantity')->count()
        ];

        if ($prices->isNotEmpty()) {
            $finalPrices = $prices->map(fn($p) => $p->getFinalPrice());
            $summary['lowest_price'] = min($defaultPrice, $finalPrices->min());
            $summary['highest_price'] = max($defaultPrice, $finalPrices->max());
        }

        return $summary;
    }
}