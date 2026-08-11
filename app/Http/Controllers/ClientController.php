<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Document;
use App\Models\Service;
use App\Models\User;
use App\Services\ActivityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function __construct(private ActivityService $activity) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Client::class);

        $query = Client::with(['lead', 'assignedUser'])
            ->when($request->search, fn ($q, $v) =>
                $q->whereHas('lead', fn ($q) =>
                    $q->where('name', 'like', "%{$v}%")
                      ->orWhere('email', 'like', "%{$v}%")
                      ->orWhere('company', 'like', "%{$v}%")
                      ->orWhere('phone', 'like', "%{$v}%")
                )->orWhere('client_number', 'like', "%{$v}%")
            )
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->assigned_to, fn ($q, $v) => $q->where('assigned_to', $v));

        $clients = $query->latest()->paginate(20)->withQueryString();

        return Inertia::render('Clients/Index', [
            'clients'  => $clients->through(fn ($c) => $this->formatClientRow($c)),
            'users'    => User::where('is_active', true)->select('id', 'name', 'role')->get(),
            'filters'  => $request->only(['search', 'status', 'assigned_to']),
            'stats'    => [
                'total'     => Client::count(),
                'active'    => Client::where('status', 'active')->count(),
                'completed' => Client::where('status', 'completed')->count(),
            ],
        ]);
    }

    public function show(Client $client): Response
    {
        $this->authorize('view', $client);

        $client->load([
            'lead',
            'assignedUser',
            'payments.createdBy',
            'clientServices.service',
            'clientServices.assignedUser',
            'documents.uploadedBy',
            'tasks.assignedUser',
            'tasks.createdBy',
            'activities.causer',
        ]);

        return Inertia::render('Clients/Show', [
            'client'   => $this->formatClientFull($client),
            'users'    => User::where('is_active', true)->select('id', 'name', 'role')->get(),
            'services' => Service::where('is_active', true)->orderBy('order')->get(['id', 'name', 'slug']),
            'doc_categories' => Document::CATEGORIES,
        ]);
    }

    public function update(Request $request, Client $client): RedirectResponse
    {
        $this->authorize('update', $client);

        $data = $request->validate([
            'notes'       => ['nullable', 'string'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'status'      => ['required', 'in:active,completed,inactive'],
        ]);

        $old = $client->only(['status', 'assigned_to']);
        $client->update($data);

        if ($old['status'] !== $data['status']) {
            $this->activity->log($client, 'status_changed',
                "Client status changed from \"{$old['status']}\" to \"{$data['status']}\"",
                ['status' => $old['status']], ['status' => $data['status']]
            );
        }

        return back()->with('success', 'Client updated.');
    }

    private function formatClientRow(Client $client): array
    {
        return [
            'id'             => $client->id,
            'client_number'  => $client->client_number,
            'status'         => $client->status,
            'assigned_user'  => $client->assignedUser ? ['name' => $client->assignedUser->name] : null,
            'lead'           => $client->lead ? [
                'name'             => $client->lead->name,
                'email'            => $client->lead->email,
                'phone'            => $client->lead->phone,
                'company'          => $client->lead->company,
                'service_required' => $client->lead->service_required,
            ] : null,
            'balance_due'    => $client->balance_due,
            'created_at'     => $client->created_at->toDateString(),
        ];
    }

    private function formatClientFull(Client $client): array
    {
        return [
            'id'             => $client->id,
            'client_number'  => $client->client_number,
            'status'         => $client->status,
            'notes'          => $client->notes,
            'assigned_to'    => $client->assigned_to,
            'assigned_user'  => $client->assignedUser ? ['id' => $client->assignedUser->id, 'name' => $client->assignedUser->name] : null,
            'created_at'     => $client->created_at->toDateTimeString(),
            'total_invoiced' => $client->total_invoiced,
            'total_received' => $client->total_received,
            'balance_due'    => $client->balance_due,
            'lead'           => $client->lead ? [
                'id'               => $client->lead->id,
                'name'             => $client->lead->name,
                'email'            => $client->lead->email,
                'phone'            => $client->lead->phone,
                'state'            => $client->lead->state,
                'company'          => $client->lead->company,
                'service_required' => $client->lead->service_required,
                'source'           => $client->lead->source,
                'status'           => $client->lead->status,
                'created_at'       => $client->lead->created_at->toDateString(),
            ] : null,
            'payments'       => $client->payments->map(fn ($p) => [
                'id'                    => $p->id,
                'invoice_amount'        => (float) $p->invoice_amount,
                'amount_received'       => (float) $p->amount_received,
                'balance_due'           => $p->balance_due,
                'payment_method'        => $p->payment_method,
                'transaction_reference' => $p->transaction_reference,
                'notes'                 => $p->notes,
                'paid_at'               => $p->paid_at?->toDateString(),
                'created_by'            => $p->createdBy?->name,
                'has_receipt'           => !empty($p->receipt_path),
                'created_at'            => $p->created_at->toDateString(),
            ])->toArray(),
            'client_services' => $client->clientServices->map(fn ($cs) => [
                'id'              => $cs->id,
                'service_id'      => $cs->service_id,
                'service_name'    => $cs->service->name,
                'status'          => $cs->status,
                'assigned_to'     => $cs->assigned_to,
                'assigned_user'   => $cs->assignedUser ? ['name' => $cs->assignedUser->name] : null,
                'completion_date' => $cs->completion_date?->toDateString(),
                'notes'           => $cs->notes,
            ])->toArray(),
            'documents'      => $client->documents->map(fn ($d) => [
                'id'                => $d->id,
                'category'          => $d->category,
                'category_label'    => $d->category_label,
                'original_filename' => $d->original_filename,
                'file_size'         => $d->file_size_formatted,
                'uploaded_by'       => $d->uploadedBy?->name,
                'created_at'        => $d->created_at->toDateString(),
            ])->toArray(),
            'tasks'          => $client->tasks->map(fn ($t) => [
                'id'            => $t->id,
                'title'         => $t->title,
                'priority'      => $t->priority,
                'status'        => $t->status,
                'assigned_user' => $t->assignedUser ? ['name' => $t->assignedUser->name] : null,
                'due_date'      => $t->due_date?->toDateString(),
                'is_overdue'    => $t->isOverdue(),
            ])->toArray(),
            'activities'     => $client->activities->map(fn ($a) => [
                'id'          => $a->id,
                'action'      => $a->action,
                'description' => $a->description,
                'causer'      => $a->causer?->name ?? 'System',
                'old_value'   => $a->old_value,
                'new_value'   => $a->new_value,
                'created_at'  => $a->created_at->format('M j, Y g:i A'),
            ])->toArray(),
        ];
    }
}
