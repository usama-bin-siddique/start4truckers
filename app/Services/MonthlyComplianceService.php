<?php

namespace App\Services;

use App\Models\Activity;
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

        $this->ensureOpenTask($client);

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
        $client->next_compliance_due_at = now()->addDays(30);
        $client->compliance_reminder_sent_for = null;
        $client->next_action = 'Monthly compliance review';
        $client->next_action_due_at = $client->next_compliance_due_at;
        $client->save();

        $this->ensureOpenTask($client);

        $due = $client->next_compliance_due_at->toFormattedDateString();

        $this->activity->log(
            $client,
            'compliance_completed',
            $completedTask
                ? "Monthly compliance task \"{$completedTask->title}\" completed. Next compliance date is {$due}."
                : "Monthly compliance completed. Next compliance date is {$due}."
        );

        $this->notification->notifyClientStakeholders($client, NotificationService::TYPE_COMPLIANCE_STARTED, [
            'client_id'     => $client->id,
            'client_name'   => $client->display_name,
            'client_number' => $client->client_number,
            'due_date'      => $client->next_compliance_due_at->toDateString(),
            'message'       => "Monthly compliance completed for {$client->display_name}. Next compliance date is {$due}.",
        ]);
    }

    public function sendDueReminders(): int
    {
        $clients = Client::query()
            ->where('compliance_type', Client::COMPLIANCE_MONTHLY)
            ->whereNotNull('next_compliance_due_at')
            ->whereDate('next_compliance_due_at', '<=', now())
            ->get()
            ->filter(function (Client $client) {
                return $client->compliance_reminder_sent_for?->toDateString()
                    !== $client->next_compliance_due_at?->toDateString();
            });

        $count = 0;

        foreach ($clients as $client) {
            $this->ensureOpenTask($client);

            $this->notification->notifyClientStakeholders($client, NotificationService::TYPE_COMPLIANCE_DUE, [
                'client_id'     => $client->id,
                'client_name'   => $client->display_name,
                'client_number' => $client->client_number,
                'due_date'      => $client->next_compliance_due_at?->toDateString(),
                'message'       => "Client {$client->display_name} has a compliance task due.",
            ]);

            $client->update([
                'compliance_reminder_sent_for' => $client->next_compliance_due_at,
            ]);

            Task::query()
                ->where('client_id', $client->id)
                ->where('kind', Task::KIND_MONTHLY_COMPLIANCE)
                ->where('status', '!=', Task::STATUS_COMPLETED)
                ->update(['reminder_sent_at' => now()]);

            $count++;
        }

        return $count;
    }

    public function ensureOpenTask(Client $client): Task
    {
        $due = $client->next_compliance_due_at?->copy()->startOfDay() ?? now()->addDays(30)->startOfDay();

        $existing = Task::query()
            ->where('client_id', $client->id)
            ->where('kind', Task::KIND_MONTHLY_COMPLIANCE)
            ->where('status', '!=', Task::STATUS_COMPLETED)
            ->latest()
            ->first();

        if ($existing) {
            $existing->update([
                'due_date'         => $due,
                'reminder_at'      => $due,
                'assigned_to'      => $existing->assigned_to ?: $client->assigned_to,
            ]);

            return $existing->fresh();
        }

        $task = Task::create([
            'client_id'    => $client->id,
            'title'        => 'Monthly compliance — '.$client->display_name,
            'description'  => 'Complete the monthly compliance review for this client. Completing this task schedules the next 30-day reminder automatically.',
            'assigned_to'  => $client->assigned_to,
            'created_by'   => $client->assigned_to,
            'priority'     => Task::PRIORITY_HIGH,
            'status'       => Task::STATUS_PENDING,
            'kind'         => Task::KIND_MONTHLY_COMPLIANCE,
            'due_date'     => $due,
            'reminder_at'  => $due,
        ]);

        $this->activity->log(
            $client,
            Activity::ACTION_TASK_CREATED,
            "Automatic monthly compliance reminder created for {$due->toFormattedDateString()}."
        );

        return $task;
    }
}
