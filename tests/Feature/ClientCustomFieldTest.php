<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\ClientCustomField;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClientCustomFieldTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_profile_includes_custom_fields_section(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'Profile Client', 'status' => 'onboarding']);
        ClientCustomField::create([
            'client_id' => $client->id,
            'label'     => 'TWIC expiration',
            'value'     => '2027-03-01',
        ]);

        $this->actingAs($admin)
            ->get("/clients/{$client->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Clients/Show')
                ->has('client.custom_fields', 1)
                ->where('client.custom_fields.0.label', 'TWIC expiration')
                ->where('client.custom_fields.0.value', '2027-03-01')
            );
    }

    public function test_custom_field_can_be_added_updated_and_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $client = Client::create(['name' => 'Flexible Client', 'status' => 'onboarding']);

        $this->actingAs($admin)
            ->from("/clients/{$client->id}")
            ->post("/clients/{$client->id}/custom-fields", [
                'label' => 'Factoring company',
                'value' => 'RTS Financial',
            ])
            ->assertRedirect();

        $field = ClientCustomField::where('client_id', $client->id)->first();
        $this->assertNotNull($field);
        $this->assertSame('Factoring company', $field->label);
        $this->assertSame('RTS Financial', $field->value);

        $this->actingAs($admin)
            ->put("/clients/{$client->id}/custom-fields/{$field->id}", [
                'label' => 'Factoring company',
                'value' => 'OTR Capital',
            ])
            ->assertRedirect();

        $this->assertSame('OTR Capital', $field->fresh()->value);

        $this->actingAs($admin)
            ->delete("/clients/{$client->id}/custom-fields/{$field->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('client_custom_fields', ['id' => $field->id]);
    }

    public function test_custom_fields_belong_only_to_that_client(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $alpha = Client::create(['name' => 'Alpha', 'status' => 'onboarding']);
        $beta = Client::create(['name' => 'Beta', 'status' => 'onboarding']);

        $this->actingAs($admin)
            ->post("/clients/{$alpha->id}/custom-fields", [
                'label' => 'IRP account',
                'value' => 'IRP-100',
            ])
            ->assertRedirect();

        $this->assertSame(1, ClientCustomField::where('client_id', $alpha->id)->count());
        $this->assertSame(0, ClientCustomField::where('client_id', $beta->id)->count());
    }

    public function test_sales_cannot_add_custom_fields_on_an_unassigned_client(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $sales = User::factory()->create(['role' => 'sales', 'is_active' => true]);
        $client = Client::create([
            'name'        => 'Someone Else',
            'status'      => 'onboarding',
            'assigned_to' => $admin->id,
        ]);

        $this->actingAs($sales)
            ->post("/clients/{$client->id}/custom-fields", [
                'label' => 'Should not save',
                'value' => 'nope',
            ])
            ->assertForbidden();

        $this->assertSame(0, ClientCustomField::count());
    }
}
