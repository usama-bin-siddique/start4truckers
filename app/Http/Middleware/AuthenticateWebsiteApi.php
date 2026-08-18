<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateWebsiteApi
{
    public function handle(Request $request, Closure $next): Response
    {
        $configured = Setting::get('website_api_key');

        if (! is_string($configured) || $configured === '') {
            return response()->json([
                'message' => 'Website lead API is not configured.',
            ], 503);
        }

        $incoming = $request->bearerToken()
            ?? $request->header('X-API-Key')
            ?? $request->input('api_key');

        if (! is_string($incoming) || ! hash_equals($configured, $incoming)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}
