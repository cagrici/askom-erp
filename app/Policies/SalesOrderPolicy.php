<?php

namespace App\Policies;

use App\Models\SalesOrder;
use App\Models\User;

class SalesOrderPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('sales.orders.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ?SalesOrder $salesOrder = null): bool
    {
        return $user->hasPermissionTo('sales.orders.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('sales.orders.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ?SalesOrder $salesOrder = null): bool
    {
        return $user->hasPermissionTo('sales.orders.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ?SalesOrder $salesOrder = null): bool
    {
        return $user->hasPermissionTo('sales.orders.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ?SalesOrder $salesOrder = null): bool
    {
        return $user->hasPermissionTo('sales.orders.edit');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, ?SalesOrder $salesOrder = null): bool
    {
        return $user->hasPermissionTo('sales.orders.delete');
    }

    /**
     * Determine whether the user can update order status.
     */
    public function updateStatus(User $user, ?SalesOrder $salesOrder = null): bool
    {
        return $user->hasPermissionTo('sales.orders.status');
    }

    /**
     * Determine whether the user can approve orders.
     */
    public function approve(User $user, ?SalesOrder $salesOrder = null): bool
    {
        return $user->hasPermissionTo('sales.orders.approve')
            || $user->hasPermissionTo('sales.orders.status');
    }

    /**
     * Determine whether the user can generate PDF.
     */
    public function generatePdf(User $user, ?SalesOrder $salesOrder = null): bool
    {
        return $user->hasPermissionTo('sales.orders.pdf');
    }

    /**
     * Determine whether the user can send email.
     */
    public function sendEmail(User $user, ?SalesOrder $salesOrder = null): bool
    {
        return $user->hasPermissionTo('sales.orders.email');
    }

    /**
     * Determine whether the user can sync to Logo.
     */
    public function syncToLogo(User $user, ?SalesOrder $salesOrder = null): bool
    {
        return $user->hasPermissionTo('sales.orders.sync_logo');
    }

    /**
     * Determine whether the user can apply discounts.
     */
    public function applyDiscount(User $user, ?SalesOrder $salesOrder = null): bool
    {
        return $user->hasPermissionTo('sales.orders.discount');
    }
}
