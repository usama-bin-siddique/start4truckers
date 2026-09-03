<?php

namespace App\Console\Commands;

use App\Services\ClientReminderService;
use Illuminate\Console\Command;

class SendClientRemindersCommand extends Command
{
    protected $signature = 'client-reminders:send';

    protected $description = 'Notify assigned users and admins when a client custom reminder is due';

    public function handle(ClientReminderService $reminders): int
    {
        $count = $reminders->sendDue();
        $this->info("Sent {$count} client reminder(s).");

        return self::SUCCESS;
    }
}
