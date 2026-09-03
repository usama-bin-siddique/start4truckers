<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\ClientReminder;
use App\Models\CrmNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClientCustomReminderTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_multiple_reminders_for_a_client(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create([
            'name'   => 'Reminder Client',
            'status' => 'onboarding',
        ]);

        $this->actingAs($admin)
            ->from("/clients/{$client->id}")
            ->post("/clients/{$client->id}/reminders", [
                'reminders' => [
                    [
                        'date'        => now()->addDays(2)->toDateString(),
                        'time'        => '09:30',
                        'description' => 'Call about UCR filing',
                    ],
                    [
                        'date'        => now()->addDays(5)->toDateString(),
                        'time'        => '14:00',
                        'description' => 'Review IFTA paperwork',
                    ],
                ],
            ])
            ->assertRedirect();

        $this->assertSame(2, ClientReminder::where('client_id', $client->id)->count());
        $this->assertDatabaseHas('client_reminders', [
            'client_id'   => $client->id,
            'description' => 'Call about UCR filing',
            'created_by'  => $admin->id,
        ]);
        $this->assertDatabaseHas('client_reminders', [
            'client_id'   => $client->id,
            'description' => 'Review IFTA paperwork',
        ]);

        $first = ClientReminder::where('description', 'Call about UCR filing')->first();
        $this->assertSame(now()->addDays(2)->toDateString(), $first?->remind_at?->toDateString());
        $this->assertSame('09:30', $first?->remind_at?->format('H:i'));
    }

    public function test_reminders_belong_only_to_the_client_they_were_created_on(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $alpha = Client::create(['name' => 'Alpha', 'status' => 'onboarding']);
        $beta = Client::create(['name' => 'Beta', 'status' => 'onboarding']);

        $this->actingAs($admin)
            ->post("/clients/{$alpha->id}/reminders", [
                'reminders' => [[
                    'date'        => now()->addDay()->toDateString(),
                    'time'        => '10:00',
                    'description' => 'Alpha only',
                ]],
            ])
            ->assertRedirect();

        $this->assertSame(1, ClientReminder::where('client_id', $alpha->id)->count());
        $this->assertSame(0, ClientReminder::where('client_id', $beta->id)->count());
    }

    public function test_cannot_create_more_than_ten_reminders_at_once(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'Cap Client', 'status' => 'onboarding']);

        $rows = [];
        for ($i = 0; $i < 11; $i++) {
            $rows[] = [
                'date'        => now()->addDays($i + 1)->toDateString(),
                'time'        => '08:00',
                'description' => "Reminder {$i}",
            ];
        }

        $this->actingAs($admin)
            ->from("/clients/{$client->id}")
            ->post("/clients/{$client->id}/reminders", [
                'reminders' => $rows,
            ])
            ->assertSessionHasErrors('reminders');

        $this->assertSame(0, ClientReminder::where('client_id', $client->id)->count());
    }

    public function test_sales_cannot_create_reminders_on_an_unassigned_client(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $sales = User::factory()->create(['role' => 'sales', 'is_active' => true]);
        $client = Client::create([
            'name'        => 'Someone Else',
            'status'      => 'onboarding',
            'assigned_to' => $admin->id,
        ]);

        $this->actingAs($sales)
            ->post("/clients/{$client->id}/reminders", [
                'reminders' => [[
                    'date'        => now()->addDay()->toDateString(),
                    'time'        => '11:00',
                    'description' => 'Should not save',
                ]],
            ])
            ->assertForbidden();

        $this->assertSame(0, ClientReminder::count());
    }

    public function test_due_custom_reminders_notify_assigned_user_and_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $sales = User::factory()->create(['role' => 'sales', 'is_active' => true]);
        $client = Client::create([
            'name'        => 'Notify Client',
            'status'      => 'onboarding',
            'assigned_to' => $sales->id,
        ]);

        $reminder = ClientReminder::create([
            'client_id'   => $client->id,
            'remind_at'   => now()->subMinute(),
            'description' => 'Follow up on MCS-150',
            'created_by'  => $admin->id,
        ]);

        $this->artisan('client-reminders:send')->assertSuccessful();

        $this->assertDatabaseHas('crm_notifications', [
            'user_id' => $sales->id,
            'type'    => 'client_reminder',
        ]);
        $this->assertDatabaseHas('crm_notifications', [
            'user_id' => $admin->id,
            'type'    => 'client_reminder',
        ]);
        $this->assertNotNull($reminder->fresh()->notified_at);

        $this->artisan('client-reminders:send')->assertSuccessful();
        $this->assertSame(2, CrmNotification::where('type', 'client_reminder')->count());
    }

    public function test_client_profile_includes_custom_reminders(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'Profile Reminders', 'status' => 'onboarding']);
        ClientReminder::create([
            'client_id'   => $client->id,
            'remind_at'   => now()->addDays(3)->setTime(15, 45),
            'description' => 'Send insurance packet',
            'created_by'  => $admin->id,
        ]);

        $this->actingAs($admin)
            ->get("/clients/{$client->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Clients/Show')
                ->has('client.reminders', 1)
                ->where('client.reminders.0.description', 'Send insurance packet')
            );
    }

    public function test_reminder_can_be_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'Delete Reminder', 'status' => 'onboarding']);
        $reminder = ClientReminder::create([
            'client_id'   => $client->id,
            'remind_at'   => now()->addDay(),
            'description' => 'Old reminder',
            'created_by'  => $admin->id,
        ]);

        $this->actingAs($admin)
            ->delete("/clients/{$client->id}/reminders/{$reminder->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('client_reminders', ['id' => $reminder->id]);
    }
}
