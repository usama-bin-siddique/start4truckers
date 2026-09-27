<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Http\UploadedFile;
use Illuminate\Mail\Attachment;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * A free-form email written by a CRM user to a lead or client.
 */
class CustomerEmail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<UploadedFile|Attachment>  $files
     */
    public function __construct(
        public string $mailSubject,
        public string $body,
        public array $files = [],
        public ?string $replyToEmail = null,
        public ?string $replyToName = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->mailSubject,
            replyTo: $this->replyToEmail ? [new Address($this->replyToEmail, $this->replyToName)] : [],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.customer',
            text: 'emails.customer-text',
        );
    }

    public function attachments(): array
    {
        return array_map(
            fn (UploadedFile|Attachment $file) => $file instanceof Attachment
                ? $file
                : Attachment::fromPath($file->getRealPath())
                    ->as($file->getClientOriginalName())
                    ->withMime($file->getClientMimeType()),
            $this->files
        );
    }
}
