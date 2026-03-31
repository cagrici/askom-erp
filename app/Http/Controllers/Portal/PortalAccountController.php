<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PortalAccountController extends Controller
{
    /**
     * Switch to a different current account
     */
    public function switch(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:current_accounts,id',
        ]);

        $user = Auth::user();

        // Verify user has access to this account
        $hasAccess = $user->assignedAccounts()->where('current_account_id', $validated['account_id'])->exists();

        if (!$hasAccess) {
            return back()->with('error', 'Bu cari hesabına erişim yetkiniz yok.');
        }

        // Switch the account in session
        session(['selected_account_id' => $validated['account_id']]);

        return redirect()->route('portal.dashboard')
            ->with('success', 'Cari hesap değiştirildi.');
    }

    /**
     * Show account selection page for users with no assigned accounts
     */
    public function none()
    {
        return Inertia::render('Portal/NoAccount', [
            'message' => 'Hesabınıza atanmış bir cari bulunamadı.',
        ]);
    }

    /**
     * Get available accounts for current user (AJAX)
     */
    public function available()
    {
        $user = Auth::user();
        $accounts = $user->assignedAccounts()
            ->select('current_accounts.id', 'current_accounts.title', 'current_accounts.account_code')
            ->get()
            ->map(function ($account) {
                return [
                    'id' => $account->id,
                    'title' => $account->title,
                    'account_code' => $account->account_code,
                    'is_default' => $account->pivot->is_default,
                ];
            });

        return response()->json([
            'accounts' => $accounts,
            'selected_id' => session('selected_account_id'),
        ]);
    }
}
