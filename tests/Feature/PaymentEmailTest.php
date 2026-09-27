<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PaymentEmailTest extends TestCase
{
    use RefreshDatabase;

    private function makePayment(User $admin, array $attributes = []): Payment
    {
        $client = Client::create([
            'name'   => 'Invoice Client',
            'email'  => 'invoice@example.com',
            'status' => 'active',
        ]);

        return Payment::create(array_merge([
            'client_id'       => $client->id,
            'invoice_amount'  => 250,
            'amount_received' => 100,
            'payment_method'  => 'zelle',
            'created_by'      => $admin->id,
        ], $attributes));
    }

    public function test_compose_page_uses_client_email(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $payment = $this->makePayment($admin);

        $this->actingAs($admin)
            ->get("/payments/{$payment->id}/email")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Payments/Email')
                ->where('payment.email', 'invoice@example.com')
                ->where('payment.balance_due', 150));
    }

    public function test_email_is_sent_with_invoice_pdf_receipt_and_uploads(): void
    {
        config(['mail.default' => 'array']);
        Storage::fake('private');
        Storage::disk('private')->put('receipts/r1.png', 'image-bytes');

        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true, 'email' => 'agent@example.com']);
        $payment = $this->makePayment($admin, ['receipt_path' => 'receipts/r1.png']);

        $this->actingAs($admin)
            ->post("/payments/{$payment->id}/email", [
                'subject'        => 'Payment received',
                'body'           => 'Thanks for your payment.',
                'attach_invoice' => '1',
                'attach_receipt' => '1',
                'attachments'    => [UploadedFile::fake()->create('extra.pdf', 20, 'application/pdf')],
            ])
            ->assertRedirect('/payments')
            ->assertSessionHas('success');

        $messages = Mail::mailer('array')->getSymfonyTransport()->messages();
        $this->assertCount(1, $messages);

        $email = $messages[0]->getOriginalMessage();
        $this->assertSame('invoice@example.com', $email->getTo()[0]->getAddress());
        $this->assertSame('agent@example.com', $email->getReplyTo()[0]->getAddress());

        $attachments = collect($email->getAttachments());
        $names = $attachments->map->getFilename()->all();
        $this->assertSame(['extra.pdf', "Invoice-{$payment->invoice_number}.pdf", "Receipt-{$payment->invoice_number}.png"], $names);
        $this->assertStringStartsWith('%PDF', $attachments[1]->getBody());

        $this->assertDatabaseHas('activities', [
            'subject_id' => $payment->client_id,
            'action'     => Activity::ACTION_EMAIL_SENT,
        ]);
    }

    public function test_email_without_invoice_option_sends_no_attachments(): void
    {
        config(['mail.default' => 'array']);

        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $payment = $this->makePayment($admin);

        $this->actingAs($admin)
            ->post("/payments/{$payment->id}/email", [
                'subject'        => 'Hello',
                'body'           => 'Just checking in.',
                'attach_invoice' => '0',
            ])
            ->assertRedirect('/payments');

        $email = Mail::mailer('array')->getSymfonyTransport()->messages()[0]->getOriginalMessage();
        $this->assertCount(0, $email->getAttachments());
    }
}
