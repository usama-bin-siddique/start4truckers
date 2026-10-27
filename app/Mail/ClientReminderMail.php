<?php

namespace App\Mail;

use App\Models\Client;
use App\Models\ClientReminder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClientReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ClientReminder $reminder,
        public Client $client
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Reminder for {$this->client->display_name}: {$this->reminder->description}"
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reminder',
            text: 'emails.reminder-text',
            with: [
                'reminder'  => $this->reminder,
                'client'    => $this->client,
                'clientUrl' => url("/clients/{$this->client->id}"),
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
