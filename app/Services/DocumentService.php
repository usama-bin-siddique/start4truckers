<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Document;
use App\Models\Lead;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class DocumentService
{
    public function __construct(private ActivityService $activity) {}

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
