<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Document;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class DocumentService
{
    public function __construct(
        private ActivityService $activity,
        private NotificationService $notification
    ) {}

    public function storeFor(Lead|Client $owner, string $category, UploadedFile $file, ?int $uploadedBy = null): Document
    {
        $folder = $owner instanceof Lead
            ? "leads/{$owner->id}/documents"
            : "clients/{$owner->id}/documents";

        $path = $file->store($folder, 'private');

        $document = Document::create([
            'lead_id'           => $owner instanceof Lead ? $owner->id : $owner->lead_id,
            'client_id'         => $owner instanceof Client ? $owner->id : null,
            'category'          => $category,
            'original_filename' => $file->getClientOriginalName(),
            'stored_path'       => $path,
            'mime_type'         => $file->getMimeType(),
            'file_size'         => $file->getSize(),
            'uploaded_by'       => $uploadedBy ?? Auth::id(),
        ]);

        $this->activity->log(
            $owner,
            Activity::ACTION_DOCUMENT_UPLOADED,
            "Document \"{$document->original_filename}\" uploaded ({$document->category_label})"
        );

        $payload = [
            'document_id' => $document->id,
            'filename'    => $document->original_filename,
            'category'    => $document->category_label,
        ];

        if ($owner instanceof Client) {
            $this->notification->notifyClientStakeholders($owner, NotificationService::TYPE_DOCUMENT_UPLOADED, array_merge($payload, [
                'client_id'     => $owner->id,
                'client_name'   => $owner->display_name,
                'client_number' => $owner->client_number,
            ]));
        } else {
            $recipients = User::query()
                ->where('is_active', true)
                ->where('role', 'admin')
                ->pluck('id')
                ->all();
            if ($owner->assigned_to) {
                $recipients[] = (int) $owner->assigned_to;
            }
            $this->notification->notifyMultiple($recipients, NotificationService::TYPE_DOCUMENT_UPLOADED, array_merge($payload, [
                'lead_id'   => $owner->id,
                'lead_name' => $owner->name,
            ]));
        }

        return $document;
    }

    /**
     * @param  array<string, mixed>  $uploads
     * @return list<Document>
     */
    public function storeCategoryUploads(Lead|Client $owner, array $uploads, ?int $uploadedBy = null): array
    {
        $allowed = array_keys(Document::CATEGORIES);
        $stored  = [];

        foreach ($uploads as $category => $fileList) {
            if (! in_array($category, $allowed, true)) {
                throw ValidationException::withMessages([
                    'files' => "Invalid document category: {$category}.",
                ]);
            }

            $fileList = is_array($fileList) ? $fileList : [$fileList];

            foreach ($fileList as $file) {
                if ($file instanceof UploadedFile) {
                    $stored[] = $this->storeFor($owner, $category, $file, $uploadedBy);
                }
            }
        }

        return $stored;
    }
}
