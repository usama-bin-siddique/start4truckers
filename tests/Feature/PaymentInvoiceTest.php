<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
