<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebsiteLeadApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_rejects_request_without_api_key(): void
    {
        Setting::set('website_api_key', 'test-secret-key', 'api');

        $this->postJson('/api/leads', [
            'name'  => 'Jane Doe',
            'email' => 'jane@example.com',
        ])->assertUnauthorized();
    }

    public function test_creates_a_website_lead(): void
    {
        Setting::set('website_api_key', 'test-secret-key', 'api');

        $this->postJson('/api/leads', [
            'name'             => 'Jane Doe',
            'email'            => 'jane@example.com',
            'phone'            => '555-0100',
            'state'            => 'TX',
            'service_required' => 'DOT Number',
            'notes'            => 'Need help getting started',
        ], [
            'X-API-Key' => 'test-secret-key',
        ])->assertCreated()
            ->assertJsonPath('data.status', 'new');

        $this->assertDatabaseHas('leads', [
            'name'   => 'Jane Doe',
            'email'  => 'jane@example.com',
            'source' => 'website',
            'status' => Lead::STATUS_NEW,
        ]);
    }

    public function test_saves_the_lead_when_the_email_is_not_a_perfect_address(): void
    {
        Setting::set('website_api_key', 'test-secret-key', 'api');

        $this->postJson('/api/leads', [
            'name'  => 'Jane Doe',
            'Email' => ' jane@gmail ',
            'phone' => '555-0100',
        ], [
            'X-API-Key' => 'test-secret-key',
        ])->assertCreated();

        $this->assertDatabaseHas('leads', [
            'name'  => 'Jane Doe',
            'email' => 'jane@gmail',
        ]);
    }

    public function test_web3forms_saves_an_email_sent_under_another_field_name(): void
    {
        $this->postJson('/api/webhook/web3forms', [
            'name'       => 'Form Driver',
            'your-email' => 'driver@example.com',
            'phone'      => '555-0199',
        ])->assertCreated();

        $this->assertDatabaseHas('leads', [
            'name'  => 'Form Driver',
            'email' => 'driver@example.com',
            'source'=> 'website',
        ]);
    }
}
