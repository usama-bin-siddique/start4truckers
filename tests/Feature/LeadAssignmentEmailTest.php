<?php

namespace Tests\Feature;

use App\Mail\CustomerEmail;
use App\Models\EmailTemplate;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class LeadAssignmentEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_assigning_a_lead_emails_the_assignee(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $sales = User::factory()->create(['role' => 'sales', 'is_active' => true, 'email' => 'sales@example.com', 'name' => 'Sam Sales']);
        $lead = Lead::create([
            'name'    => 'Jane Driver',
            'email'   => 'jane@example.com',
            'phone'   => '555-0100',
            'source'  => 'manual',
            'company' => 'Driver LLC',
        ]);

        EmailTemplate::create([
            'name'    => 'Lead Assigned',
            'slug'    => 'lead_assigned',
            'subject' => 'Lead Assigned to You: {{lead_name}}',
            'body'    => "Hello {{user_name}},\n\nA lead has been assigned to you.\n\nLead: {{lead_name}}\nPhone: {{lead_phone}}\nEmail: {{lead_email}}",
        ]);

        $this->actingAs($admin)
            ->post("/leads/{$lead->id}/assign", ['assigned_to' => $sales->id])
            ->assertRedirect()
            ->assertSessionHas('success');

        Mail::assertSent(CustomerEmail::class, function (CustomerEmail $mail) use ($sales) {
            return $mail->hasTo('sales@example.com')
                && $mail->mailSubject === 'Lead Assigned to You: Jane Driver'
                && str_contains($mail->body, 'Hello Sam Sales')
                && str_contains($mail->body, 'jane@example.com')
                && str_contains($mail->body, '555-0100')
                && str_contains($mail->body, "/leads/");
        });

        $this->assertDatabaseHas('crm_notifications', [
            'user_id' => $sales->id,
            'type'    => 'lead_assigned',
        ]);

        $this->actingAs($admin)
            ->post("/leads/{$lead->id}/assign", ['assigned_to' => $sales->id])
            ->assertRedirect();

        Mail::assertSent(CustomerEmail::class, 1);
    }

    public function test_creating_or_editing_a_lead_emails_the_new_assignee(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $sales = User::factory()->create(['role' => 'sales', 'is_active' => true, 'email' => 'sales@example.com']);

        $this->actingAs($admin)
            ->post('/leads', [
                'name'        => 'New Lead',
                'source'      => 'manual',
                'assigned_to' => $sales->id,
            ])
            ->assertRedirect();

        Mail::assertSent(CustomerEmail::class, fn (CustomerEmail $mail) => $mail->hasTo('sales@example.com')
            && str_contains($mail->mailSubject, 'New Lead'));

        $lead = Lead::where('name', 'New Lead')->firstOrFail();
        $other = User::factory()->create(['role' => 'manager', 'is_active' => true, 'email' => 'manager@example.com']);

        $this->actingAs($admin)
            ->put("/leads/{$lead->id}", [
                'name'        => 'New Lead',
                'source'      => 'manual',
                'status'      => 'new',
                'assigned_to' => $other->id,
            ])
            ->assertRedirect();

        Mail::assertSent(CustomerEmail::class, fn (CustomerEmail $mail) => $mail->hasTo('manager@example.com')
            && str_contains($mail->body, 'New Lead'));
        Mail::assertSent(CustomerEmail::class, 2);
    }
}
