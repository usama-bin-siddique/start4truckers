<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Task;
use App\Support\ClientProfile;

class MonthlyComplianceService
{
    public function __construct(
        private NotificationService $notification,
        private ActivityService $activity
    ) {}

    public function applyType(Client $client, ?string $type): void
    {
        if ($type === Client::COMPLIANCE_MONTHLY) {
            $this->enroll($client);

            return;
        }

        $this->unenroll($client, $type === Client::COMPLIANCE_PROJECT ? Client::COMPLIANCE_PROJECT : null);
    }

    public function enroll(Client $client): void
    {
        $alreadyEnrolled = $client->compliance_type === Client::COMPLIANCE_MONTHLY
            && $client->monthly_compliance_started_at
            && $client->next_compliance_due_at;

        $oldType = $client->compliance_type;

        $client->compliance_type = Client::COMPLIANCE_MONTHLY;

        if (! $client->monthly_compliance_started_at) {
            $client->monthly_compliance_started_at = now();
        }

        if (! $client->next_compliance_due_at) {
            $client->next_compliance_due_at = now()->addDays(30);
        }

        if (! in_array($client->status, [Client::STATUS_INACTIVE, Client::STATUS_COMPLETED], true)) {
            $client->status = Client::STATUS_COMPLIANCE;
        }

        $client->next_action = $client->next_action ?: 'Monthly compliance review';
        $client->next_action_due_at = $client->next_compliance_due_at;
        $client->save();

        if ($alreadyEnrolled) {
            return;
        }

        $due = $client->next_compliance_due_at->toFormattedDateString();

        $this->activity->log(
            $client,
            'compliance_changed',
            "Client converted to Monthly Compliance. Next compliance date is {$due}.",
            ['compliance_type' => $oldType],
            [
                'compliance_type'              => Client::COMPLIANCE_MONTHLY,
                'monthly_compliance_started_at' => $client->monthly_compliance_started_at?->toDateString(),
                'next_compliance_due_at'       => $client->next_compliance_due_at?->toDateString(),
            ]
        );

        $this->notification->notifyClientStakeholders($client, NotificationService::TYPE_COMPLIANCE_STARTED, [
            'client_id'     => $client->id,
            'client_name'   => $client->display_name,
            'client_number' => $client->client_number,
            'due_date'      => $client->next_compliance_due_at->toDateString(),
            'message'       => "Client {$client->display_name} is now a Monthly Compliance Client. Next compliance date is {$due}.",
        ]);
    }

    public function unenroll(Client $client, ?string $type = Client::COMPLIANCE_PROJECT): void
    {
        $oldType = $client->compliance_type;
        $leavingMonthly = $oldType === Client::COMPLIANCE_MONTHLY;

        $client->compliance_type = $type;
        $client->save();

        if ($leavingMonthly) {
            Task::query()
                ->where('client_id', $client->id)
                ->where('kind', Task::KIND_MONTHLY_COMPLIANCE)
                ->where('status', '!=', Task::STATUS_COMPLETED)
                ->get()
                ->each->delete();
        }

        if ($oldType !== $type) {
            $from = ClientProfile::complianceLabel($oldType, 'unset');
            $to = ClientProfile::complianceLabel($type, 'unset');
            $this->activity->log(
                $client,
                'compliance_changed',
                "Compliance changed from \"{$from}\" to \"{$to}\".",
                ['compliance_type' => $oldType],
                ['compliance_type' => $type]
            );
        }
    }

    public function completeCycle(Client $client, ?Task $completedTask = null): void
    {
        if ($client->compliance_type !== Client::COMPLIANCE_MONTHLY) {
            return;
        }

        $client->last_compliance_completed_at = now();
        $client->save();

        $this->activity->log(
            $client,
            'compliance_completed',
            $completedTask
                ? "Monthly compliance task \"{$completedTask->title}\" completed."
                : 'Monthly compliance completed.'
        );
    }

    public function sendDueReminders(): int
    {
        return 0;
    }
}
