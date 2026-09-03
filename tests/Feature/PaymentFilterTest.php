<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PaymentFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_payments_can_be_filtered_by_date_range_using_paid_at_or_created_at(): void
    {
        $admin = $this->admin();
        $inRange = $this->payment($admin, [
            'name' => 'August Client',
            'paid_at' => '2026-08-15',
            'amount' => 500,
        ]);
        $this->payment($admin, [
            'name' => 'No Paid At',
            'paid_at' => null,
            'created_at' => '2026-08-20 09:00:00',
            'amount' => 80,
        ]);
        $this->payment($admin, [
            'name' => 'July Client',
            'paid_at' => '2026-07-04',
            'amount' => 200,
        ]);

        $this->actingAs($admin)
            ->get('/payments?date_from=2026-08-01&date_to=2026-08-31')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Payments/Index')
                ->has('payments.data', 2)
                ->where('filters.date_from', '2026-08-01')
                ->where('filters.date_to', '2026-08-31')
                ->where('totals.received', 580)
            );

        $this->actingAs($admin)
            ->get('/payments?date_from=2026-08-15&date_to=2026-08-15')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('payments.data', 1)
                ->where('payments.data.0.id', $inRange->id)
            );
    }

    public function test_payments_can_be_filtered_by_client_and_company(): void
    {
        $admin = $this->admin();
        $alpha = Client::create(['name' => 'Alpha Driver', 'company' => 'Alpha Freight', 'status' => 'onboarding']);
        $beta = Client::create(['name' => 'Beta Driver', 'company' => 'Beta Logistics', 'status' => 'onboarding']);
        $alphaPay = Payment::create([
            'client_id'       => $alpha->id,
            'invoice_amount'  => 100,
            'amount_received' => 100,
            'created_by'      => $admin->id,
            'paid_at'         => now(),
        ]);
        Payment::create([
            'client_id'       => $beta->id,
            'invoice_amount'  => 50,
            'amount_received' => 50,
            'created_by'      => $admin->id,
            'paid_at'         => now(),
        ]);

        $this->actingAs($admin)
            ->get('/payments?client_id='.$alpha->id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('payments.data', 1)
                ->where('payments.data.0.id', $alphaPay->id)
            );

        $this->actingAs($admin)
            ->get('/payments?company='.urlencode('Beta Logistics'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('payments.data', 1)
                ->where('payments.data.0.customer_name', 'Beta Driver')
            );
    }

    public function test_search_matches_client_company_reference_amount_and_invoice(): void
    {
        $admin = $this->admin();
        $match = $this->payment($admin, [
            'name' => 'Searchable Client',
            'company' => 'Harbor Haul LLC',
            'reference' => 'ZELLE-7788',
            'amount' => 325.50,
        ]);
        $this->payment($admin, [
            'name' => 'Other Client',
            'company' => 'Other Co',
            'reference' => 'CASH-1',
            'amount' => 10,
        ]);

        foreach (['Harbor', 'ZELLE-7788', '325.50', 'INV-'.str_pad((string) $match->id, 5, '0', STR_PAD_LEFT)] as $term) {
            $this->actingAs($admin)
                ->get('/payments?search='.urlencode($term))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->has('payments.data', 1)
                    ->where('payments.data.0.id', $match->id)
                );
        }
    }

    public function test_payments_can_be_filtered_by_method_and_status(): void
    {
        $admin = $this->admin();
        $zelle = $this->payment($admin, [
            'name' => 'Zelle Client',
            'method' => 'zelle',
            'invoice' => 400,
            'amount' => 200,
        ]);
        $this->payment($admin, [
            'name' => 'Cash Client',
            'method' => 'cash',
            'invoice' => 150,
            'amount' => 150,
        ]);

        $this->actingAs($admin)
            ->get('/payments?payment_method=zelle')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('payments.data', 1)
                ->where('payments.data.0.id', $zelle->id)
            );

        $this->actingAs($admin)
            ->get('/payments?status=partial')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('payments.data', 1)
                ->where('payments.data.0.status', 'partial')
            );
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'is_active' => true]);
    }

    /**
     * @param  array{name:string,company?:string,paid_at?:string|null,created_at?:string,amount?:float,invoice?:float,method?:string,reference?:string}  $attrs
     */
    private function payment(User $admin, array $attrs): Payment
    {
        $client = Client::create([
            'name'    => $attrs['name'],
            'company' => $attrs['company'] ?? null,
            'status'  => 'onboarding',
        ]);

        $payment = Payment::create([
            'client_id'             => $client->id,
            'invoice_amount'        => $attrs['invoice'] ?? $attrs['amount'] ?? 100,
            'amount_received'       => $attrs['amount'] ?? 100,
            'payment_method'        => $attrs['method'] ?? 'cash',
            'transaction_reference' => $attrs['reference'] ?? null,
            'paid_at'               => array_key_exists('paid_at', $attrs) ? $attrs['paid_at'] : now(),
            'created_by'            => $admin->id,
        ]);

        if (! empty($attrs['created_at'])) {
            $payment->forceFill(['created_at' => $attrs['created_at']])->save();
        }

        return $payment->fresh();
    }
}
