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
}
