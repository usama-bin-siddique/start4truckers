<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LeadEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_compose_page_renders_for_lead(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $lead = Lead::create(['name' => 'Jane Driver', 'email' => 'jane@example.com', 'source' => 'manual']);

        $this->actingAs($admin)
            ->get("/leads/{$lead->id}/email")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Leads/Email')
                ->where('lead.email', 'jane@example.com')
                ->has('templates'));
    }

    public function test_email_is_sent_with_attachments_through_configured_mailer(): void
    {
        config(['mail.default' => 'array']);

        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true, 'email' => 'agent@example.com']);
        $lead = Lead::create(['name' => 'Jane Driver', 'email' => 'jane@example.com', 'source' => 'manual']);

        $this->actingAs($admin)
            ->post("/leads/{$lead->id}/email", [
                'subject'     => 'Your MC number',
                'body'        => "Hi Jane,\n\nPlease see attached.",
                'attachments' => [UploadedFile::fake()->create('quote.pdf', 120, 'application/pdf')],
            ])
            ->assertRedirect("/leads/{$lead->id}")
            ->assertSessionHas('success');

        $messages = Mail::mailer('array')->getSymfonyTransport()->messages();
        $this->assertCount(1, $messages);

        $email = $messages[0]->getOriginalMessage();
        $this->assertSame('Your MC number', $email->getSubject());
        $this->assertSame('jane@example.com', $email->getTo()[0]->getAddress());
        $this->assertSame('agent@example.com', $email->getReplyTo()[0]->getAddress());
        $this->assertStringContainsString('Please see attached.', $email->getHtmlBody());
        $this->assertSame('quote.pdf', $email->getAttachments()[0]->getFilename());

        $this->assertDatabaseHas('activities', [
            'subject_id' => $lead->id,
            'action'     => Activity::ACTION_EMAIL_SENT,
        ]);
    }

    public function test_email_requires_subject_and_body(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $lead = Lead::create(['name' => 'Jane Driver', 'email' => 'jane@example.com', 'source' => 'manual']);

        $this->actingAs($admin)
            ->post("/leads/{$lead->id}/email", [])
            ->assertSessionHasErrors(['subject', 'body']);

        Mail::assertNothingSent();
    }
}
