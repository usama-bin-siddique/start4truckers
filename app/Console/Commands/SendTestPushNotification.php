<?php

namespace App\Console\Commands;

use App\Models\DeviceToken;
use App\Models\User;
use App\Services\FirebasePush;
use Illuminate\Console\Command;

class SendTestPushNotification extends Command
{
    protected $signature = 'push:test {user_id?}';
    protected $description = 'Send a test push notification via FCM';

    public function handle(FirebasePush $push): int
    {
        $userId = $this->argument('user_id');

        $query = DeviceToken::query()->with('user');
        if ($userId) {
            $query->where('user_id', $userId);
        }

        $tokens = $query->get();

        if ($tokens->isEmpty()) {
            $this->warn('No device tokens found in database.');
            $this->line('Device tokens are registered when a user visits the app on desktop/browser and grants Notification permission.');
            return 1;
        }

        $this->info("Found {$tokens->count()} device token(s). Sending test push...");

        foreach ($tokens as $device) {
            $this->line("Sending to User #{$device->user_id} ({$device->user?->name})...");
            try {
                $push->send(
                    $device->user_id,
                    '🔔 Test Push Notification',
                    'FCM is listening and working properly on Start4Truckers!',
                    url('/notifications')
                );
                $this->info("✓ Sent successfully to User #{$device->user_id}");
            } catch (\Throwable $e) {
                $this->error("✗ Failed to send: {$e->getMessage()}");
            }
        }

        return 0;
    }
}
