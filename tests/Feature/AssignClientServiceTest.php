<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Lead;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssignClientServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_assign_a_service_to_a_client(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $lead = Lead::create([
            'name'   => 'Test Driver',
            'source' => 'manual',
            'status' => 'won',
        ]);
        $client = Client::create([
            'lead_id' => $lead->id,
            'status'  => 'active',
        ]);
        $service = Service::create([
            'name'      => 'USDOT',
            'slug'      => 'usdot',
            'is_active' => true,
            'order'     => 1,
        ]);

        $this->actingAs($user)
            ->from("/clients/{$client->id}")
            ->post('/operations', [
                'client_id'  => $client->id,
                'service_id' => $service->id,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('client_services', [
            'client_id'  => $client->id,
            'service_id' => $service->id,
            'status'     => 'pending',
        ]);
    }

    public function test_converting_a_lead_assigns_the_required_service(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $service = Service::create([
            'name'      => 'MC Authority',
            'slug'      => 'mc_authority',
            'is_active' => true,
            'order'     => 4,
        ]);
        $lead = Lead::create([
            'name'             => 'Test Driver',
            'source'           => 'manual',
            'status'           => 'contacted',
            'service_required' => 'MC Authority',
        ]);

        $this->actingAs($user)
            ->post("/leads/{$lead->id}/convert")
            ->assertRedirect();

        $client = $lead->fresh()->client;

        $this->assertNotNull($client);
        $this->assertDatabaseHas('client_services', [
            'client_id'  => $client->id,
            'service_id' => $service->id,
            'status'     => 'pending',
        ]);
    }

    public function test_does_not_assign_the_same_service_twice(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $lead = Lead::create([
            'name'   => 'Test Driver',
            'source' => 'manual',
            'status' => 'won',
        ]);
        $client = Client::create([
            'lead_id' => $lead->id,
            'status'  => 'active',
        ]);
        $service = Service::create([
            'name'      => 'EIN',
            'slug'      => 'ein',
            'is_active' => true,
            'order'     => 2,
        ]);

        $client->clientServices()->create([
            'service_id' => $service->id,
            'status'     => 'pending',
        ]);

        $this->actingAs($user)
            ->from("/clients/{$client->id}")
            ->post('/operations', [
                'client_id'  => $client->id,
                'service_id' => $service->id,
            ])
            ->assertSessionHasErrors('service_id');
    }
}
