<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @param  string  $role
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();

        // Super Admin bypass - has access to everything
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Check if user has any of the required roles (case-insensitive)
        foreach ($roles as $role) {
            if ($user->hasRole($role) || $user->hasRole(ucfirst(strtolower($role)))) {
                return $next($request);
            }
        }

        // If no roles match, check for admin variations
        if ($user->hasRole('admin')) {
            return $next($request);
        }

        abort(403, 'Access denied. You do not have the required role.');
    }
}
