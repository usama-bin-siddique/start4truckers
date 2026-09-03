<?php

namespace App\Services;

use App\Models\ClientReminder;

class ClientReminderService
{
    public function __construct(private NotificationService $notification) {}

    public function sendDue(): int
    {
        $reminders = ClientReminder::query()
            ->with('client')
            ->whereNull('notified_at')
            ->where('remind_at', '<=', now())
            ->get();

        $count = 0;

        foreach ($reminders as $reminder) {
            if ($this->notify($reminder)) {
                $count++;
            }
        }

        return $count;
    }

    public function notify(ClientReminder $reminder): bool
    {
        $client = $reminder->client;

        if (! $client) {
            $reminder->update(['notified_at' => now()]);

            return false;
        }

        $when = $reminder->remind_at?->format('M j, Y g:i A');

        $this->notification->notifyClientStakeholders($client, NotificationService::TYPE_CLIENT_REMINDER, [
            'client_id'     => $client->id,
            'client_name'   => $client->display_name,
            'client_number' => $client->client_number,
            'reminder_id'   => $reminder->id,
            'remind_at'     => $when,
            'description'   => $reminder->description,
            'message'       => $when
                ? "Reminder for {$client->display_name}: {$reminder->description} ({$when})"
                : "Reminder for {$client->display_name}: {$reminder->description}",
        ]);

        $reminder->update(['notified_at' => now()]);

        return true;
    }
}
