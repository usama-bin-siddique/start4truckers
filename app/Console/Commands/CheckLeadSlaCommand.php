<?php

namespace App\Console\Commands;

use App\Services\LeadSlaService;
use Illuminate\Console\Command;

class CheckLeadSlaCommand extends Command
{
    protected $signature = 'leads:check-sla';

    protected $description = 'Notify admins when a reviewed lead SLA expires without action';

    public function handle(LeadSlaService $sla): int
    {
        $count = $sla->checkExpired();
        $this->info("Breached {$count} lead SLA(s).");

        return self::SUCCESS;
    }
}
