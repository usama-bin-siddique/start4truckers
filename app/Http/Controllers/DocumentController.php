<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Document;
use App\Models\Lead;
use App\Services\ActivityService;
use App\Services\DocumentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function __construct(
        private ActivityService $activity,
        private DocumentService $documents
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Document::class);

        $query = Document::with(['client.lead', 'lead', 'uploadedBy'])
            ->when($request->search, fn ($q, $v) =>
                $q->where(fn ($q) =>
                    $q->where('original_filename', 'like', "%{$v}%")
                      ->orWhereHas('client.lead', fn ($q) => $q->where('name', 'like', "%{$v}%"))
                      ->orWhereHas('lead', fn ($q) => $q->where('name', 'like', "%{$v}%"))
                )
            )
            ->when($request->category, fn ($q, $v) => $q->where('category', $v))
            ->when($request->client_id, fn ($q, $v) => $q->where('client_id', $v));

        $documents = $query->latest()->paginate(25)->withQueryString();

        return Inertia::render('Documents/Index', [
            'documents'  => $documents->through(fn ($d) => [
                'id'                => $d->id,
                'client_id'         => $d->client_id,
                'lead_id'           => $d->lead_id,
                'client_number'     => $d->client?->client_number,
                'client_name'       => $d->client?->lead?->name ?? $d->lead?->name ?? '—',
                'category'          => $d->category,
                'category_label'    => $d->category_label,
                'original_filename' => $d->original_filename,
                'file_size'         => $d->file_size_formatted,
                'uploaded_by'       => $d->uploadedBy?->name,
                'created_at'        => $d->created_at->toDateString(),
            ]),
            'categories' => Document::CATEGORIES,
            'filters'    => $request->only(['search', 'category', 'client_id']),
            'stats'      => [
                'total'      => Document::count(),
                'this_month' => Document::whereYear('created_at', now()->year)
                    ->whereMonth('created_at', now()->month)
                    ->count(),
                'clients'    => Document::distinct('client_id')->count('client_id'),
                'categories' => Document::distinct('category')->count('category'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Document::class);

        if ($this->hasCategoryUploads($request)) {
            return $this->storeBulk($request);
        }

        $request->validate([
            'client_id' => ['nullable', 'exists:clients,id', 'required_without:lead_id'],
            'lead_id'   => ['nullable', 'exists:leads,id', 'required_without:client_id'],
            'category'  => ['required', 'string', 'in:' . implode(',', array_keys(Document::CATEGORIES))],
            'file'      => ['required', 'file', 'max:20480', 'mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx'],
        ]);

        $owner = $request->filled('lead_id')
            ? Lead::findOrFail($request->lead_id)
            : Client::findOrFail($request->client_id);

        $this->documents->storeFor($owner, $request->input('category'), $request->file('file'));

        return $this->flashedBack('Document uploaded.');
    }

    private function storeBulk(Request $request): RedirectResponse
    {
        $categoryKeys = array_keys(Document::CATEGORIES);
        $rules = [
            'client_id' => ['nullable', 'exists:clients,id', 'required_without:lead_id'],
            'lead_id'   => ['nullable', 'exists:leads,id', 'required_without:client_id'],
            'files'     => ['required', 'array'],
        ];

        foreach ($categoryKeys as $category) {
            $rules["files.{$category}"]   = ['nullable', 'array'];
            $rules["files.{$category}.*"] = ['file', 'max:20480', 'mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx'];
        }

        $request->validate($rules);

        $owner = $request->filled('lead_id')
            ? Lead::findOrFail($request->lead_id)
            : Client::findOrFail($request->client_id);

        $stored = [];
        DB::transaction(function () use ($request, $owner, &$stored) {
            $stored = $this->documents->storeCategoryUploads($owner, $request->file('files', []) ?? []);
        });

        if ($stored === []) {
            throw ValidationException::withMessages([
                'files' => 'Drop at least one file into a category.',
            ]);
        }

        $count = count($stored);

        return $this->flashedBack($count === 1 ? 'Document uploaded.' : "{$count} documents uploaded.");
    }

    /**
     * Nested uploads arrive as files[category][] — Laravel's hasFile('files')
     * only matches a top-level UploadedFile, so it misses this shape.
     */
    private function hasCategoryUploads(Request $request): bool
    {
        $uploads = $request->file('files');

        if (! is_array($uploads) || $uploads === []) {
            return false;
        }

        foreach ($uploads as $fileList) {
            $fileList = is_array($fileList) ? $fileList : [$fileList];

            foreach ($fileList as $file) {
                if ($file instanceof UploadedFile) {
                    return true;
                }
            }
        }

        return false;
    }

    private function flashedBack(string $message): RedirectResponse
    {
        return Inertia::flash('success', $message)->back()->with('success', $message);
    }

    public function download(Document $document): StreamedResponse
    {
        $this->authorize('view', $document);

        if (!Storage::disk('private')->exists($document->stored_path)) {
            abort(404, 'File not found.');
        }

        return Storage::disk('private')->download(
            $document->stored_path,
            $document->original_filename
        );
    }

    public function destroy(Document $document): RedirectResponse
    {
        $this->authorize('delete', $document);

        Storage::disk('private')->delete($document->stored_path);

        $subject = $document->client ?? $document->lead;
        if ($subject) {
            $this->activity->log($subject, Activity::ACTION_DOCUMENT_DELETED,
                "Document \"{$document->original_filename}\" deleted"
            );
        }

        $document->delete();

        return $this->flashedBack('Document deleted.');
    }
}
