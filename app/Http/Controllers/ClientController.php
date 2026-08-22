<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Document;
use App\Models\Payment;
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

        $user = auth()->user();

        $query = Client::with(['lead', 'assignedUser', 'leads'])
            ->visibleTo($user)
            ->when($request->search, fn ($q, $v) =>
                $q->where(fn ($q) =>
                    $q->where('client_number', 'like', "%{$v}%")
                      ->orWhere('name', 'like', "%{$v}%")
                      ->orWhere('email', 'like', "%{$v}%")
                      ->orWhere('company', 'like', "%{$v}%")
                      ->orWhere('phone', 'like', "%{$v}%")
                      ->orWhereHas('lead', fn ($q) =>
                          $q->where('name', 'like', "%{$v}%")
                            ->orWhere('email', 'like', "%{$v}%")
                            ->orWhere('company', 'like', "%{$v}%")
                            ->orWhere('phone', 'like', "%{$v}%")
                      )
                      ->orWhereHas('leads', fn ($q) =>
                          $q->where('name', 'like', "%{$v}%")
                            ->orWhere('email', 'like', "%{$v}%")
                            ->orWhere('company', 'like', "%{$v}%")
                      )
                )
            )
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->compliance_type, fn ($q, $v) => $q->where('compliance_type', $v))
            ->when($request->assigned_to, fn ($q, $v) => $q->where('assigned_to', $v));

        $clients = $query->latest()->paginate(20)->withQueryString();

        $stats = Client::query()->visibleTo($user);

        return Inertia::render('Clients/Index', [
            'clients'  => $clients->through(fn ($c) => $this->formatClientRow($c)),
            'users'    => User::where('is_active', true)->select('id', 'name', 'role')->get(),
            'filters'  => $request->only(['search', 'status', 'assigned_to', 'compliance_type']),
            'can_create' => $user->can('create', Client::class),
            'can_add_payment' => $user->can('create', Payment::class),
            'stats'    => [
                'total'     => (clone $stats)->count(),
                'active'    => (clone $stats)->where('status', 'active')->count(),
                'completed' => (clone $stats)->where('status', 'completed')->count(),
                'inactive'  => (clone $stats)->where('status', 'inactive')->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Client::class);

        return Inertia::render('Clients/Create', [
            'users' => User::where('is_active', true)->select('id', 'name', 'role')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Client::class);

        $data = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'phone'            => ['nullable', 'string', 'max:30'],
            'email'            => ['nullable', 'email', 'max:255'],
            'state'            => ['nullable', 'string', 'max:100'],
            'company'          => ['nullable', 'string', 'max:255'],
            'notes'            => ['nullable', 'string'],
            'assigned_to'      => ['nullable', 'exists:users,id'],
            'compliance_type'  => ['nullable', 'in:project,monthly'],
            'status'           => ['nullable', 'in:active,completed,inactive'],
        ]);

        if (auth()->user()->isSalesRep()) {
            $data['assigned_to'] = auth()->id();
        }

        $data['status'] = $data['status'] ?? Client::STATUS_ACTIVE;
        $data['compliance_type'] = $data['compliance_type'] ?: null;

        $client = Client::create($data);

        $this->activity->log(
            $client,
            Activity::ACTION_CLIENT_CREATED,
            'Client created directly by '.auth()->user()->name
        );

        if ($client->assigned_to) {
            $this->activity->log(
                $client,
                Activity::ACTION_LEAD_ASSIGNED,
                'Client assigned to '.$client->assignedUser?->name
            );
        }

        return redirect()->route('clients.show', $client)
            ->with('success', "Client #{$client->client_number} created.");
    }

    public function show(Client $client): Response
    {
        $this->authorize('view', $client);

        $client->load([
            'lead',
            'leads.assignedUser',
            'assignedUser',
            'payments.createdBy',
            'clientServices.service',
            'clientServices.assignedUser',
            'documents.uploadedBy',
            'tasks.assignedUser',
            'tasks.createdBy',
            'activities.causer',
        ]);

        if ($client->clientServices->isEmpty() && $client->lead?->service_required) {
            $assigned = $client->syncServicesFromLead();
            foreach ($assigned as $row) {
                $this->activity->log(
                    $client,
                    Activity::ACTION_SERVICE_ASSIGNED,
                    "Service \"{$row->service->name}\" assigned from lead"
                );
            }
            $client->load(['clientServices.service', 'clientServices.assignedUser', 'activities.causer']);
        }

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
            'name'            => ['sometimes', 'required', 'string', 'max:255'],
            'phone'           => ['nullable', 'string', 'max:30'],
            'email'           => ['nullable', 'email', 'max:255'],
            'state'           => ['nullable', 'string', 'max:100'],
            'company'         => ['nullable', 'string', 'max:255'],
            'notes'           => ['nullable', 'string'],
            'assigned_to'     => ['nullable', 'exists:users,id'],
            'status'          => ['required', 'in:active,completed,inactive'],
            'compliance_type' => ['nullable', 'in:project,monthly'],
        ]);

        if (auth()->user()->isSalesRep()) {
            unset($data['assigned_to']);
        }

        if (array_key_exists('compliance_type', $data)) {
            $data['compliance_type'] = $data['compliance_type'] ?: null;
        }

        $old = $client->only(['status', 'assigned_to', 'compliance_type']);
        $client->update($data);

        if ($old['status'] !== $data['status']) {
            $this->activity->log($client, 'status_changed',
                "Client status changed from \"{$old['status']}\" to \"{$data['status']}\"",
                ['status' => $old['status']], ['status' => $data['status']]
            );
        }

        if (($old['compliance_type'] ?? null) !== ($data['compliance_type'] ?? null)) {
            $from = $old['compliance_type'] ?: 'unset';
            $to = $data['compliance_type'] ?: 'unset';
            $this->activity->log($client, 'compliance_changed',
                "Compliance changed from \"{$from}\" to \"{$to}\"",
                ['compliance_type' => $old['compliance_type']],
                ['compliance_type' => $data['compliance_type']]
            );
        }

        return back()->with('success', 'Client updated.');
    }

    private function formatClientRow(Client $client): array
    {
        return [
            'id'               => $client->id,
            'client_number'    => $client->client_number,
            'name'             => $client->display_name,
            'email'            => $client->email ?: $client->lead?->email,
            'phone'            => $client->phone ?: $client->lead?->phone,
            'company'          => $client->company ?: $client->lead?->company,
            'status'           => $client->status,
            'compliance_type'  => $client->compliance_type,
            'assigned_user'    => $client->assignedUser ? ['name' => $client->assignedUser->name] : null,
            'leads_count'      => $client->leads->count(),
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
            'id'               => $client->id,
            'client_number'    => $client->client_number,
            'name'             => $client->display_name,
            'phone'            => $client->phone ?: $client->lead?->phone,
            'email'            => $client->email ?: $client->lead?->email,
            'state'            => $client->state ?: $client->lead?->state,
            'company'          => $client->company ?: $client->lead?->company,
            'status'           => $client->status,
            'compliance_type'  => $client->compliance_type,
            'notes'            => $client->notes,
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
            'leads'          => $client->leads->map(fn ($l) => [
                'id'               => $l->id,
                'name'             => $l->name,
                'status'           => $l->status,
                'service_required' => $l->service_required,
                'source'           => $l->source,
                'converted_at'     => $l->converted_at?->toDateTimeString(),
                'assigned_user'    => $l->assignedUser ? ['name' => $l->assignedUser->name] : null,
                'created_at'       => $l->created_at->toDateString(),
            ])->values()->toArray(),
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
                'description'   => $t->description,
                'priority'      => $t->priority,
                'status'        => $t->status,
                'assigned_user' => $t->assignedUser ? ['name' => $t->assignedUser->name] : null,
                'due_date'      => $t->due_date?->format('Y-m-d\\TH:i'),
                'reminder_at'   => $t->reminder_at?->format('Y-m-d\\TH:i'),
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
