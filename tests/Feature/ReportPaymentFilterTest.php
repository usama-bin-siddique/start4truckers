<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportPaymentFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_reports_lists_payments_received_in_the_selected_month(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $augustClient = Client::create([
            'name'    => 'August Payer',
            'company' => 'August Freight LLC',
            'status'  => 'in_progress',
        ]);
        $julyClient = Client::create([
            'name'    => 'July Payer',
            'company' => 'July Logistics',
            'status'  => 'in_progress',
        ]);

        $augustPayment = Payment::create([
            'client_id'             => $augustClient->id,
            'invoice_amount'        => 500,
            'amount_received'       => 500,
            'payment_method'        => 'zelle',
            'transaction_reference' => 'AUG-1',
            'paid_at'               => '2026-08-15',
            'created_by'            => $admin->id,
        ]);
        Payment::create([
            'client_id'       => $julyClient->id,
            'invoice_amount'  => 200,
            'amount_received' => 200,
            'payment_method'  => 'cash',
            'paid_at'         => '2026-07-20',
            'created_by'      => $admin->id,
        ]);
        Payment::create([
            'client_id'       => $augustClient->id,
            'invoice_amount'  => 100,
            'amount_received' => 100,
            'paid_at'         => '2026-09-01',
            'created_by'      => $admin->id,
        ]);

        $this->actingAs($admin)
            ->get('/reports?date_from=2026-08-01&date_to=2026-08-31')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Reports/Index')
                ->where('filters.dateFrom', '2026-08-01')
                ->where('filters.dateTo', '2026-08-31')
                ->where('payments.count', 1)
                ->where('payments.total_received', 500)
                ->has('payments.payments', 1)
                ->where('payments.payments.0.id', $augustPayment->id)
                ->where('payments.payments.0.client_name', 'August Payer')
                ->where('payments.payments.0.company_name', 'August Freight LLC')
                ->where('payments.payments.0.amount_received', 500)
                ->where('payments.payments.0.paid_at', '2026-08-15')
                ->where('payments.payments.0.invoice_number', 'INV-'.str_pad((string) $augustPayment->id, 5, '0', STR_PAD_LEFT))
                ->where('payments.payments.0.payment_method', 'zelle')
            );
    }
}
