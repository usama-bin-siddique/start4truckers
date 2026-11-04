<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Lead;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_sales_only_sees_open_assigned_leads_and_not_clients_or_payments(): void
    {
        $sales = User::factory()->create(['role' => 'sales', 'is_active' => true]);
        $open = Lead::create([
            'name' => 'Open Lead',
            'status' => Lead::STATUS_NEW,
            'assigned_to' => $sales->id,
        ]);
        Lead::create([
            'name' => 'Won Lead',
            'status' => Lead::STATUS_WON,
            'assigned_to' => $sales->id,
            'converted_at' => now(),
        ]);
        Lead::create([
            'name' => 'Someone Else',
            'status' => Lead::STATUS_NEW,
        ]);

        $this->actingAs($sales)->get('/leads')->assertOk();
        $this->actingAs($sales)->get("/leads/{$open->id}")->assertOk();
        $this->actingAs($sales)->get('/clients')->assertForbidden();
        $this->actingAs($sales)->get('/payments')->assertForbidden();
        $this->actingAs($sales)->get('/operations')->assertForbidden();

        $this->assertSame(1, Lead::query()->visibleTo($sales)->count());
    }

    public function test_manager_can_add_sales_and_executor_but_cannot_delete(): void
    {
        $manager = User::factory()->create(['role' => 'manager', 'is_active' => true]);
        $sales = User::factory()->create(['role' => 'sales', 'is_active' => true]);

        $this->actingAs($manager)->post('/settings/users', [
            'name' => 'New Executor',
            'email' => 'executor@example.com',
            'password' => 'password123',
            'role' => 'processing',
        ])->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'executor@example.com',
            'role' => 'processing',
        ]);

        $this->actingAs($manager)->post('/settings/users', [
            'name' => 'New Admin',
            'email' => 'boss@example.com',
            'password' => 'password123',
            'role' => 'admin',
        ])->assertSessionHasErrors('role');

        $this->actingAs($manager)->delete("/settings/users/{$sales->id}")->assertForbidden();
        $this->actingAs($manager)->get('/clients')->assertOk();
        $this->actingAs($manager)->get('/payments')->assertOk();
    }

    public function test_processor_sees_open_and_monthly_clients_and_only_open_tasks(): void
    {
        $processor = User::factory()->create(['role' => 'processing', 'is_active' => true]);

        $open = Client::create([
            'name' => 'Open Client',
            'status' => Client::STATUS_IN_PROGRESS,
            'compliance_type' => Client::COMPLIANCE_PROJECT,
            'assigned_to' => $processor->id,
        ]);
        $monthly = Client::create([
            'name' => 'Monthly Client',
            'status' => Client::STATUS_COMPLIANCE,
            'compliance_type' => Client::COMPLIANCE_MONTHLY,
            'assigned_to' => $processor->id,
        ]);
        $done = Client::create([
            'name' => 'Finished Once',
            'status' => Client::STATUS_COMPLETED,
            'compliance_type' => Client::COMPLIANCE_PROJECT,
            'assigned_to' => $processor->id,
        ]);

        $pending = Task::create([
            'title' => 'File the DOT',
            'status' => Task::STATUS_PENDING,
            'priority' => 'medium',
            'assigned_to' => $processor->id,
            'client_id' => $open->id,
        ]);
        Task::create([
            'title' => 'Done task',
            'status' => Task::STATUS_COMPLETED,
            'priority' => 'medium',
            'assigned_to' => $processor->id,
            'client_id' => $open->id,
            'completed_at' => now(),
        ]);

        $visible = Client::query()->visibleTo($processor)->pluck('name')->all();
        $this->assertEqualsCanonicalizing(['Open Client', 'Monthly Client'], $visible);

        $this->actingAs($processor)->get("/clients/{$open->id}")->assertOk();
        $this->actingAs($processor)->get("/clients/{$monthly->id}")->assertOk();
        $this->actingAs($processor)->get("/clients/{$done->id}")->assertForbidden();
        $this->actingAs($processor)->get('/tasks')->assertOk()->assertSee('File the DOT')->assertDontSee('Done task');
        $this->actingAs($processor)->delete("/tasks/{$pending->id}")->assertForbidden();
    }
}
