<?php

namespace App\Console\Commands;

use App\Services\MonthlyComplianceService;
use Illuminate\Console\Command;

class SendComplianceRemindersCommand extends Command
{
    protected $signature = 'compliance:send-reminders';

    protected $description = 'No-op. Automatic monthly compliance reminders were replaced by client custom reminders.';

    public function handle(MonthlyComplianceService $compliance): int
    {
        $count = $compliance->sendDueReminders();
        $this->info("Sent {$count} monthly compliance reminder(s).");

        return self::SUCCESS;
    }
}
