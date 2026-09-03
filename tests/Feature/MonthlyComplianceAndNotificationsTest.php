<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\CrmNotification;
use App\Models\Lead;
use App\Models\Task;
use App\Models\User;
use App\Support\ClientProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MonthlyComplianceAndNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_compliance_labels_use_one_time_and_monthly(): void
    {
        $this->assertSame('One-Time', ClientProfile::complianceLabel('project'));
        $this->assertSame('Monthly', ClientProfile::complianceLabel('monthly'));
        $this->assertSame(['project' => 'One-Time', 'monthly' => 'Monthly'], ClientProfile::COMPLIANCE_TYPES);
    }

    public function test_converting_a_client_to_monthly_records_dates_and_notifies_assignee_and_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true, 'name' => 'Admin User']);
        $sales = User::factory()->create(['role' => 'sales', 'is_active' => true, 'name' => 'Assigned Sales']);
        $client = Client::create([
            'name'            => 'ABC Trucking',
            'status'          => 'onboarding',
            'assigned_to'     => $sales->id,
            'compliance_type' => 'project',
        ]);

        $this->actingAs($admin)
            ->from("/clients/{$client->id}")
            ->post("/clients/{$client->id}/compliance", [
                'compliance_type' => 'monthly',
            ])
            ->assertRedirect();

        $client->refresh();

        $this->assertSame('monthly', $client->compliance_type);
        $this->assertSame('compliance', $client->status);
        $this->assertSame(now()->toDateString(), $client->monthly_compliance_started_at?->toDateString());
        $this->assertSame(now()->addDays(30)->toDateString(), $client->next_compliance_due_at?->toDateString());

        $this->assertFalse(
            Task::query()
                ->where('client_id', $client->id)
                ->where('kind', Task::KIND_MONTHLY_COMPLIANCE)
                ->exists()
        );

        $this->assertDatabaseHas('crm_notifications', [
            'user_id' => $sales->id,
            'type'    => 'compliance_started',
        ]);
        $this->assertDatabaseHas('crm_notifications', [
            'user_id' => $admin->id,
            'type'    => 'compliance_started',
        ]);
    }

    public function test_completing_a_monthly_compliance_task_does_not_schedule_the_next_30_day_cycle(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create([
            'name'                         => 'Cycle Client',
            'status'                       => 'compliance',
            'assigned_to'                  => $admin->id,
            'compliance_type'              => 'monthly',
            'monthly_compliance_started_at' => now()->subDays(30),
            'next_compliance_due_at'       => now()->addDays(10),
        ]);

        $task = Task::create([
            'client_id'   => $client->id,
            'title'       => 'Leftover monthly compliance',
            'assigned_to' => $admin->id,
            'created_by'  => $admin->id,
            'priority'    => Task::PRIORITY_HIGH,
            'status'      => Task::STATUS_PENDING,
            'kind'        => Task::KIND_MONTHLY_COMPLIANCE,
            'due_date'    => now()->addDay(),
        ]);

        $this->actingAs($admin)
            ->patch("/tasks/{$task->id}/complete")
            ->assertRedirect();

        $client->refresh();
        $task->refresh();

        $this->assertSame(Task::STATUS_COMPLETED, $task->status);
        $this->assertSame(now()->toDateString(), $client->last_compliance_completed_at?->toDateString());
        $this->assertSame(now()->addDays(10)->toDateString(), $client->next_compliance_due_at?->toDateString());

        $this->assertFalse(
            Task::query()
                ->where('client_id', $client->id)
                ->where('kind', Task::KIND_MONTHLY_COMPLIANCE)
                ->where('status', '!=', Task::STATUS_COMPLETED)
                ->exists()
        );
    }

    public function test_due_compliance_reminders_are_not_sent_automatically(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $sales = User::factory()->create(['role' => 'sales', 'is_active' => true]);
        $client = Client::create([
            'name'        => 'Due Client',
            'status'      => 'onboarding',
            'assigned_to' => $sales->id,
        ]);

        $this->actingAs($admin)
            ->post("/clients/{$client->id}/compliance", ['compliance_type' => 'monthly']);

        $client->refresh()->update([
            'next_compliance_due_at'       => now()->subDay(),
            'compliance_reminder_sent_for' => null,
        ]);

        $this->artisan('compliance:send-reminders')->assertSuccessful();

        $this->assertDatabaseMissing('crm_notifications', [
            'type' => 'compliance_due',
        ]);
        $this->assertNull($client->fresh()->compliance_reminder_sent_for);
        $this->assertFalse(
            Task::where('client_id', $client->id)->where('kind', Task::KIND_MONTHLY_COMPLIANCE)->exists()
        );
    }

    public function test_converting_a_lead_to_a_monthly_client_starts_the_compliance_cycle(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $lead = Lead::create([
            'name'        => 'New Driver',
            'source'      => 'manual',
            'status'      => 'contacted',
            'assigned_to' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->post("/leads/{$lead->id}/convert", [
                'compliance_type' => 'monthly',
            ])
            ->assertRedirect();

        $client = Client::where('lead_id', $lead->id)->first();
        $this->assertNotNull($client);
        $this->assertSame('monthly', $client->compliance_type);
        $this->assertNotNull($client->monthly_compliance_started_at);
        $this->assertNotNull($client->next_compliance_due_at);
        $this->assertFalse(
            Task::where('client_id', $client->id)->where('kind', Task::KIND_MONTHLY_COMPLIANCE)->exists()
        );
    }

    public function test_clicking_a_notification_marks_it_read_and_opens_the_related_record(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create([
            'name'   => 'Linked Client',
            'status' => 'onboarding',
        ]);

        $this->actingAs($admin)
            ->post("/clients/{$client->id}/compliance", ['compliance_type' => 'monthly']);

        $notification = CrmNotification::where('user_id', $admin->id)->latest()->first();
        $this->assertNotNull($notification);
        $this->assertNull($notification->read_at);
        $this->assertSame("/clients/{$client->id}?tab=compliance", $notification->data['url'] ?? null);

        $this->actingAs($admin)
            ->get("/notifications/{$notification->id}/open")
            ->assertRedirect("/clients/{$client->id}?tab=compliance");

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_notifications_index_includes_actionable_urls(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create([
            'name'   => 'Notify Client',
            'status' => 'onboarding',
        ]);

        $this->actingAs($admin)
            ->post("/clients/{$client->id}/compliance", ['compliance_type' => 'monthly']);

        $this->actingAs($admin)
            ->get('/notifications')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Notifications/Index')
                ->where('notifications.0.url', "/clients/{$client->id}?tab=compliance")
            );
    }

    public function test_client_show_includes_monthly_compliance_dates(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create([
            'name'   => 'Profile Client',
            'status' => 'onboarding',
        ]);

        $this->actingAs($admin)
            ->post("/clients/{$client->id}/compliance", ['compliance_type' => 'monthly']);

        $client->refresh();

        $this->actingAs($admin)
            ->get("/clients/{$client->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Clients/Show')
                ->where('client.compliance_type', 'monthly')
                ->where('client.monthly_compliance_started_at', $client->monthly_compliance_started_at?->toDateString())
                ->where('client.next_compliance_due_at', $client->next_compliance_due_at?->toDateString())
                ->has('profile_options.compliance_types')
            );
    }
}
