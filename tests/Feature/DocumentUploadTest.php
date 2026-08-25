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

    public function test_uploads_document_rows_with_types_for_an_existing_client(): void
    {
        Storage::fake('private');

        $user = User::factory()->create(['role' => 'admin']);
        $client = Client::create([
            'name'   => 'Existing Client',
            'status' => 'active',
        ]);
        $w9 = UploadedFile::fake()->create('w9.pdf', 40, 'application/pdf');
        $bol = UploadedFile::fake()->create('bol.pdf', 40, 'application/pdf');

        $this->actingAs($user)
            ->from("/clients/{$client->id}")
            ->post('/documents', [
                'client_id' => $client->id,
                'documents' => [
                    ['category' => 'w9', 'file' => $w9],
                    ['category' => 'Bill of Lading', 'file' => $bol],
                ],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame(2, $client->documents()->count());
        $this->assertDatabaseHas('documents', [
            'client_id'         => $client->id,
            'category'          => 'w9',
            'original_filename' => 'w9.pdf',
        ]);
        $this->assertDatabaseHas('documents', [
            'client_id'         => $client->id,
            'category'          => 'Bill of Lading',
            'original_filename' => 'bol.pdf',
        ]);
    }
}
