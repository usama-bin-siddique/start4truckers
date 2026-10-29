<?php

namespace App\Services;

use App\Mail\ClientReminderMail;
use App\Models\ClientReminder;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

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

        $stakeholderIds = $this->notification->stakeholderIds($client);
        if ($reminder->created_by && ! in_array((int) $reminder->created_by, $stakeholderIds, true)) {
            $stakeholderIds[] = (int) $reminder->created_by;
        }

        $this->notification->notifyMultiple($stakeholderIds, NotificationService::TYPE_CLIENT_REMINDER, [
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

        // Send Email notification to stakeholders + the user who created the reminder
        $stakeholders = User::query()
            ->whereIn('id', $stakeholderIds)
            ->where('is_active', true)
            ->whereNotNull('email')
            ->get();

        foreach ($stakeholders as $recipient) {
            try {
                Mail::to($recipient->email, $recipient->name)->send(
                    new ClientReminderMail($reminder, $client)
                );
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return true;
    }
}
