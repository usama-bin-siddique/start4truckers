<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DocumentSearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('private');
    }

    public function test_search_by_client_name_returns_all_of_that_clients_documents(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $john = $this->makeClient(['name' => 'John Smith']);
        $other = $this->makeClient(['name' => 'Jane Doe']);
        $this->makeDocument($john, $admin, 'w9.pdf');
        $this->makeDocument($john, $admin, 'license.jpg', 'driver_license');
        $this->makeDocument($other, $admin, 'other.pdf');

        $this->actingAs($admin)
            ->get('/documents?search='.urlencode('John Smith'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Documents/Index')
                ->has('documents.data', 2)
                ->where('focused_client.id', $john->id)
                ->where('focused_client.name', 'John Smith')
                ->where('documents.data.0.client_name', 'John Smith')
                ->where('documents.data.0.client_id', $john->id)
                ->where('documents.data.1.client_id', $john->id)
            );
    }

    public function test_search_by_numeric_client_id_returns_that_clients_documents(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $client = $this->makeClient(['name' => 'Fleet Owner']);
        $this->makeDocument($client, $admin, 'insurance.pdf', 'insurance');
        $this->makeDocument($this->makeClient(['name' => 'Someone Else']), $admin, 'skip.pdf');

        $this->actingAs($admin)
            ->get('/documents?search='.urlencode('Client ID: '.$client->id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Documents/Index')
                ->has('documents.data', 1)
                ->where('focused_client.id', $client->id)
                ->where('documents.data.0.original_filename', 'insurance.pdf')
                ->where('documents.data.0.client_id', $client->id)
            );
    }

    public function test_search_by_client_number_returns_that_clients_documents(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $client = $this->makeClient(['name' => 'Numbered Client']);
        $this->makeDocument($client, $admin, 'title.pdf', 'vehicle_title');

        $this->actingAs($admin)
            ->get('/documents?search='.urlencode($client->client_number))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Documents/Index')
                ->has('documents.data', 1)
                ->where('focused_client.client_number', $client->client_number)
                ->where('documents.data.0.client_number', $client->client_number)
            );
    }

    public function test_client_id_filter_shows_all_documents_for_that_client(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $client = $this->makeClient(['name' => 'Filter Client']);
        $this->makeDocument($client, $admin, 'a.pdf');
        $this->makeDocument($client, $admin, 'b.pdf');
        $this->makeDocument($this->makeClient(['name' => 'Other']), $admin, 'c.pdf');

        $this->actingAs($admin)
            ->get('/documents?client_id='.$client->id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Documents/Index')
                ->has('documents.data', 2)
                ->where('focused_client.id', $client->id)
            );
    }

    public function test_sales_cannot_search_documents_for_unassigned_clients(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $other = User::factory()->create(['role' => 'sales']);
        $hidden = $this->makeClient(['name' => 'John Smith', 'assigned_to' => $other->id]);
        $this->makeDocument($hidden, $other, 'secret.pdf');

        $this->actingAs($sales)
            ->get('/documents?search='.urlencode('John Smith'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Documents/Index')
                ->has('documents.data', 0)
                ->where('focused_client', null)
            );
    }

    public function test_partial_name_search_does_not_leak_unrelated_documents(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $alice = $this->makeClient(['name' => 'Alice Freight']);
        $bob = $this->makeClient(['name' => 'Bob Logistics']);
        $this->makeDocument($alice, $admin, 'alice-w9.pdf');
        $this->makeDocument($bob, $admin, 'bob-w9.pdf');

        $this->actingAs($admin)
            ->get('/documents?search='.urlencode('Alice Freight'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Documents/Index')
                ->has('documents.data', 1)
                ->where('documents.data.0.original_filename', 'alice-w9.pdf')
                ->where('documents.data.0.client_id', $alice->id)
            );
    }

    public function test_filename_search_still_finds_documents(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $client = $this->makeClient(['name' => 'File Client']);
        $this->makeDocument($client, $admin, 'insurance-certificate.pdf', 'insurance');
        $this->makeDocument($this->makeClient(['name' => 'Other']), $admin, 'unrelated.pdf');

        $this->actingAs($admin)
            ->get('/documents?search='.urlencode('insurance-certificate'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Documents/Index')
                ->has('documents.data', 1)
                ->where('documents.data.0.original_filename', 'insurance-certificate.pdf')
            );
    }

    public function test_document_can_be_viewed_inline(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $client = $this->makeClient(['name' => 'View Client']);
        $document = $this->makeDocument($client, $admin, 'w9.pdf');

        $this->actingAs($admin)
            ->get("/documents/{$document->id}/view")
            ->assertOk()
            ->assertHeader('content-disposition', 'inline; filename=w9.pdf');
    }

    private function makeClient(array $overrides = []): Client
    {
        return Client::create(array_merge([
            'name'   => 'Test Client',
            'status' => 'active',
        ], $overrides));
    }

    private function makeDocument(Client $client, User $uploader, string $filename, string $category = 'w9'): Document
    {
        $path = "clients/{$client->id}/documents/{$filename}";
        Storage::disk('private')->put($path, 'file-contents');

        return Document::create([
            'client_id'          => $client->id,
            'category'           => $category,
            'original_filename'  => $filename,
            'stored_path'        => $path,
            'mime_type'          => 'application/pdf',
            'file_size'          => 13,
            'uploaded_by'        => $uploader->id,
        ]);
    }
}
