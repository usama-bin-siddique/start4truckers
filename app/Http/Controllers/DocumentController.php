<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Document;
use App\Services\ActivityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function __construct(private ActivityService $activity) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Document::class);

        $query = Document::with(['client.lead', 'uploadedBy'])
            ->when($request->search, fn ($q, $v) =>
                $q->whereHas('client.lead', fn ($q) =>
                    $q->where('name', 'like', "%{$v}%")
                )->orWhere('original_filename', 'like', "%{$v}%")
            )
            ->when($request->category, fn ($q, $v) => $q->where('category', $v))
            ->when($request->client_id, fn ($q, $v) => $q->where('client_id', $v));

        $documents = $query->latest()->paginate(25)->withQueryString();

        return Inertia::render('Documents/Index', [
            'documents'  => $documents->through(fn ($d) => [
                'id'                => $d->id,
                'client_id'         => $d->client_id,
                'client_number'     => $d->client->client_number,
                'client_name'       => $d->client->lead?->name ?? '—',
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

        if ($request->hasFile('files')) {
            return $this->storeBulk($request);
        }

        $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'category'  => ['required', 'string', 'in:' . implode(',', array_keys(Document::CATEGORIES))],
            'file'      => ['required', 'file', 'max:20480', 'mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx'],
        ]);

        $client = Client::findOrFail($request->client_id);
        $this->storeUploadedFile($client, $request->input('category'), $request->file('file'));

        return back()->with('success', 'Document uploaded.');
    }

    private function storeBulk(Request $request): RedirectResponse
    {
        $categoryKeys = array_keys(Document::CATEGORIES);
        $rules = [
            'client_id' => ['required', 'exists:clients,id'],
            'files'     => ['required', 'array'],
        ];

        foreach ($categoryKeys as $category) {
            $rules["files.{$category}"]   = ['nullable', 'array'];
            $rules["files.{$category}.*"] = ['file', 'max:20480', 'mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx'];
        }

        $request->validate($rules);

        $uploads = $request->file('files', []);
        $files   = [];

        foreach ($uploads as $category => $fileList) {
            if (! in_array($category, $categoryKeys, true)) {
                throw ValidationException::withMessages([
                    'files' => "Invalid document category: {$category}.",
                ]);
            }

            $fileList = is_array($fileList) ? $fileList : [$fileList];

            foreach ($fileList as $file) {
                if ($file instanceof UploadedFile) {
                    $files[] = [$category, $file];
                }
            }
        }

        if ($files === []) {
            throw ValidationException::withMessages([
                'files' => 'Drop at least one file into a category.',
            ]);
        }

        $client = Client::findOrFail($request->client_id);

        DB::transaction(function () use ($files, $client) {
            foreach ($files as [$category, $file]) {
                $this->storeUploadedFile($client, $category, $file);
            }
        });

        $count = count($files);

        return back()->with('success', $count === 1 ? 'Document uploaded.' : "{$count} documents uploaded.");
    }

    private function storeUploadedFile(Client $client, string $category, UploadedFile $file): Document
    {
        $path = $file->store("clients/{$client->id}/documents", 'private');

        $document = Document::create([
            'client_id'         => $client->id,
            'category'          => $category,
            'original_filename' => $file->getClientOriginalName(),
            'stored_path'       => $path,
            'mime_type'         => $file->getMimeType(),
            'file_size'         => $file->getSize(),
            'uploaded_by'       => Auth::id(),
        ]);

        $this->activity->log($client, Activity::ACTION_DOCUMENT_UPLOADED,
            "Document \"{$document->original_filename}\" uploaded ({$document->category_label})"
        );

        return $document;
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

        $this->activity->log($document->client, Activity::ACTION_DOCUMENT_DELETED,
            "Document \"{$document->original_filename}\" deleted"
        );

        $document->delete();

        return back()->with('success', 'Document deleted.');
    }
}
