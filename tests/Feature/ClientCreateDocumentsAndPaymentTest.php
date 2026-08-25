<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Document;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClientCreateDocumentsAndPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_form_includes_optional_document_and_payment_props(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);

        $this->actingAs($admin)
            ->get('/clients/create')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Clients/Create')
                ->has('doc_categories')
                ->where('can_upload_documents', true)
                ->where('can_add_payment', true)
            );
    }

    public function test_client_can_be_created_without_documents_or_payment(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);

        $this->actingAs($admin)
            ->post('/clients', [
                'name' => 'Bare Client',
            ])
            ->assertRedirect();

        $client = Client::where('name', 'Bare Client')->first();
        $this->assertNotNull($client);
        $this->assertSame(0, $client->documents()->count());
        $this->assertSame(0, $client->payments()->count());
    }

    public function test_optional_documents_are_stored_when_creating_a_client(): void
    {
        Storage::fake('private');

        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $file = UploadedFile::fake()->create('w9.pdf', 40, 'application/pdf');

        $this->actingAs($admin)
            ->post('/clients', [
                'name'      => 'Docs Client',
                'documents' => [
                    [
                        'category' => 'w9',
                        'file'     => $file,
                    ],
                ],
            ])
            ->assertRedirect();

        $client = Client::where('name', 'Docs Client')->first();
        $this->assertNotNull($client);
        $this->assertSame(1, Document::where('client_id', $client->id)->count());
        $this->assertDatabaseHas('documents', [
            'client_id'          => $client->id,
            'category'           => 'w9',
            'original_filename'  => 'w9.pdf',
        ]);
    }

    public function test_multiple_document_rows_keep_their_types(): void
    {
        Storage::fake('private');

        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $w9 = UploadedFile::fake()->create('w9.pdf', 40, 'application/pdf');
        $insurance = UploadedFile::fake()->create('coi.pdf', 40, 'application/pdf');

        $this->actingAs($admin)
            ->post('/clients', [
                'name'      => 'Multi Docs Client',
                'documents' => [
                    ['category' => 'w9', 'file' => $w9],
                    ['category' => 'insurance', 'file' => $insurance],
                ],
            ])
            ->assertRedirect();

        $client = Client::where('name', 'Multi Docs Client')->first();
        $this->assertNotNull($client);
        $this->assertSame(2, Document::where('client_id', $client->id)->count());
        $this->assertDatabaseHas('documents', [
            'client_id'         => $client->id,
            'category'          => 'w9',
            'original_filename' => 'w9.pdf',
        ]);
        $this->assertDatabaseHas('documents', [
            'client_id'         => $client->id,
            'category'          => 'insurance',
            'original_filename' => 'coi.pdf',
        ]);
    }

    public function test_custom_document_type_is_stored_when_creating_a_client(): void
    {
        Storage::fake('private');

        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $file = UploadedFile::fake()->create('bol.pdf', 40, 'application/pdf');

        $this->actingAs($admin)
            ->post('/clients', [
                'name'      => 'Custom Type Client',
                'documents' => [
                    ['category' => 'Bill of Lading', 'file' => $file],
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('documents', [
            'category'          => 'Bill of Lading',
            'original_filename' => 'bol.pdf',
        ]);
    }

    public function test_document_row_without_a_type_does_not_create_the_client(): void
    {
        Storage::fake('private');

        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $file = UploadedFile::fake()->create('w9.pdf', 40, 'application/pdf');

        $this->actingAs($admin)
            ->post('/clients', [
                'name'      => 'Missing Type Client',
                'documents' => [
                    ['category' => '', 'file' => $file],
                ],
            ])
            ->assertSessionHasErrors('documents.0.category');

        $this->assertNull(Client::where('name', 'Missing Type Client')->first());
    }

    public function test_optional_payment_is_recorded_when_creating_a_client(): void
    {
        Storage::fake('private');

        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $receipt = UploadedFile::fake()->create('proof.pdf', 30, 'application/pdf');

        $this->actingAs($admin)
            ->post('/clients', [
                'name'    => 'Paid Client',
                'payment' => [
                    'invoice_amount'        => 500,
                    'amount_received'       => 200,
                    'payment_method'        => 'zelle',
                    'transaction_reference' => 'TX-99',
                    'receipt'               => $receipt,
                ],
            ])
            ->assertRedirect();

        $client = Client::where('name', 'Paid Client')->first();
        $this->assertNotNull($client);
        $this->assertSame(1, Payment::where('client_id', $client->id)->count());
        $this->assertDatabaseHas('payments', [
            'client_id'             => $client->id,
            'invoice_amount'        => 500,
            'amount_received'       => 200,
            'payment_method'        => 'zelle',
            'transaction_reference' => 'TX-99',
        ]);
        $this->assertNotNull($client->payments()->first()->receipt_path);
    }

    public function test_payment_without_invoice_amount_is_rejected_and_does_not_create_the_client(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);

        $this->actingAs($admin)
            ->post('/clients', [
                'name'    => 'Invalid Payment Client',
                'payment' => [
                    'amount_received' => 50,
                ],
            ])
            ->assertSessionHasErrors('payment.invoice_amount');

        $this->assertNull(Client::where('name', 'Invalid Payment Client')->first());
        $this->assertSame(0, Payment::count());
    }
}
