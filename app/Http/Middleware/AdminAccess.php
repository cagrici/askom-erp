<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminAccess
{
    /**
     * Handle an incoming request.
     * Only allows admin and super admin roles to access admin section.
     * Specifically denies sales_manager and other non-admin roles.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();

        // Super Admin has access to everything
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Check if user has admin role (various formats)
        $adminRoles = ['admin', 'Admin', 'yonetim', 'Yönetim', 'Yonetim'];
        foreach ($adminRoles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        // All other roles (including sales_manager) are denied
        abort(403, 'Bu bölüme erişim yetkiniz bulunmamaktadır.');
    }
}
