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
}
