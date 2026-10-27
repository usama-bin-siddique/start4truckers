<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\ClientReminder;
use App\Models\ClientVehicle;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ClientDeletionAndProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_admin_can_delete_a_client(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $sales = User::factory()->create(['role' => 'sales']);

        $client = Client::create(['name' => 'Acme Logistics', 'status' => 'onboarding']);
        $lead = Lead::create(['name' => 'Lead Guy', 'client_id' => $client->id]);
        ClientReminder::create([
            'client_id' => $client->id,
            'description' => 'Test reminder',
            'remind_at' => now()->addDay(),
            'created_by' => $admin->id,
        ]);
        ClientVehicle::create([
            'client_id' => $client->id,
            'vin' => '1234567890ABCDEFG',
        ]);

        // Sales user cannot delete client
        $this->actingAs($sales)
            ->delete("/clients/{$client->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('clients', ['id' => $client->id]);

        // Admin can delete client
        $this->actingAs($admin)
            ->delete("/clients/{$client->id}")
            ->assertRedirect('/clients');

        // Client soft deleted
        $this->assertSoftDeleted('clients', ['id' => $client->id]);
        // Lead unlinked
        $this->assertDatabaseHas('leads', ['id' => $lead->id, 'client_id' => null]);
        // Child relations cleaned
        $this->assertDatabaseMissing('client_reminders', ['client_id' => $client->id]);
        $this->assertDatabaseMissing('client_vehicles', ['client_id' => $client->id]);
    }

    public function test_user_can_view_and_update_profile_information(): void
    {
        $user = User::factory()->create([
            'name' => 'Original Name',
            'email' => 'original@example.com',
            'role' => 'sales',
        ]);

        $this->actingAs($user)
            ->get('/profile')
            ->assertOk();

        $this->actingAs($user)
            ->put('/profile', [
                'name' => 'Updated Name',
                'email' => 'updated@example.com',
            ])
            ->assertRedirect();

        $user->refresh();
        $this->assertSame('Updated Name', $user->name);
        $this->assertSame('updated@example.com', $user->email);
    }

    public function test_user_can_change_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('old-password123'),
        ]);

        $this->actingAs($user)
            ->put('/profile/password', [
                'current_password' => 'wrong-password',
                'password' => 'new-password123',
                'password_confirmation' => 'new-password123',
            ])
            ->assertSessionHasErrors(['current_password']);

        $this->actingAs($user)
            ->put('/profile/password', [
                'current_password' => 'old-password123',
                'password' => 'new-password123',
                'password_confirmation' => 'new-password123',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $user->refresh();
        $this->assertTrue(Hash::check('new-password123', $user->password));
    }
}
