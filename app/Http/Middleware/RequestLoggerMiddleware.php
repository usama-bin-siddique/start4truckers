<?php

namespace App\Http\Middleware;

use App\Models\RequestLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class RequestLoggerMiddleware
{
    private const MAX_PAYLOAD_LENGTH = 10000;

    private const SKIP_PATHS = [
        'up',
        'request-logs',
        'request-logs/*',
        'api/notifications/unread-count',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->shouldSkip($request)) {
            return $next($request);
        }

        $userIdBefore = Auth::id();
        $startTime = microtime(true);

        DB::enableQueryLog();

        $response = $next($request);

        $duration = microtime(true) - $startTime;
        $queries = DB::getQueryLog();
        DB::disableQueryLog();
        DB::flushQueryLog();

        try {
            $this->store($request, $response, $userIdBefore, $duration, $queries);
        } catch (\Throwable $e) {
            Log::error('RequestLoggerMiddleware Error: '.$e->getMessage());
        }

        return $response;
    }

    private function shouldSkip(Request $request): bool
    {
        if ($request->is(...self::SKIP_PATHS)) {
            return true;
        }

        $path = $request->path();

        return str_contains($path, '.') && ! str_starts_with($path, 'api/');
    }

    private function store(Request $request, Response $response, ?int $userIdBefore, float $duration, array $queries): void
    {
        $formattedQueries = [];
        $totalQueryTimeMs = 0;

        foreach (array_slice($queries, 0, 50) as $query) {
            $totalQueryTimeMs += $query['time'] ?? 0;
            $formattedQueries[] = [
                'query'      => $query['query'] ?? '',
                'bindings'   => $query['bindings'] ?? [],
                'time_in_ms' => $query['time'] ?? 0,
            ];
        }

        $status = $response->getStatusCode();
        $userId = $userIdBefore ?? Auth::id();

        RequestLog::create([
            'action'            => $this->resolveAction($request),
            'method'            => $request->method(),
            'url'               => $request->fullUrl(),
            'ip'                => $request->ip(),
            'user_agent'        => $request->userAgent(),
            'user_id'           => $userId,
            'request_payload'   => json_encode($this->sanitize($request->except(['_token']))),
            'response_payload'  => $this->responsePayload($response),
            'status_code'       => $status,
            'duration'          => round($duration, 4),
            'total_queries'     => count($queries),
            'db_queries'        => json_encode([
                'total_time_ms' => $totalQueryTimeMs,
                'queries'       => $formattedQueries,
            ]),
        ]);
    }

    private function resolveAction(Request $request): string
    {
        if ($request->is('login') && $request->isMethod('POST')) {
            return Auth::check() ? RequestLog::ACTION_LOGIN : RequestLog::ACTION_FAILED_LOGIN;
        }

        if ($request->is('logout')) {
            return RequestLog::ACTION_LOGOUT;
        }

        return RequestLog::ACTION_REQUEST;
    }

    private function sanitize(array $data): array
    {
        foreach ($data as $key => $value) {
            $name = strtolower((string) $key);

            if (
                in_array($name, ['password', 'password_confirmation', 'current_password', 'remember'], true)
                || str_contains($name, 'password')
                || str_contains($name, 'token')
                || str_contains($name, 'secret')
            ) {
                $data[$key] = '[REDACTED]';
                continue;
            }

            if (is_array($value)) {
                $data[$key] = $this->sanitize($value);
            }
        }

        return $data;
    }

    private function responsePayload(Response $response): ?string
    {
        if ($response->headers->get('Content-Disposition')) {
            return '[download omitted]';
        }

        $contentType = (string) $response->headers->get('Content-Type', '');

        if (str_contains($contentType, 'text/html')) {
            return '[html omitted]';
        }

        $content = $response->getContent();

        if (! is_string($content) || $content === '') {
            return null;
        }

        if (strlen($content) > self::MAX_PAYLOAD_LENGTH) {
            return substr($content, 0, self::MAX_PAYLOAD_LENGTH).'...[truncated]';
        }

        return $content;
    }
}
