<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// These run via closures (Artisan::call) instead of Schedule::command()
// because production shared hosting has proc_open disabled, and command
// events spawn a shell process (Symfony Process) per task.
Schedule::call(fn () => Artisan::call('leads:check-sla'))->everyMinute();
Schedule::call(fn () => Artisan::call('tasks:send-reminders'))->everyMinute();
Schedule::call(fn () => Artisan::call('client-reminders:send'))->everyMinute();
Schedule::call(fn () => Artisan::call('compliance:send-reminders'))->dailyAt('09:00');
