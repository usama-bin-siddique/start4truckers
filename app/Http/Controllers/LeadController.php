<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Document;
use App\Models\Lead;
use App\Models\LeadInvoice;
use App\Models\Payment;
use App\Models\Service;
use App\Models\User;
use App\Services\ActivityService;
use App\Services\LeadSlaService;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function __construct(
        private ActivityService $activity,
        private NotificationService $notification,
        private LeadSlaService $sla
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Lead::class);

        $this->sla->checkExpired();

        $query = Lead::with('assignedUser')
            ->when($request->search, fn ($q, $v) =>
                $q->where(fn ($q) =>
                    $q->where('name', 'like', "%{$v}%")
                      ->orWhere('email', 'like', "%{$v}%")
                      ->orWhere('phone', 'like', "%{$v}%")
                      ->orWhere('company', 'like', "%{$v}%")
                ))
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->assigned_to, fn ($q, $v) => $q->where('assigned_to', $v))
            ->when($request->service, fn ($q, $v) => $q->where('service_required', $v))
            ->when($request->date_from, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->date_to, fn ($q, $v) => $q->whereDate('created_at', '<=', $v));

        // Sales only see their assigned leads
        if (Auth::user()->role === 'sales') {
            $query->where('assigned_to', Auth::id());
        }

        $leads = $query->latest()->paginate(20)->withQueryString();

        return Inertia::render('Leads/Index', [
            'leads'    => $leads,
            'users'    => User::where('is_active', true)->select('id', 'name', 'role')->get(),
            'statuses' => Lead::statuses(),
            'filters'  => $request->only(['search', 'status', 'assigned_to', 'service', 'date_from', 'date_to']),
            'stats'    => [
                'total'       => Lead::count(),
                'new'         => Lead::where('status', 'new')->count(),
                'reviewed'    => Lead::where('status', 'reviewed')->count(),
                'contacted'   => Lead::where('status', 'contacted')->count(),
                'won'         => Lead::where('status', 'won')->count(),
                'lost'        => Lead::where('status', 'lost')->count(),
            ],
        ]);
    }

    public function show(Lead $lead): Response
    {
        $this->authorize('view', $lead);

        $this->sla->checkExpired();
        $lead = $this->sla->markReviewedAndStart($lead);

        $lead->load([
            'assignedUser', 'convertedByUser', 'client.assignedUser',
            'activities.causer', 'documents.uploadedBy', 'invoices.createdBy',
        ]);

        return Inertia::render('Leads/Show', [
            'lead'           => $this->formatLead($lead),
            'users'          => User::where('is_active', true)->select('id', 'name', 'role')->get(),
            'statuses'       => Lead::statuses(),
            'doc_categories' => Document::CATEGORIES,
            'services'       => Service::where('is_active', true)->orderBy('order')->get(['id', 'name', 'slug']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Lead::class);

        $data = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'phone'            => ['nullable', 'string', 'max:30'],
            'email'            => ['nullable', 'email', 'max:255'],
            'state'            => ['nullable', 'string', 'max:100'],
            'company'          => ['nullable', 'string', 'max:255'],
            'service_required' => ['nullable', 'string', 'max:255'],
            'notes'            => ['nullable', 'string'],
            'source'           => ['nullable', 'string', 'max:50'],
            'assigned_to'      => ['nullable', 'exists:users,id'],
        ]);

        $lead = Lead::create($data);

        $this->activity->log($lead, Activity::ACTION_LEAD_CREATED,
            "Lead created manually by " . Auth::user()->name
        );

        if ($lead->assigned_to) {
            $this->activity->log($lead, Activity::ACTION_LEAD_ASSIGNED,
                "Lead assigned to " . $lead->assignedUser->name
            );
            
            // Notify assigned user
            $this->notification->notify($lead->assigned_to, NotificationService::TYPE_LEAD_ASSIGNED, [
                'lead_id'   => $lead->id,
                'lead_name' => $lead->name,
            ]);
        }

        return redirect()->route('leads.show', $lead)
            ->with('success', 'Lead created successfully.');
    }

    public function update(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);

        $data = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'phone'            => ['nullable', 'string', 'max:30'],
            'email'            => ['nullable', 'email', 'max:255'],
            'state'            => ['nullable', 'string', 'max:100'],
            'company'          => ['nullable', 'string', 'max:255'],
            'service_required' => ['nullable', 'string', 'max:255'],
            'notes'            => ['nullable', 'string'],
            'source'           => ['nullable', 'string', 'max:50'],
            'assigned_to'      => ['nullable', 'exists:users,id'],
            'status'           => ['required', 'in:' . implode(',', array_keys(Lead::statuses()))],
        ]);

        $old = $lead->only(['status', 'assigned_to']);

        if ($lead->isStatusLocked()) {
            if ($data['status'] !== $lead->status) {
                return back()->withErrors([
                    'status' => 'Won or lost leads cannot change status.',
                ]);
            }
            $data['status'] = $lead->status;
        }

        $lead->update($data);

        // Log status change
        if ($old['status'] !== $data['status']) {
            $this->activity->log($lead, Activity::ACTION_STATUS_CHANGED,
                "Status changed from \"{$old['status']}\" to \"{$data['status']}\"",
                ['status' => $old['status']],
                ['status' => $data['status']]
            );
            $this->sla->complete($lead, 'status update');
        }

        // Log assignment change
        if ($old['assigned_to'] != ($data['assigned_to'] ?? null) && !empty($data['assigned_to'])) {
            $assignee = User::find($data['assigned_to']);
            $this->activity->log($lead, Activity::ACTION_LEAD_ASSIGNED,
                "Lead assigned to {$assignee->name}"
            );
        }

        return back()->with('success', 'Lead updated successfully.');
    }

    public function updateStatus(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);

        if ($lead->isStatusLocked()) {
            return back()->with('error', 'Won or lost leads cannot change status.');
        }

        $data = $request->validate([
            'status' => ['required', 'in:' . implode(',', array_keys(Lead::statuses()))],
        ]);

        $old = $lead->status;
        $lead->update(['status' => $data['status']]);

        $this->activity->log($lead, Activity::ACTION_STATUS_CHANGED,
            "Status changed from \"{$old}\" to \"{$data['status']}\"",
            ['status' => $old],
            ['status' => $data['status']]
        );

        $this->sla->complete($lead, 'status update');

        return back()->with('success', 'Status updated.');
    }

    public function addNote(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);

        $request->validate(['note' => ['required', 'string', 'max:2000']]);

        $this->activity->log($lead, Activity::ACTION_NOTE_ADDED,
            $request->note
        );

        $this->sla->complete($lead, 'note');

        return back()->with('success', 'Note added.');
    }

    public function logCall(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);

        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $this->activity->log(
            $lead,
            Activity::ACTION_CALL_LOGGED,
            $data['notes'] ?: 'Call logged'
        );

        $this->sla->complete($lead, 'call');

        return back()->with('success', 'Call logged.');
    }

    public function followUp(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);

        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if (! $lead->isStatusLocked()) {
            $old = $lead->status;
            $lead->update(['status' => Lead::STATUS_FOLLOW_UP]);
            $this->activity->log($lead, Activity::ACTION_STATUS_CHANGED,
                "Status changed from \"{$old}\" to \"follow-up\"",
                ['status' => $old],
                ['status' => Lead::STATUS_FOLLOW_UP]
            );
        }

        $this->activity->log(
            $lead,
            Activity::ACTION_FOLLOW_UP,
            $data['notes'] ?: 'Follow-up recorded'
        );

        $this->sla->complete($lead, 'follow-up');

        return back()->with('success', 'Follow-up recorded.');
    }

    public function storeInvoice(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'notes'  => ['nullable', 'string', 'max:2000'],
        ]);

        $invoice = LeadInvoice::create([
            'lead_id'    => $lead->id,
            'amount'     => $data['amount'],
            'notes'      => $data['notes'] ?? null,
            'created_by' => Auth::id(),
        ]);

        $amount = number_format((float) $invoice->amount, 2);

        $this->activity->log(
            $lead,
            Activity::ACTION_INVOICE_CREATED,
            "Invoice created for \${$amount}"
        );

        $this->sla->complete($lead, 'invoice');

        return back()->with('success', 'Invoice recorded.');
    }

    public function assign(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('assign', $lead);

        $data = $request->validate([
            'assigned_to' => ['required', 'exists:users,id'],
        ]);

        $lead->update(['assigned_to' => $data['assigned_to']]);
        $assignee = User::find($data['assigned_to']);

        $this->activity->log($lead, Activity::ACTION_LEAD_ASSIGNED,
            "Lead assigned to {$assignee->name}"
        );
        
        // Notify assigned user
        $this->notification->notify($assignee->id, NotificationService::TYPE_LEAD_ASSIGNED, [
            'lead_id'   => $lead->id,
            'lead_name' => $lead->name,
        ]);

        return back()->with('success', "Lead assigned to {$assignee->name}.");
    }

    public function convert(Lead $lead): RedirectResponse
    {
        $this->authorize('convert', $lead);

        if ($lead->isConverted()) {
            return back()->with('error', 'Lead is already converted to a client.');
        }

        $lead->load('invoices');

        DB::transaction(function () use ($lead) {
            $client = Client::create([
                'lead_id'     => $lead->id,
                'assigned_to' => $lead->assigned_to,
                'status'      => Client::STATUS_ACTIVE,
            ]);

            $lead->update([
                'status'       => Lead::STATUS_WON,
                'converted_at' => now(),
                'converted_by' => Auth::id(),
            ]);

            Document::where('lead_id', $lead->id)->whereNull('client_id')->update([
                'client_id' => $client->id,
            ]);

            foreach ($lead->invoices as $invoice) {
                Payment::create([
                    'client_id'       => $client->id,
                    'invoice_amount'  => $invoice->amount,
                    'amount_received' => 0,
                    'notes'           => $invoice->notes,
                    'created_by'      => $invoice->created_by,
                ]);
            }

            $assigned = $client->syncServicesFromLead();
            foreach ($assigned as $row) {
                $this->activity->log(
                    $client,
                    Activity::ACTION_SERVICE_ASSIGNED,
                    "Service \"{$row->service->name}\" assigned from lead"
                );
            }

            $this->sla->complete($lead, 'status update');

            // Log on both lead and client
            $this->activity->log($lead, Activity::ACTION_CONVERTED,
                "Lead converted to client #{$client->client_number} by " . Auth::user()->name
            );
            $this->activity->log($client, Activity::ACTION_CLIENT_CREATED,
                "Client created from lead: {$lead->name}"
            );

            // Status changed to won
            $this->activity->log($lead, Activity::ACTION_STATUS_CHANGED,
                "Status changed to \"won\" upon client conversion",
                ['status' => 'won'], ['status' => 'won']
            );
            
            // Notify assigned user
            if ($lead->assigned_to) {
                $this->notification->notify($lead->assigned_to, NotificationService::TYPE_LEAD_CONVERTED, [
                    'lead_id'       => $lead->id,
                    'client_id'     => $client->id,
                    'client_name'   => $lead->name,
                    'client_number' => $client->client_number,
                ]);
            }
        });

        $client = Client::where('lead_id', $lead->id)->first();

        return redirect()->route('clients.show', $client)
            ->with('success', "Lead converted. Client #{$client->client_number} created.");
    }

    public function destroy(Lead $lead): RedirectResponse
    {
        $this->authorize('delete', $lead);
        $lead->delete();
        return redirect()->route('leads.index')->with('success', 'Lead deleted.');
    }

    private function formatLead(Lead $lead): array
    {
        return [
            'id'               => $lead->id,
            'name'             => $lead->name,
            'phone'            => $lead->phone,
            'email'            => $lead->email,
            'state'            => $lead->state,
            'company'          => $lead->company,
            'service_required' => $lead->service_required,
            'notes'            => $lead->notes,
            'source'           => $lead->source,
            'status'           => $lead->status,
            'assigned_to'      => $lead->assigned_to,
            'assigned_user'    => $lead->assignedUser ? ['id' => $lead->assignedUser->id, 'name' => $lead->assignedUser->name] : null,
            'converted_at'     => $lead->converted_at?->toDateTimeString(),
            'converted_by'     => $lead->convertedByUser?->name,
            'client_id'        => $lead->client?->id,
            'client_number'    => $lead->client?->client_number,
            'reviewed_at'      => $lead->reviewed_at?->toIso8601String(),
            'sla_started_at'   => $lead->sla_started_at?->toIso8601String(),
            'sla_expires_at'   => $lead->sla_expires_at?->toIso8601String(),
            'sla_completed_at' => $lead->sla_completed_at?->toIso8601String(),
            'sla_breached_at'  => $lead->sla_breached_at?->toIso8601String(),
            'created_at'       => $lead->created_at->toDateTimeString(),
            'updated_at'       => $lead->updated_at->toDateTimeString(),
            'documents'        => $lead->documents->map(fn ($d) => [
                'id'                => $d->id,
                'category'          => $d->category,
                'category_label'    => $d->category_label,
                'original_filename' => $d->original_filename,
                'file_size'         => $d->file_size_formatted,
                'uploaded_by'       => $d->uploadedBy?->name,
                'created_at'        => $d->created_at->toDateString(),
            ])->toArray(),
            'invoices'         => $lead->invoices->map(fn ($i) => [
                'id'         => $i->id,
                'amount'     => (float) $i->amount,
                'notes'      => $i->notes,
                'created_by' => $i->createdBy?->name,
                'created_at' => $i->created_at->toDateString(),
            ])->toArray(),
            'activities'       => $lead->activities->map(fn ($a) => [
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
