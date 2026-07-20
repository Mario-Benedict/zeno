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
 * Datadog without each call site needing to pass this context manually — and
 * emits one structured completion log per request, so every request is
 * traceable in Datadog (status code, path, who, how long), not just the ones
 * that happen to throw. Without this, a request that redirects, 404s, or
 * fails validation leaves no log line at all; only unhandled exceptions did.
 *
 * The log level is chosen from the response status (5xx -> error,
 * 4xx -> warning, everything else -> info) so Datadog's status facet reflects
 * what actually happened instead of every JSON line looking identical.
 */
class LogRequestContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->header('X-Request-Id') ?: (string) Str::uuid();
        $startedAt = microtime(true);

        Log::withContext([
            'request_id' => $requestId,
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
        ]);

        $response = $next($request);

        $response->headers->set('X-Request-Id', $requestId);

        $this->logCompletedRequest($request, $response, $startedAt);

        return $response;
    }

    private function logCompletedRequest(Request $request, Response $response, float $startedAt): void
    {
        $status = $response->getStatusCode();
        $path = '/'.ltrim($request->path(), '/');
        $method = $request->method();

        $context = [
            'method' => $method,
            'path' => $path,
            'status' => $status,
            'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            'ip' => $request->ip(),
            'user_id' => $request->user()?->id,
            'user_agent' => $request->userAgent(),
        ];

        $message = "{$method} {$path} {$status}";

        match (true) {
            $status >= 500 => Log::error($message, $context),
            $status >= 400 => Log::warning($message, $context),
            default => Log::info($message, $context),
        };
    }
}
