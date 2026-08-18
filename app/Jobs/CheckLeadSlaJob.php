<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Services\LeadSlaService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class CheckLeadSlaJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $leadId) {}

    public function handle(LeadSlaService $sla): void
    {
        $lead = Lead::find($this->leadId);

        if ($lead) {
            $sla->breachIfExpired($lead);
        }
    }
}
