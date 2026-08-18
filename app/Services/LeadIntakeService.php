<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Lead;
use App\Models\User;

class LeadIntakeService
{
    public function __construct(
        private ActivityService $activity,
        private NotificationService $notification
    ) {}

    public function createFromWebsite(array $data): Lead
    {
        $lead = Lead::create([
            'name'             => $data['name'],
            'email'            => $data['email'] ?? null,
            'phone'            => $data['phone'] ?? null,
            'state'            => $data['state'] ?? null,
            'company'          => $data['company'] ?? null,
            'service_required' => $data['service_required'] ?? null,
            'notes'            => $data['notes'] ?? null,
            'source'           => 'website',
            'status'           => Lead::STATUS_NEW,
        ]);

        $this->activity->log(
            $lead,
            Activity::ACTION_LEAD_CREATED,
            'Lead created from website form submission',
            null,
            null,
            null
        );

        $recipients = User::whereIn('role', ['admin', 'sales'])
            ->where('is_active', true)
            ->pluck('id')
            ->all();

        $this->notification->notifyMultiple($recipients, NotificationService::TYPE_NEW_LEAD, [
            'lead_id'   => $lead->id,
            'lead_name' => $lead->name,
            'source'    => 'website',
        ]);

        return $lead;
    }
}
