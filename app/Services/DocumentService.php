<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Document;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\Request;
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

        $normalized = Document::normalizeCategory($category);

        if ($normalized === '') {
            throw ValidationException::withMessages([
                'category' => 'A document type is required.',
            ]);
        }

        $document = Document::create([
            'lead_id'           => $owner instanceof Lead ? $owner->id : $owner->lead_id,
            'client_id'         => $owner instanceof Client ? $owner->id : null,
            'category'          => $normalized,
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
     * @return list<array{index: int, file: UploadedFile|null, category: string}>
     */
    public function documentRowsFromRequest(Request $request): array
    {
        $inputs = $request->input('documents', []);
        if (! is_array($inputs)) {
            $inputs = [];
        }

        $files = $request->file('documents', []);
        if (! is_array($files)) {
            $files = [];
        }

        $indexes = array_unique(array_merge(array_keys($inputs), array_keys($files)));
        sort($indexes);

        $rows = [];

        foreach ($indexes as $index) {
            if (! is_int($index) && ! ctype_digit((string) $index)) {
                continue;
            }

            $index = (int) $index;
            $file = $files[$index]['file'] ?? null;
            $category = is_array($inputs[$index] ?? null)
                ? trim((string) ($inputs[$index]['category'] ?? ''))
                : '';

            if (! $file instanceof UploadedFile && $category === '') {
                continue;
            }

            $rows[] = [
                'index'    => $index,
                'file'     => $file instanceof UploadedFile ? $file : null,
                'category' => $category,
            ];
        }

        return $rows;
    }

    public function hasDocumentRows(Request $request): bool
    {
        foreach ($this->documentRowsFromRequest($request) as $row) {
            if ($row['file'] instanceof UploadedFile) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return list<array{index: int, file: UploadedFile, category: string}>
     */
    public function validateDocumentRows(Request $request): array
    {
        $request->validate([
            'documents'            => ['required', 'array'],
            'documents.*.file'     => ['nullable', 'file', 'max:20480', 'mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx'],
            'documents.*.category' => ['nullable', 'string', 'max:100'],
        ]);

        $errors = [];
        $ready  = [];

        foreach ($this->documentRowsFromRequest($request) as $row) {
            $i = $row['index'];

            if (! $row['file'] instanceof UploadedFile) {
                $errors["documents.{$i}.file"] = 'Choose a file for this document.';
                continue;
            }

            $category = Document::normalizeCategory($row['category']);

            if ($category === '') {
                $errors["documents.{$i}.category"] = 'Choose or enter a document type.';
                continue;
            }

            $ready[] = [
                'index'    => $i,
                'file'     => $row['file'],
                'category' => $category,
            ];
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        if ($ready === []) {
            throw ValidationException::withMessages([
                'documents' => 'Add at least one document, or leave this section empty.',
            ]);
        }

        return $ready;
    }

    /**
     * @param  list<array{file: UploadedFile, category: string}>  $rows
     * @return list<Document>
     */
    public function storeDocumentRows(Lead|Client $owner, array $rows, ?int $uploadedBy = null): array
    {
        $stored = [];

        foreach ($rows as $row) {
            $file = $row['file'] ?? null;
            $category = (string) ($row['category'] ?? '');

            if ($file instanceof UploadedFile && $category !== '') {
                $stored[] = $this->storeFor($owner, $category, $file, $uploadedBy);
            }
        }

        return $stored;
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
