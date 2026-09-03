<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentRecordUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_a_saved_payment(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'Pay Client', 'status' => 'onboarding']);
        $payment = Payment::create([
            'client_id'             => $client->id,
            'invoice_amount'        => 500,
            'amount_received'       => 100,
            'payment_method'        => 'cash',
            'transaction_reference' => 'WRONG-1',
            'created_by'            => $admin->id,
        ]);

        $this->actingAs($admin)
            ->from("/clients/{$client->id}")
            ->put("/payments/{$payment->id}", [
                'invoice_amount'        => 450,
                'amount_received'       => 450,
                'payment_method'        => 'zelle',
                'transaction_reference' => 'ZELLE-99',
                'notes'                 => 'Corrected amount',
                'paid_at'               => now()->toDateString(),
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $payment->refresh();
        $this->assertEquals(450, (float) $payment->invoice_amount);
        $this->assertEquals(450, (float) $payment->amount_received);
        $this->assertSame('zelle', $payment->payment_method);
        $this->assertSame('ZELLE-99', $payment->transaction_reference);
        $this->assertSame('Corrected amount', $payment->notes);
    }

    public function test_admin_can_delete_a_saved_payment(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'Delete Client', 'status' => 'onboarding']);
        $payment = Payment::create([
            'client_id'       => $client->id,
            'invoice_amount'  => 200,
            'amount_received' => 200,
            'created_by'      => $admin->id,
        ]);

        $this->actingAs($admin)
            ->from("/clients/{$client->id}")
            ->delete("/payments/{$payment->id}")
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSoftDeleted('payments', ['id' => $payment->id]);
    }

    public function test_sales_can_update_and_delete_a_payment_for_an_assigned_client(): void
    {
        $sales = User::factory()->create(['role' => 'sales', 'is_active' => true]);
        $client = Client::create([
            'name'        => 'Assigned Client',
            'status'      => 'onboarding',
            'assigned_to' => $sales->id,
        ]);
        $payment = Payment::create([
            'client_id'       => $client->id,
            'invoice_amount'  => 300,
            'amount_received' => 50,
            'created_by'      => $sales->id,
        ]);

        $this->actingAs($sales)
            ->put("/payments/{$payment->id}", [
                'invoice_amount'  => 300,
                'amount_received' => 300,
                'payment_method'  => 'check',
            ])
            ->assertRedirect();

        $this->assertEquals(300, (float) $payment->fresh()->amount_received);

        $this->actingAs($sales)
            ->delete("/payments/{$payment->id}")
            ->assertRedirect();

        $this->assertSoftDeleted('payments', ['id' => $payment->id]);
    }

    public function test_sales_cannot_change_a_payment_for_an_unassigned_client(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $sales = User::factory()->create(['role' => 'sales', 'is_active' => true]);
        $client = Client::create([
            'name'        => 'Someone Else',
            'status'      => 'onboarding',
            'assigned_to' => $admin->id,
        ]);
        $payment = Payment::create([
            'client_id'       => $client->id,
            'invoice_amount'  => 100,
            'amount_received' => 100,
            'created_by'      => $admin->id,
        ]);

        $this->actingAs($sales)
            ->put("/payments/{$payment->id}", [
                'invoice_amount'  => 1,
                'amount_received' => 1,
            ])
            ->assertForbidden();

        $this->actingAs($sales)
            ->delete("/payments/{$payment->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('payments', [
            'id'              => $payment->id,
            'invoice_amount'  => 100,
            'deleted_at'      => null,
        ]);
    }
}
