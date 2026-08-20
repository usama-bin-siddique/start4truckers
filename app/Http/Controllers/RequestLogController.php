<?php

namespace App\Http\Controllers;

use App\Models\RequestLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RequestLogController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->isAdmin(), 403, 'Unauthorized');

        $query = RequestLog::query()
            ->with('user:id,name,email,role')
            ->when($request->filled('method'), fn ($q) => $q->where('method', $request->method))
            ->when($request->filled('status_code'), fn ($q) => $q->where('status_code', $request->status_code))
            ->when($request->filled('action'), fn ($q) => $q->where('action', $request->action))
            ->when($request->filled('url'), fn ($q) => $q->where('url', 'like', '%'.$request->url.'%'))
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->user_id));

        $statsQuery = clone $query;

        $logs = $query->orderByDesc('id')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (RequestLog $log) => $this->summary($log));

        $total = $statsQuery->count();
        $errors = (clone $statsQuery)->where('status_code', '>=', 400)->count();

        return Inertia::render('RequestLogs/Index', [
            'logs' => $logs,
            'users' => User::query()->select('id', 'name', 'email', 'role')->orderBy('name')->get(),
            'filters' => $request->only(['method', 'status_code', 'action', 'url', 'user_id']),
            'stats' => [
                'total'        => $total,
                'errors'       => $errors,
                'logins'       => (clone $statsQuery)->where('action', RequestLog::ACTION_LOGIN)->count(),
                'logouts'      => (clone $statsQuery)->where('action', RequestLog::ACTION_LOGOUT)->count(),
                'avg_duration' => (float) ((clone $statsQuery)->avg('duration') ?? 0),
            ],
        ]);
    }

    public function show(Request $request, RequestLog $requestLog): Response
    {
        abort_unless($request->user()?->isAdmin(), 403, 'Unauthorized');

        $requestLog->load('user:id,name,email,role');
        $queries = $requestLog->decodedDbQueries();

        return Inertia::render('RequestLogs/Show', [
            'log' => [
                ...$this->summary($requestLog),
                'user_agent'       => $requestLog->user_agent,
                'request_payload'  => $requestLog->decodedRequestPayload(),
                'response_payload' => $this->prettyResponse($requestLog->response_payload),
                'db_queries'       => [
                    'total_time_ms' => $queries['total_time_ms'] ?? 0,
                    'queries'       => $queries['queries'] ?? [],
                ],
            ],
        ]);
    }

    private function summary(RequestLog $log): array
    {
        $path = parse_url((string) $log->url, PHP_URL_PATH) ?: $log->url;

        return [
            'id'            => $log->id,
            'action'        => $log->action,
            'method'        => $log->method,
            'url'           => $log->url,
            'path'          => $path,
            'ip'            => $log->ip,
            'user'          => $log->user ? [
                'id'    => $log->user->id,
                'name'  => $log->user->name,
                'email' => $log->user->email,
                'role'  => $log->user->role,
            ] : null,
            'status_code'   => $log->status_code,
            'duration'      => (float) $log->duration,
            'total_queries' => $log->total_queries,
            'created_at'    => $log->created_at?->format('M j, Y g:i:s A'),
        ];
    }

    private function prettyResponse(?string $payload): mixed
    {
        if ($payload === null || $payload === '') {
            return null;
        }

        $decoded = json_decode($payload, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : $payload;
    }
}
