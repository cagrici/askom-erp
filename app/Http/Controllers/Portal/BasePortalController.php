<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\CurrentAccount;
use Illuminate\Support\Facades\Auth;

class BasePortalController extends Controller
{
    /**
     * Get the currently selected account for the authenticated user
     *
     * @return CurrentAccount|null
     */
    protected function getSelectedAccount(): ?CurrentAccount
    {
        $selectedAccountId = session('selected_account_id');

        if (!$selectedAccountId) {
            return null;
        }

        // Get the account and verify access
        $account = Auth::user()
            ->assignedAccounts()
            ->where('current_account_id', $selectedAccountId)
            ->first();

        return $account;
    }

    /**
     * Get the selected account ID
     *
     * @return int|null
     */
    protected function getSelectedAccountId(): ?int
    {
        return session('selected_account_id');
    }

    /**
     * Get all assigned accounts for the current user
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    protected function getAssignedAccounts()
    {
        return Auth::user()->assignedAccounts;
    }

    /**
     * Verify the current user has access to a specific account
     *
     * @param int $accountId
     * @return bool
     */
    protected function hasAccountAccess(int $accountId): bool
    {
        return Auth::user()
            ->assignedAccounts()
            ->where('current_account_id', $accountId)
            ->exists();
    }
}
