<?php

namespace App\Services;

use App\Jobs\CheckLeadSlaJob;
use App\Models\Activity;
use App\Models\Lead;
use App\Models\Setting;
use App\Models\User;

class LeadSlaService
{
    public function __construct(
        private ActivityService $activity,
        private NotificationService $notification
    ) {}

    public function minutes(): int
    {
        $minutes = (int) Setting::get('lead_sla_minutes', 10);

        return max(8, min(10, $minutes ?: 10));
    }

    public function markReviewedAndStart(Lead $lead): Lead
    {
        if ($lead->reviewed_at || $lead->isConverted() || $lead->isStatusLocked()) {
            return $lead;
        }

        $old = $lead->status;
        $minutes = $this->minutes();
        $now = now();

        $lead->update([
            'status'           => Lead::STATUS_REVIEWED,
            'reviewed_at'      => $now,
            'sla_started_at'   => $now,
            'sla_expires_at'   => $now->copy()->addMinutes($minutes),
            'sla_completed_at' => null,
            'sla_breached_at'  => null,
        ]);

        $this->activity->log(
            $lead,
            Activity::ACTION_STATUS_CHANGED,
            "Status changed from \"{$old}\" to \"reviewed\" on first open",
            ['status' => $old],
            ['status' => Lead::STATUS_REVIEWED]
        );

        $this->activity->log(
            $lead,
            Activity::ACTION_SLA_STARTED,
            "SLA timer started ({$minutes} minutes)"
        );

        CheckLeadSlaJob::dispatch($lead->id)->delay($lead->fresh()->sla_expires_at);

        return $lead->fresh(['assignedUser', 'convertedByUser', 'client.assignedUser', 'activities.causer', 'documents.uploadedBy', 'invoices.createdBy']);
    }

    public function complete(Lead $lead, string $via): void
    {
        if (! $lead->sla_started_at || $lead->sla_completed_at || $lead->sla_breached_at) {
            return;
        }

        $lead->update(['sla_completed_at' => now()]);

        $this->activity->log(
            $lead,
            Activity::ACTION_SLA_MET,
            "SLA met via {$via}"
        );
    }

    public function breachIfExpired(Lead $lead): bool
    {
        $lead->refresh();

        if (
            ! $lead->sla_expires_at
            || $lead->sla_completed_at
            || $lead->sla_breached_at
            || $lead->sla_expires_at->isFuture()
        ) {
            return false;
        }

        $lead->update(['sla_breached_at' => now()]);

        $this->activity->log(
            $lead,
            Activity::ACTION_SLA_BREACHED,
            'SLA expired with no call, note, follow-up, status update, or invoice'
        );

        $admins = User::where('role', 'admin')->where('is_active', true)->pluck('id')->all();

        $this->notification->notifyMultiple($admins, NotificationService::TYPE_SLA_BREACHED, [
            'lead_id'   => $lead->id,
            'lead_name' => $lead->name,
            'message'   => "SLA missed for lead {$lead->name}. No action was taken in time.",
        ]);

        return true;
    }

    public function checkExpired(): int
    {
        $leads = Lead::query()
            ->whereNotNull('sla_expires_at')
            ->whereNull('sla_completed_at')
            ->whereNull('sla_breached_at')
            ->where('sla_expires_at', '<=', now())
            ->get();

        $count = 0;
        foreach ($leads as $lead) {
            if ($this->breachIfExpired($lead)) {
                $count++;
            }
        }

        return $count;
    }
}
