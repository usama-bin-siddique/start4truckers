<?php

namespace App\Console\Commands;

use App\Services\TaskReminderService;
use Illuminate\Console\Command;

class SendTaskRemindersCommand extends Command
{
    protected $signature = 'tasks:send-reminders';

    protected $description = 'Notify assignees when a task reminder or deadline is due';

    public function handle(TaskReminderService $reminders): int
    {
        $count = $reminders->sendDue();
        $this->info("Sent {$count} task reminder(s).");

        return self::SUCCESS;
    }
}
