<?php

namespace App\Http\Middleware;

use App\Services\ClientReminderService;
use App\Services\TaskReminderService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DispatchDueReminders
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            app(ClientReminderService::class)->sendDue();
            app(TaskReminderService::class)->sendDue();
        } catch (\Throwable $e) {
            report($e);
        }

        return $next($request);
    }
}
