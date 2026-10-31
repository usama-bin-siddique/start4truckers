<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Client;
use App\Models\ClientReminder;
use App\Support\UserTime;
use App\Services\ActivityService;
use App\Services\ClientReminderService;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ClientReminderController extends Controller
{
    public function __construct(
        private ActivityService $activity,
        private NotificationService $notification,
        private ClientReminderService $reminderService
    ) {}

    public function store(Request $request, Client $client): RedirectResponse
    {
        $this->authorize('update', $client);

        $data = $request->validate([
            'reminders'                 => ['required', 'array', 'min:1', 'max:'.ClientReminder::MAX_PER_BATCH],
            'reminders.*.date'          => ['required', 'date'],
            'reminders.*.time'          => ['required', 'string', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'reminders.*.description'   => ['required', 'string', 'max:2000'],
            'reminders.*.timezone'      => ['nullable', 'timezone'],
            'reminders.*.tz_offset'     => ['nullable', 'numeric'],
        ]);

        $created = 0;

        foreach ($data['reminders'] as $row) {
            $timezone = $row['timezone'] ?? UserTime::zone($request);
            $remindAt = UserTime::parse(
                trim($row['date'].' '.$row['time']),
                $timezone,
                isset($row['tz_offset']) ? (int) $row['tz_offset'] : null,
            );

            if (! $remindAt) {
                throw ValidationException::withMessages([
                    'reminders' => 'Each reminder needs a valid date and time.',
                ]);
            }

            $reminder = $client->reminders()->create([
                'remind_at'   => $remindAt,
                'timezone'    => $this->rememberedTimezone($timezone, isset($row['tz_offset']) ? (int) $row['tz_offset'] : null),
                'description' => trim($row['description']),
                'created_by'  => Auth::id(),
            ]);

            $this->activity->log(
                $client,
                Activity::ACTION_REMINDER_CREATED,
                "Custom reminder set for {$reminder->remind_at->format('M j, Y g:i A')}: {$reminder->description}"
            );

            // If the reminder date/time is set for right now or in the past, trigger it immediately!
            if ($reminder->remind_at->lte(now())) {
                $this->reminderService->notify($reminder);
            } else {
                // Also send an instant confirmation push that reminder was scheduled
                $whenStr = $reminder->remind_at->format('M j, Y g:i A');
                $this->notification->notify(Auth::id(), NotificationService::TYPE_CLIENT_REMINDER, [
                    'client_id'     => $client->id,
                    'client_name'   => $client->display_name,
                    'client_number' => $client->client_number,
                    'reminder_id'   => $reminder->id,
                    'remind_at'     => $whenStr,
                    'description'   => $reminder->description,
                    'message'       => "Reminder scheduled for {$client->display_name} on {$whenStr}: {$reminder->description}",
                    'url'           => "/clients/{$client->id}?tab=overview",
                ]);
            }

            $created++;
        }

        $message = $created === 1
            ? 'Custom reminder created.'
            : "{$created} custom reminders created.";

        return back()->with('success', $message);
    }

    public function destroy(Client $client, ClientReminder $reminder): RedirectResponse
    {
        $this->authorize('update', $client);
        abort_unless($reminder->client_id === $client->id, 404);

        $when = $reminder->remind_at?->format('M j, Y g:i A');
        $reminder->delete();

        $this->activity->log(
            $client,
            Activity::ACTION_REMINDER_DELETED,
            $when ? "Custom reminder for {$when} removed." : 'Custom reminder removed.'
        );

        return back()->with('success', 'Reminder removed.');
    }

    private function rememberedTimezone(?string $timezone, ?int $tzOffset): string
    {
        if (is_string($timezone) && in_array($timezone, timezone_identifiers_list(), true)) {
            return $timezone;
        }

        if ($tzOffset !== null) {
            $hours = -1 * ($tzOffset / 60);

            return sprintf('UTC%+d', (int) $hours);
        }

        return 'UTC';
    }
}
