<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_uploads_nested_category_files_for_a_client(): void
    {
        Storage::fake('private');

        $user = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create([
            'name'   => 'Test Driver',
            'source' => 'manual',
            'status' => 'won',
        ]);
        $client = Client::create([
            'lead_id' => $lead->id,
            'status'  => 'active',
        ]);

        $file = UploadedFile::fake()->image('license.jpg');

        $this->actingAs($user)
            ->from("/clients/{$client->id}")
            ->post('/documents', [
                'client_id' => $client->id,
                'files'     => [
                    'driver_license' => [$file],
                ],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('documents', [
            'client_id'          => $client->id,
            'category'           => 'driver_license',
            'original_filename'  => 'license.jpg',
        ]);
    }
}
