<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && isset($user->is_active) && !$user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated. Please contact an administrator.',
            ], 403);
        }

        return $next($request);
    }
}