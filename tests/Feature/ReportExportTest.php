<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_export_reports_as_excel_using_applied_filters(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $sales = User::factory()->create(['role' => 'sales', 'is_active' => true]);
        $client = Client::create([
            'name'        => 'Export Client',
            'status'      => 'in_progress',
            'assigned_to' => $sales->id,
        ]);
        Payment::create([
            'client_id'       => $client->id,
            'invoice_amount'  => 400,
            'amount_received' => 250,
            'paid_at'         => now(),
            'created_by'      => $admin->id,
        ]);

        $from = now()->startOfYear()->toDateString();
        $to = now()->toDateString();

        $response = $this->actingAs($admin)
            ->get("/reports/export/xlsx?date_from={$from}&date_to={$to}&user_id={$sales->id}");

        $response->assertOk();
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertStringContainsString(
            "start4truckers-reports-{$from}-to-{$to}.xlsx",
            $response->headers->get('content-disposition')
        );
        $this->assertNotEmpty($response->streamedContent());
    }

    public function test_admin_can_export_reports_as_pdf_using_applied_filters(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);

        $from = now()->startOfYear()->toDateString();
        $to = now()->toDateString();

        $this->actingAs($admin)
            ->get("/reports/export/pdf?date_from={$from}&date_to={$to}")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_non_admin_cannot_export_reports(): void
    {
        $sales = User::factory()->create(['role' => 'sales', 'is_active' => true]);

        $this->actingAs($sales)
            ->get('/reports/export/xlsx')
            ->assertForbidden();

        $this->actingAs($sales)
            ->get('/reports/export/pdf')
            ->assertForbidden();
    }
}
