<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Lead;
use App\Models\User;

class LeadIntakeService
{
    public function __construct(
        private ActivityService $activity,
        private NotificationService $notification,
        private DocumentService $documents
    ) {}

    public function createFromWebsite(array $data, array $uploads = []): Lead
    {
        $lead = Lead::create([
            'name'             => $data['name'],
            'email'            => $data['email'] ?? null,
            'date_of_birth'    => $data['date_of_birth'] ?? null,
            'phone'            => $data['phone'] ?? null,
            'state'            => $data['state'] ?? null,
            'address'          => $data['address'] ?? null,
            'ssn_itin'         => $data['ssn_itin'] ?? null,
            'company'          => $data['company'] ?? null,
            'business_name_1'  => $data['business_name_1'] ?? null,
            'business_name_2'  => $data['business_name_2'] ?? null,
            'business_name_3'  => $data['business_name_3'] ?? null,
            'state_of_formation'=> $data['state_of_formation'] ?? null,
            'business_purpose' => $data['business_purpose'] ?? null,
            'truck_type'       => $data['truck_type'] ?? null,
            'truck_vin'        => $data['truck_vin'] ?? null,
            'operation_area'   => $data['operation_area'] ?? null,
            'operation_type'   => $data['operation_type'] ?? null,
            'hear_about_us'    => $data['hear_about_us'] ?? null,
            'reference_id'     => $data['reference_id'] ?? null,
            'service_required' => $data['service_required'] ?? null,
            'notes'            => $data['notes'] ?? null,
            'meta'             => $data['meta'] ?? null,
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

        if ($uploads !== []) {
            $this->documents->storeCategoryUploads($lead, $uploads);
        }

        $recipients = User::whereIn('role', ['admin', 'manager'])
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
