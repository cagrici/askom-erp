<?php

namespace App\Http\Middleware;

use App\Models\LoginRedirect;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleBasedRedirect
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! auth()->check()) {
            return $next($request);
        }

        if ($request->is('/') || $request->is('dashboard')) {
            $redirectPath = LoginRedirect::getRedirectForUser(auth()->user());

            if (
                $redirectPath &&
                $redirectPath !== '/'.$request->path() &&
                ! ($redirectPath === '/dashboard' && $request->is('dashboard'))
            ) {
                return redirect($redirectPath);
            }
        }

        return $next($request);
    }
}
