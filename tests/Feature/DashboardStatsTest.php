<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Payment;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardStatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_year_to_date_revenue_is_this_year_through_today(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'Fleet Client', 'status' => 'onboarding']);

        Payment::create([
            'client_id'        => $client->id,
            'invoice_amount'   => 100,
            'amount_received'  => 100,
            'paid_at'          => now()->startOfYear(),
            'created_by'       => $admin->id,
        ]);
        Payment::create([
            'client_id'        => $client->id,
            'invoice_amount'   => 50,
            'amount_received'  => 50,
            'paid_at'          => now(),
            'created_by'       => $admin->id,
        ]);
        Payment::create([
            'client_id'        => $client->id,
            'invoice_amount'   => 999,
            'amount_received'  => 999,
            'paid_at'          => now()->subYear(),
            'created_by'       => $admin->id,
        ]);
        Payment::create([
            'client_id'        => $client->id,
            'invoice_amount'   => 80,
            'amount_received'  => 80,
            'paid_at'          => now()->addDay(),
            'created_by'       => $admin->id,
        ]);

        $this->actingAs($admin)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('stats.revenue_year', 150)
            );
    }

    public function test_year_to_date_includes_payments_without_paid_at_using_created_at(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'No Date Client', 'status' => 'onboarding']);

        $payment = Payment::create([
            'client_id'        => $client->id,
            'invoice_amount'   => 25,
            'amount_received'  => 25,
            'paid_at'          => null,
            'created_by'       => $admin->id,
        ]);
        Payment::whereKey($payment->id)->update([
            'created_at' => now()->startOfYear()->addDays(10),
            'paid_at'    => null,
        ]);

        $this->actingAs($admin)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('stats.revenue_year', 25)
            );
    }

    public function test_tasks_due_includes_overdue_and_today_with_dates(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'Lisa Garcia', 'status' => 'onboarding']);

        Task::create([
            'client_id'   => $client->id,
            'title'       => 'Process MC authority',
            'priority'    => 'high',
            'status'      => Task::STATUS_IN_PROGRESS,
            'assigned_to' => $admin->id,
            'created_by'  => $admin->id,
            'due_date'    => now()->subDays(10),
        ]);
        Task::create([
            'client_id'   => $client->id,
            'title'       => 'Call client today',
            'priority'    => 'medium',
            'status'      => Task::STATUS_PENDING,
            'assigned_to' => $admin->id,
            'created_by'  => $admin->id,
            'due_date'    => now(),
        ]);
        Task::create([
            'title'       => 'Future work',
            'priority'    => 'low',
            'status'      => Task::STATUS_PENDING,
            'assigned_to' => $admin->id,
            'created_by'  => $admin->id,
            'due_date'    => now()->addDays(5),
        ]);
        Task::create([
            'title'       => 'Already done',
            'priority'    => 'low',
            'status'      => Task::STATUS_COMPLETED,
            'assigned_to' => $admin->id,
            'created_by'  => $admin->id,
            'due_date'    => now()->subDays(2),
        ]);

        $this->actingAs($admin)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('stats.tasks_due_today', 2)
                ->has('tasks_due_today', 2)
                ->where('tasks_due_today.0.title', 'Process MC authority')
                ->where('tasks_due_today.0.due_date', now()->subDays(10)->format('M j, Y'))
                ->where('tasks_due_today.0.is_overdue', true)
                ->where('tasks_due_today.0.client', 'Lisa Garcia')
                ->where('tasks_due_today.1.title', 'Call client today')
                ->where('tasks_due_today.1.is_overdue', false)
            );
    }
}
