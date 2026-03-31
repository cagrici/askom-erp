<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductSearchService
{
    /**
     * Search products with relevance scoring and pagination.
     *
     * Relevance tiers:
     *  1. code starts with query
     *  2. exact barcode match
     *  3. code contains query
     *  4. name starts with query
     *  5. name contains query (catch-all)
     *
     * Within each tier results are sorted alphabetically by name.
     */
    private const COLLATE = 'COLLATE utf8mb4_turkish_ci';

    public function search(
        string $query,
        int $page = 1,
        int $perPage = 20,
        bool $canBeSoldOnly = false,
        array $columns = ['*'],
        array $with = []
    ): LengthAwarePaginator {
        $collate = self::COLLATE;

        $builder = Product::where('is_active', true)
            ->where(function ($q) use ($query, $collate) {
                $q->whereRaw("name {$collate} LIKE ?", ["%{$query}%"])
                  ->orWhereRaw("code {$collate} LIKE ?", ["%{$query}%"])
                  ->orWhereRaw("barcode {$collate} LIKE ?", ["%{$query}%"]);
            });

        if ($canBeSoldOnly) {
            $builder->where('can_be_sold', true);
        }

        if (!empty($with)) {
            $builder->with($with);
        }

        // Relevance-based ordering with alphabetical secondary sort
        $builder->orderByRaw("
            CASE
                WHEN code {$collate} LIKE ? THEN 1
                WHEN barcode {$collate} = ? THEN 2
                WHEN code {$collate} LIKE ? THEN 3
                WHEN name {$collate} LIKE ? THEN 4
                ELSE 5
            END ASC, name ASC
        ", [
            "{$query}%",     // code starts with query
            $query,          // exact barcode
            "%{$query}%",    // code contains query
            "{$query}%",     // name starts with query
        ]);

        return $builder->paginate($perPage, $columns, 'page', $page);
    }
}
