<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SelectCurrentAccount
{
    /**
     * Handle an incoming request.
     *
     * Ensures the user has a selected current account for portal operations.
     * If no account is selected and user has assigned accounts, selects the default or first one.
     * If user has no assigned accounts, redirects to account selection page.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user) {
            return $next($request);
        }

        // Skip middleware for account switching routes
        if ($request->routeIs('portal.account.*')) {
            return $next($request);
        }

        // Check if user has a selected account in session
        $selectedAccountId = session('selected_account_id');

        // If no selected account, try to auto-select
        if (!$selectedAccountId) {
            $assignedAccounts = $user->assignedAccounts;

            if ($assignedAccounts->isEmpty()) {
                // User has no assigned accounts - redirect to error page or account request
                return redirect()->route('portal.account.none')
                    ->with('error', 'Hesabınıza atanmış bir cari bulunamadı. Lütfen yöneticinizle iletişime geçin.');
            }

            // Auto-select default account or first account
            $defaultAccount = $assignedAccounts->firstWhere('pivot.is_default', true);
            $accountToSelect = $defaultAccount ?? $assignedAccounts->first();

            session(['selected_account_id' => $accountToSelect->id]);
            $selectedAccountId = $accountToSelect->id;
        }

        // Verify user has access to the selected account
        $hasAccess = $user->assignedAccounts()->where('current_account_id', $selectedAccountId)->exists();

        if (!$hasAccess) {
            // Selected account is not valid - reset and redirect
            session()->forget('selected_account_id');

            return redirect()->route('portal.dashboard')
                ->with('error', 'Seçili cari hesabına erişim yetkiniz yok.');
        }

        // Share selected account ID with all views
        view()->share('selectedAccountId', $selectedAccountId);

        return $next($request);
    }
}
