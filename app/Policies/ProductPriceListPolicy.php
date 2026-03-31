<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ProductPriceList;

class ProductPriceListPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('sales.price_lists.view') ||
               $user->hasRole(['admin', 'sales-manager', 'accounting']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ProductPriceList $priceList): bool
    {
        return $user->hasPermissionTo('sales.price_lists.view') ||
               $user->hasRole(['admin', 'sales-manager', 'accounting']);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('sales.price_lists.create') ||
               $user->hasRole(['admin', 'sales-manager']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ProductPriceList $priceList): bool
    {
        return $user->hasPermissionTo('sales.price_lists.edit') ||
               $user->hasRole(['admin', 'sales-manager']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ProductPriceList $priceList): bool
    {
        // Cannot delete if it has prices
        if ($priceList->prices()->count() > 0) {
            return false;
        }

        // Cannot delete default price list
        if ($priceList->is_default) {
            return false;
        }

        return $user->hasPermissionTo('sales.price_lists.delete') ||
               $user->hasRole(['admin']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ProductPriceList $priceList): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, ProductPriceList $priceList): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can manage prices for this list.
     */
    public function managePrices(User $user, ProductPriceList $priceList): bool
    {
        return $user->hasPermissionTo('sales.price_lists.manage_prices') ||
               $user->hasRole(['admin', 'sales-manager']);
    }

    /**
     * Determine whether the user can assign this list to customers.
     */
    public function assignToCustomers(User $user, ProductPriceList $priceList): bool
    {
        return $user->hasPermissionTo('sales.price_lists.edit') ||
               $user->hasRole(['admin', 'sales-manager']);
    }
}
