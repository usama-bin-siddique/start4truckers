<?php

namespace Tests\Feature;

use App\Contracts\SendsPushNotifications;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FirebaseNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_browser_token_is_saved_for_the_signed_in_user(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'is_active' => true]);

        $this->actingAs($user)
            ->postJson('/notifications/device-token', ['token' => 'device-token-1'])
            ->assertOk()
            ->assertJson(['saved' => true]);

        $this->assertDatabaseHas('device_tokens', [
            'user_id' => $user->id,
            'token' => 'device-token-1',
        ]);
    }

    public function test_creating_a_notification_sends_a_push(): void
    {
        $sent = [];
        $this->app->instance(SendsPushNotifications::class, new class($sent) implements SendsPushNotifications
        {
            public function __construct(private array &$sent) {}

            public function send(int $userId, string $title, string $body, ?string $url, int $notificationId): void
            {
                $this->sent[] = compact('userId', 'title', 'body', 'url', 'notificationId');
            }
        });

        $user = User::factory()->create();

        app(NotificationService::class)->notify($user->id, NotificationService::TYPE_LEAD_ASSIGNED, [
            'lead_id' => 4,
            'lead_name' => 'Jane Driver',
        ]);

        $this->assertCount(1, $sent);
        $this->assertSame($user->id, $sent[0]['userId']);
        $this->assertSame('Lead assigned to you', $sent[0]['title']);
        $this->assertStringContainsString('Jane Driver', $sent[0]['body']);
        $this->assertStringContainsString('/leads/4', $sent[0]['url']);
    }
}
