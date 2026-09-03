<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\ClientVehicle;
use App\Models\User;
use App\Support\ClientProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClientProfileFieldsTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_can_be_created_with_profile_fields_and_new_status(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);

        $this->actingAs($admin)
            ->post('/clients', [
                'name'    => 'Owner Name',
                'email'   => 'owner@example.com',
                'phone'   => '555-0100',
                'address' => '123 Fleet St',
                'company' => 'Owner Trucking',
                'ein'     => '12-3456789',
                'usdot_number' => '1234567',
                'mc_number' => 'MC-999',
                'status'  => 'onboarding',
            ])
            ->assertRedirect();

        $client = Client::where('email', 'owner@example.com')->first();
        $this->assertNotNull($client);
        $this->assertSame('onboarding', $client->status);
        $this->assertSame('123 Fleet St', $client->address);
        $this->assertSame('12-3456789', $client->ein);
        $this->assertSame('1234567', $client->usdot_number);
    }

    public function test_legacy_active_status_is_stored_as_in_progress(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);

        $this->actingAs($admin)
            ->post('/clients', [
                'name'   => 'Legacy Status',
                'status' => 'active',
            ])
            ->assertRedirect();

        $this->assertSame('in_progress', Client::where('name', 'Legacy Status')->value('status'));
    }

    public function test_client_show_includes_overview_and_profile_fields(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create([
            'name'        => 'Profile Client',
            'status'      => 'documents_pending',
            'next_action' => 'Upload BOC-3',
            'ein'         => '98-7654321',
        ]);

        $this->actingAs($admin)
            ->get("/clients/{$client->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Clients/Show')
                ->where('client.status', 'documents_pending')
                ->where('client.status_label', 'Documents Pending')
                ->where('client.ein', '98-7654321')
                ->where('client.next_action', 'Upload BOC-3')
                ->has('profile_options.statuses')
                ->has('client.vehicles')
                ->has('client.custom_fields')
            );
    }

    public function test_vehicle_can_be_added_to_a_client(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'Fleet Client', 'status' => 'onboarding']);

        $this->actingAs($admin)
            ->post("/clients/{$client->id}/vehicles", [
                'truck_type'    => 'semi',
                'year'          => 2022,
                'make'          => 'Freightliner',
                'model'         => 'Cascadia',
                'vin'           => '1FUJHHDR0NLAA0001',
                'license_plate' => 'ABC1234',
                'plate_state'   => 'TX',
            ])
            ->assertRedirect();

        $this->assertSame(1, ClientVehicle::count());
        $this->assertSame('Freightliner', $client->vehicles()->first()->make);
    }

    public function test_all_documented_client_statuses_are_available(): void
    {
        $this->assertSame([
            'Lead',
            'Onboarding',
            'Documents Pending',
            'Payment Pending',
            'In Progress',
            'Government Review',
            'Completed',
            'Compliance',
            'Inactive',
        ], array_values(ClientProfile::STATUSES));
    }

    public function test_account_login_section_stores_only_login_gov_credentials(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'Login Client', 'status' => 'onboarding']);

        $this->actingAs($admin)
            ->put("/clients/{$client->id}", [
                'name'               => 'Login Client',
                'login_gov_email'    => 'owner@login.gov',
                'login_gov_password' => 'secret-pass-1',
            ])
            ->assertRedirect();

        $client->refresh();
        $this->assertSame('owner@login.gov', $client->login_gov_email);
        $this->assertSame('secret-pass-1', $client->login_gov_password);

        $this->actingAs($admin)
            ->get("/clients/{$client->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('client.login_gov_email', 'owner@login.gov')
                ->where('client.login_gov_password', 'secret-pass-1')
                ->missing('client.motus_account_email')
                ->missing('client.fmcsa_account_email')
                ->missing('client.portal_username')
            );
    }

    public function test_fmcsa_authority_type_accepts_dropdown_values(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'Authority Client', 'status' => 'onboarding']);

        $this->actingAs($admin)
            ->put("/clients/{$client->id}", [
                'name'                 => 'Authority Client',
                'fmcsa_authority_type' => 'mx',
            ])
            ->assertRedirect();

        $this->assertSame('mx', $client->fresh()->fmcsa_authority_type);

        $this->actingAs($admin)
            ->get("/clients/{$client->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('client.fmcsa_authority_type', 'mx')
                ->where('profile_options.fmcsa_authority_types.ff', 'FF Number')
                ->where('profile_options.fmcsa_authority_types.mc', 'MC Number')
                ->where('profile_options.fmcsa_authority_types.mx', 'MX Number')
            );
    }

    public function test_fmcsa_authority_type_rejects_unknown_values(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'Authority Client', 'status' => 'onboarding']);

        $this->actingAs($admin)
            ->put("/clients/{$client->id}", [
                'name'                 => 'Authority Client',
                'fmcsa_authority_type' => 'invalid',
            ])
            ->assertSessionHasErrors('fmcsa_authority_type');
    }
}
