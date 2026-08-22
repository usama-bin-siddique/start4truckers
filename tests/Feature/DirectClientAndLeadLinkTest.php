<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DirectClientAndLeadLinkTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_client_directly(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);

        $this->actingAs($admin)
            ->post('/clients', [
                'name'            => 'Direct Client',
                'email'           => 'direct@example.com',
                'phone'           => '555-0100',
                'company'         => 'Direct Trucking',
                'compliance_type' => 'monthly',
            ])
            ->assertRedirect();

        $client = Client::where('email', 'direct@example.com')->first();

        $this->assertNotNull($client);
        $this->assertNotNull($client->client_number);
        $this->assertNull($client->lead_id);
        $this->assertSame('Direct Client', $client->name);
        $this->assertSame(0, $client->leads()->count());
    }

    public function test_lead_can_be_linked_to_an_existing_client(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create([
            'name'   => 'Existing Client',
            'status' => 'active',
        ]);

        $this->actingAs($admin)
            ->post('/leads', [
                'name'      => 'Follow-up lead',
                'source'    => 'manual',
                'client_id' => $client->id,
            ])
            ->assertRedirect();

        $lead = Lead::where('name', 'Follow-up lead')->first();

        $this->assertNotNull($lead);
        $this->assertSame($client->id, $lead->client_id);
        $this->assertSame(1, $client->fresh()->leads()->count());
    }

    public function test_converting_a_linked_lead_does_not_create_another_client(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create([
            'name'            => 'Existing Client',
            'status'          => 'active',
            'compliance_type' => 'monthly',
        ]);
        $lead = Lead::create([
            'name'      => 'Linked lead',
            'source'    => 'manual',
            'status'    => 'contacted',
            'client_id' => $client->id,
        ]);

        $this->actingAs($admin)
            ->post("/leads/{$lead->id}/convert")
            ->assertRedirect(route('clients.show', $client));

        $this->assertSame(1, Client::count());
        $this->assertNotNull($lead->fresh()->converted_at);
        $this->assertSame($client->id, $lead->fresh()->client_id);
        $this->assertSame('won', $lead->fresh()->status);
    }

    public function test_unlinked_lead_convert_still_creates_a_client(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $lead = Lead::create([
            'name'   => 'Pipeline lead',
            'source' => 'manual',
            'status' => 'contacted',
        ]);

        $this->actingAs($admin)
            ->post("/leads/{$lead->id}/convert", [
                'compliance_type' => 'project',
            ])
            ->assertRedirect();

        $this->assertSame(1, Client::count());
        $client = $lead->fresh()->client;
        $this->assertNotNull($client);
        $this->assertSame($lead->id, $client->lead_id);
        $this->assertSame($client->id, $lead->fresh()->client_id);
        $this->assertSame('Pipeline lead', $client->name);
        $this->assertSame('project', $client->compliance_type);
    }

    public function test_sales_cannot_link_a_lead_to_another_users_client(): void
    {
        $sales = User::factory()->create(['role' => 'sales', 'is_active' => true]);
        $other = User::factory()->create(['role' => 'sales', 'is_active' => true]);
        $client = Client::create([
            'name'        => 'Other client',
            'status'      => 'active',
            'assigned_to' => $other->id,
        ]);

        $this->actingAs($sales)
            ->post('/leads', [
                'name'      => 'Stolen link',
                'source'    => 'manual',
                'client_id' => $client->id,
            ])
            ->assertNotFound();

        $this->assertDatabaseMissing('leads', ['name' => 'Stolen link']);
    }

    public function test_client_show_lists_related_leads(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'Account', 'status' => 'active']);
        Lead::create(['name' => 'Lead A', 'source' => 'manual', 'client_id' => $client->id]);
        Lead::create(['name' => 'Lead B', 'source' => 'manual', 'client_id' => $client->id]);

        $this->actingAs($admin)
            ->get("/clients/{$client->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Clients/Show')
                ->has('client.leads', 2)
            );
    }
}
