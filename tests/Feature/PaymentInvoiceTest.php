<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\ClientService;
use App\Models\Payment;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PaymentInvoiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_invoice_prints_existing_payment_without_creating_another_record(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create([
            'name'   => 'Invoice Client',
            'email'  => 'invoice@example.com',
            'status' => 'active',
        ]);
        $payment = Payment::create([
            'client_id'       => $client->id,
            'invoice_amount'  => 250,
            'amount_received' => 100,
            'payment_method'  => 'zelle',
            'created_by'      => $admin->id,
        ]);

        $this->actingAs($admin)
            ->get("/payments/{$payment->id}/invoice")
            ->assertOk()
            ->assertSee('INV-'.str_pad((string) $payment->id, 5, '0', STR_PAD_LEFT))
            ->assertSee('Invoice Client')
            ->assertSee('$250.00')
            ->assertSee('$100.00');

        $this->assertSame(1, Payment::count());
    }

    public function test_payments_index_shows_payment_rows_without_redirecting_to_the_client(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $assignee = User::factory()->create(['role' => 'sales', 'is_active' => true, 'name' => 'Assigned Sales']);
        $client = Client::create([
            'name'        => 'Fleet Customer',
            'company'     => 'Acme Trucking',
            'status'      => 'active',
            'assigned_to' => $assignee->id,
        ]);
        $service = Service::create([
            'name'      => 'DOT Authority',
            'slug'      => 'dot-authority',
            'is_active' => true,
        ]);
        ClientService::create([
            'client_id'  => $client->id,
            'service_id' => $service->id,
            'status'     => 'pending',
        ]);
        $payment = Payment::create([
            'client_id'       => $client->id,
            'invoice_amount'  => 500,
            'amount_received' => 200,
            'payment_method'  => 'zelle',
            'paid_at'         => now(),
            'created_by'      => $admin->id,
        ]);

        $this->actingAs($admin)
            ->get('/payments')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Payments/Index')
                ->has('payments.data', 1)
                ->where('payments.data.0.id', $payment->id)
                ->where('payments.data.0.client_id', $client->id)
                ->where('payments.data.0.client_number', $client->client_number)
                ->where('payments.data.0.invoice_number', 'INV-'.str_pad((string) $payment->id, 5, '0', STR_PAD_LEFT))
                ->where('payments.data.0.customer_name', 'Fleet Customer')
                ->where('payments.data.0.company_name', 'Acme Trucking')
                ->where('payments.data.0.amount_received', 200)
                ->where('payments.data.0.payment_method', 'zelle')
                ->where('payments.data.0.status', 'partial')
                ->where('payments.data.0.assigned_user', 'Assigned Sales')
                ->where('payments.data.0.services.0', 'DOT Authority')
            );
    }
}
