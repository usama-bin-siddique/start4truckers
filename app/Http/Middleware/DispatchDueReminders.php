<?php

namespace App\Http\Middleware;

use App\Services\ClientReminderService;
use App\Services\TaskReminderService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class DispatchDueReminders
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        if (! Cache::add('due-reminders-dispatch', true, 55)) {
            return;
        }

        try {
            app(ClientReminderService::class)->sendDue();
            app(TaskReminderService::class)->sendDue();
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
