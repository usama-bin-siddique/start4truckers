<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Document;
use App\Services\ActivityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
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
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Document::class);

        $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'category'  => ['required', 'string', 'in:' . implode(',', array_keys(Document::CATEGORIES))],
            'file'      => ['required', 'file', 'max:20480', 'mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx'],
        ]);

        $file  = $request->file('file');
        $path  = $file->store("clients/{$request->client_id}/documents", 'private');
        $client = Client::find($request->client_id);

        $document = Document::create([
            'client_id'         => $request->client_id,
            'category'          => $request->category,
            'original_filename' => $file->getClientOriginalName(),
            'stored_path'       => $path,
            'mime_type'         => $file->getMimeType(),
            'file_size'         => $file->getSize(),
            'uploaded_by'       => Auth::id(),
        ]);

        $this->activity->log($client, Activity::ACTION_DOCUMENT_UPLOADED,
            "Document \"{$document->original_filename}\" uploaded ({$document->category_label})"
        );

        return back()->with('success', 'Document uploaded.');
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
