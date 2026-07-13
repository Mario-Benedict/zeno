<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Attaches request-scoped context (request ID, user, IP) to every subsequent
 * log line for this request, so a single request can be traced end-to-end in
 * Datadog without each call site needing to pass this context manually.
 */
class LogRequestContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->header('X-Request-Id') ?: (string) Str::uuid();

        Log::withContext([
            'request_id' => $requestId,
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
        ]);

        $response = $next($request);

        $response->headers->set('X-Request-Id', $requestId);

        return $response;
    }
}
