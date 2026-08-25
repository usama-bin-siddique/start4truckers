<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Document;
use App\Models\Payment;
use App\Models\Service;
use App\Models\User;
use App\Services\ActivityService;
use App\Services\DocumentService;
use App\Services\MonthlyComplianceService;
use App\Services\NotificationService;
use App\Support\ClientProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function __construct(
        private ActivityService $activity,
        private MonthlyComplianceService $monthlyCompliance,
        private DocumentService $documents,
        private NotificationService $notifications,
    ) {}

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
            'profile_options' => ClientProfile::options(),
            'stats'    => [
                'total'     => (clone $stats)->count(),
                'active'    => (clone $stats)->whereIn('status', ClientProfile::OPEN_STATUSES)->count(),
                'completed' => (clone $stats)->where('status', Client::STATUS_COMPLETED)->count(),
                'inactive'  => (clone $stats)->where('status', Client::STATUS_INACTIVE)->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Client::class);

        $user = auth()->user();

        return Inertia::render('Clients/Create', [
            'users' => User::where('is_active', true)->select('id', 'name', 'role')->get(),
            'profile_options' => ClientProfile::options(),
            'doc_categories' => Document::CATEGORIES,
            'can_upload_documents' => $user->can('create', Document::class),
            'can_add_payment' => $user->can('create', Payment::class),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Client::class);

        $request->merge(collect($request->all())->map(fn ($value) => $value === '' ? null : $value)->all());
        $data = $this->blankToNull($request->validate(ClientProfile::rules(creating: true)));

        if (auth()->user()->isSalesRep()) {
            $data['assigned_to'] = auth()->id();
        }

        $data['status'] = ClientProfile::normalizeStatus($data['status'] ?? null, Client::STATUS_ONBOARDING);
        $data['compliance_type'] = $data['compliance_type'] ?? null;

        $hasDocumentRows = $this->documents->hasDocumentRows($request);
        $hasDocuments = $hasDocumentRows || $this->hasCategoryUploads($request);
        $hasPayment = $this->hasPaymentInput($request);
        $documentRows = [];

        if ($hasDocuments) {
            $this->authorize('create', Document::class);
            if ($hasDocumentRows) {
                $documentRows = $this->documents->validateDocumentRows($request);
            } else {
                $this->validateDocumentUploads($request);
            }
        }

        if ($hasPayment) {
            $this->authorize('create', Payment::class);
            $this->validatePaymentInput($request);
        }

        $client = DB::transaction(function () use ($request, $data, $hasDocuments, $hasDocumentRows, $documentRows, $hasPayment) {
            $client = Client::create($data);

            $this->activity->log(
                $client,
                Activity::ACTION_CLIENT_CREATED,
                'Client created directly by '.auth()->user()->name
            );

            if ($client->compliance_type === Client::COMPLIANCE_MONTHLY) {
                $this->monthlyCompliance->enroll($client->fresh());
            }

            if ($client->assigned_to) {
                $this->activity->log(
                    $client,
                    Activity::ACTION_LEAD_ASSIGNED,
                    'Client assigned to '.$client->assignedUser?->name
                );
            }

            if ($hasDocuments) {
                if ($hasDocumentRows) {
                    $this->documents->storeDocumentRows($client, $documentRows);
                } else {
                    $this->documents->storeCategoryUploads($client, $request->file('files', []) ?? []);
                }
            }

            if ($hasPayment) {
                $this->storeOptionalPayment($request, $client);
            }

            return $client;
        });

        $message = "Client #{$client->client_number} created.";
        if ($hasDocuments) {
            $count = $client->documents()->count();
            $message .= $count === 1 ? ' 1 document uploaded.' : " {$count} documents uploaded.";
        }
        if ($hasPayment) {
            $message .= ' Payment recorded.';
        }

        return redirect()->route('clients.show', $client)->with('success', $message);
    }

    public function show(Client $client): Response
    {
        $this->authorize('view', $client);

        $client->load([
            'lead',
            'leads.assignedUser',
            'assignedUser',
            'vehicles',
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
            'profile_options' => ClientProfile::options(),
        ]);
    }

    public function update(Request $request, Client $client): RedirectResponse
    {
        $this->authorize('update', $client);

        $request->merge(collect($request->all())->map(fn ($value) => $value === '' ? null : $value)->all());
        $data = $this->blankToNull($request->validate(ClientProfile::rules(creating: false)));

        if (auth()->user()->isSalesRep()) {
            unset($data['assigned_to']);
        }

        if (array_key_exists('status', $data)) {
            if (! $data['status']) {
                unset($data['status']);
            } else {
                $data['status'] = ClientProfile::normalizeStatus($data['status'], $client->status);
            }
        }

        $old = $client->only(['status', 'assigned_to', 'compliance_type']);

        $complianceType = null;
        $complianceChanged = false;
        if (array_key_exists('compliance_type', $data)) {
            $complianceType = $data['compliance_type'] ?: null;
            $complianceChanged = ($old['compliance_type'] ?? null) !== $complianceType;
            unset($data['compliance_type']);
        }

        $client->update($data);

        if (array_key_exists('status', $data) && $old['status'] !== $data['status']) {
            $this->activity->log($client, 'status_changed',
                "Client status changed from \"{$old['status']}\" to \"{$data['status']}\"",
                ['status' => $old['status']], ['status' => $data['status']]
            );
        }

        if ($complianceChanged) {
            $this->monthlyCompliance->applyType($client->fresh(), $complianceType);
        }

        return back()->with('success', 'Client updated.');
    }

    public function updateCompliance(Request $request, Client $client): RedirectResponse
    {
        $this->authorize('update', $client);

        $data = $request->validate([
            'compliance_type' => ['required', 'in:project,monthly'],
        ]);

        $this->monthlyCompliance->applyType($client, $data['compliance_type']);

        $label = ClientProfile::complianceLabel($data['compliance_type']);

        return back()->with('success', "Compliance updated to {$label}.");
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
            'status_label'     => $client->status_label,
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
        return array_merge($this->profilePayload($client), [
            'id'               => $client->id,
            'client_number'    => $client->client_number,
            'name'             => $client->display_name,
            'phone'            => $client->phone ?: $client->lead?->phone,
            'email'            => $client->email ?: $client->lead?->email,
            'state'            => $client->state ?: $client->lead?->state,
            'company'          => $client->company ?: $client->lead?->company,
            'status'           => $client->status,
            'status_label'     => $client->status_label,
            'compliance_type'  => $client->compliance_type,
            'notes'            => $client->notes,
            'client_notes'     => $client->client_notes,
            'assigned_to'      => $client->assigned_to,
            'assigned_user'    => $client->assignedUser ? ['id' => $client->assignedUser->id, 'name' => $client->assignedUser->name] : null,
            'created_at'       => $client->created_at->toDateTimeString(),
            'customer_since'   => $client->created_at->toDateString(),
            'total_invoiced'   => $client->total_invoiced,
            'total_received'   => $client->total_received,
            'balance_due'      => $client->balance_due,
            'current_package'  => $client->current_package,
            'overall_service_status' => $client->overall_service_status,
            'computed_next_due_date' => $client->computed_next_due_date,
            'truck_count'      => $client->vehicles->count(),
            'ssn_masked'       => $client->ssn_masked,
            'lead'             => $client->lead ? [
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
            'leads'            => $client->leads->map(fn ($l) => [
                'id'               => $l->id,
                'name'             => $l->name,
                'status'           => $l->status,
                'service_required' => $l->service_required,
                'source'           => $l->source,
                'converted_at'     => $l->converted_at?->toDateTimeString(),
                'assigned_user'    => $l->assignedUser ? ['name' => $l->assignedUser->name] : null,
                'created_at'       => $l->created_at->toDateString(),
            ])->values()->toArray(),
            'vehicles'         => $client->vehicles->map(fn ($v) => [
                'id'               => $v->id,
                'truck_type'       => $v->truck_type,
                'vin'              => $v->vin,
                'year'             => $v->year,
                'make'             => $v->make,
                'model'            => $v->model,
                'gvwr'             => $v->gvwr,
                'license_plate'    => $v->license_plate,
                'plate_state'      => $v->plate_state,
                'title_number'     => $v->title_number,
                'purchase_date'    => $v->purchase_date?->toDateString(),
                'form_2290_status' => $v->form_2290_status,
                'eld_provider'     => $v->eld_provider,
                'eld_status'       => $v->eld_status,
                'notes'            => $v->notes,
            ])->values()->toArray(),
            'payments'         => $client->payments->map(fn ($p) => [
                'id'                    => $p->id,
                'invoice_amount'        => (float) $p->invoice_amount,
                'amount_received'       => (float) $p->amount_received,
                'balance_due'           => $p->balance_due,
                'payment_method'        => $p->payment_method,
                'transaction_reference' => $p->transaction_reference,
                'notes'                 => $p->notes,
                'paid_at'               => $p->paid_at?->toDateString(),
                'created_by'            => $p->createdBy?->name,
                'has_receipt'           => ! empty($p->receipt_path),
                'created_at'            => $p->created_at->toDateString(),
            ])->toArray(),
            'client_services'  => $client->clientServices->map(fn ($cs) => [
                'id'              => $cs->id,
                'service_id'      => $cs->service_id,
                'service_name'    => $cs->service->name,
                'package'         => $cs->package,
                'status'          => $cs->status,
                'assigned_to'     => $cs->assigned_to,
                'assigned_user'   => $cs->assignedUser ? ['name' => $cs->assignedUser->name] : null,
                'completion_date' => $cs->completion_date?->toDateString(),
                'notes'           => $cs->notes,
            ])->toArray(),
            'documents'        => $client->documents->map(fn ($d) => [
                'id'                => $d->id,
                'category'          => $d->category,
                'category_label'    => $d->category_label,
                'original_filename' => $d->original_filename,
                'file_size'         => $d->file_size_formatted,
                'uploaded_by'       => $d->uploadedBy?->name,
                'created_at'        => $d->created_at->toDateString(),
            ])->toArray(),
            'tasks'            => $client->tasks->map(fn ($t) => [
                'id'            => $t->id,
                'title'         => $t->title,
                'description'   => $t->description,
                'priority'      => $t->priority,
                'status'        => $t->status,
                'kind'          => $t->kind,
                'assigned_user' => $t->assignedUser ? ['name' => $t->assignedUser->name] : null,
                'due_date'      => $t->due_date?->format('Y-m-d\\TH:i'),
                'reminder_at'   => $t->reminder_at?->format('Y-m-d\\TH:i'),
                'is_overdue'    => $t->isOverdue(),
            ])->toArray(),
            'activities'       => $client->activities->map(fn ($a) => [
                'id'          => $a->id,
                'action'      => $a->action,
                'description' => $a->description,
                'causer'      => $a->causer?->name ?? 'System',
                'old_value'   => $a->old_value,
                'new_value'   => $a->new_value,
                'created_at'  => $a->created_at->format('M j, Y g:i A'),
            ])->toArray(),
        ]);
    }

    private function profilePayload(Client $client): array
    {
        return [
            'address'                      => $client->address,
            'ssn'                          => $client->ssn,
            'date_of_birth'                => $client->date_of_birth?->toDateString(),
            'citizenship_status'           => $client->citizenship_status,
            'dl_number'                    => $client->dl_number,
            'dl_state'                     => $client->dl_state,
            'dl_expiration'                => $client->dl_expiration?->toDateString(),
            'preferred_contact_method'     => $client->preferred_contact_method,
            'emergency_contact_name'       => $client->emergency_contact_name,
            'emergency_contact_phone'      => $client->emergency_contact_phone,
            'emergency_contact_relation'   => $client->emergency_contact_relation,
            'business_phone'               => $client->business_phone,
            'business_email'               => $client->business_email,
            'company_address'              => $client->company_address,
            'entity_type'                  => $client->entity_type,
            'state_of_formation'           => $client->state_of_formation,
            'llc_formed_at'                => $client->llc_formed_at?->toDateString(),
            'registered_agent'             => $client->registered_agent,
            'mailing_address'              => $client->mailing_address,
            'ein'                          => $client->ein,
            'usdot_number'                 => $client->usdot_number,
            'usdot_status'                 => $client->usdot_status,
            'mc_number'                    => $client->mc_number,
            'mc_status'                    => $client->mc_status,
            'fmcsa_authority_type'         => $client->fmcsa_authority_type,
            'ff_number'                    => $client->ff_number,
            'ucr_number'                   => $client->ucr_number,
            'ucr_status'                   => $client->ucr_status,
            'boc3_status'                  => $client->boc3_status,
            'insurance_status'             => $client->insurance_status,
            'insurance_company'            => $client->insurance_company,
            'insurance_policy_number'      => $client->insurance_policy_number,
            'insurance_expires_at'         => $client->insurance_expires_at?->toDateString(),
            'operating_authority_status'   => $client->operating_authority_status,
            'mcs150_status'                => $client->mcs150_status,
            'mcs150_due_at'                => $client->mcs150_due_at?->toDateString(),
            'ucr_due_at'                   => $client->ucr_due_at?->toDateString(),
            'ifta_status'                  => $client->ifta_status,
            'ifta_due_at'                  => $client->ifta_due_at?->toDateString(),
            'irp_status'                   => $client->irp_status,
            'irp_due_at'                   => $client->irp_due_at?->toDateString(),
            'form_2290_status'             => $client->form_2290_status,
            'form_2290_due_at'             => $client->form_2290_due_at?->toDateString(),
            'annual_updates_status'        => $client->annual_updates_status,
            'compliance_package'           => $client->compliance_package,
            'next_compliance_due_at'       => $client->next_compliance_due_at?->toDateString(),
            'last_compliance_completed_at' => $client->last_compliance_completed_at?->toDateString(),
            'monthly_compliance_started_at' => $client->monthly_compliance_started_at?->toDateString(),
            'overall_compliance_status'    => $client->overall_compliance_status,
            'next_action'                  => $client->next_action,
            'next_action_due_at'           => $client->next_action_due_at?->toDateString(),
            'login_gov_email'              => $client->login_gov_email,
            'motus_account_email'          => $client->motus_account_email,
            'fmcsa_account_email'          => $client->fmcsa_account_email,
            'portal_username'              => $client->portal_username,
            'account_status'               => $client->account_status,
            'account_last_verified_at'     => $client->account_last_verified_at?->toDateString(),
        ];
    }

    private function blankToNull(array $data): array
    {
        return collect($data)->map(fn ($value) => $value === '' ? null : $value)->all();
    }

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

    private function validateDocumentUploads(Request $request): void
    {
        if ($this->documents->hasDocumentRows($request)) {
            $this->documents->validateDocumentRows($request);

            return;
        }

        $rules = ['files' => ['required', 'array']];

        foreach (array_keys(Document::CATEGORIES) as $category) {
            $rules["files.{$category}"] = ['nullable', 'array'];
            $rules["files.{$category}.*"] = ['file', 'max:20480', 'mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx'];
        }

        $request->validate($rules);
    }

    private function hasPaymentInput(Request $request): bool
    {
        $payment = $request->input('payment', []);
        if (! is_array($payment)) {
            $payment = [];
        }

        return $request->file('payment.receipt') instanceof UploadedFile
            || filled($payment['invoice_amount'] ?? null)
            || filled($payment['amount_received'] ?? null)
            || filled($payment['payment_method'] ?? null)
            || filled($payment['transaction_reference'] ?? null)
            || filled($payment['notes'] ?? null)
            || filled($payment['paid_at'] ?? null);
    }

    private function validatePaymentInput(Request $request): void
    {
        $request->validate([
            'payment.invoice_amount'        => ['required', 'numeric', 'min:0'],
            'payment.amount_received'       => ['nullable', 'numeric', 'min:0'],
            'payment.payment_method'        => ['nullable', 'string', 'max:50'],
            'payment.transaction_reference' => ['nullable', 'string', 'max:255'],
            'payment.notes'                 => ['nullable', 'string'],
            'payment.paid_at'               => ['nullable', 'date'],
            'payment.receipt'               => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);
    }

    private function storeOptionalPayment(Request $request, Client $client): Payment
    {
        $data = $request->validate([
            'payment.invoice_amount'        => ['required', 'numeric', 'min:0'],
            'payment.amount_received'       => ['nullable', 'numeric', 'min:0'],
            'payment.payment_method'        => ['nullable', 'string', 'max:50'],
            'payment.transaction_reference' => ['nullable', 'string', 'max:255'],
            'payment.notes'                 => ['nullable', 'string'],
            'payment.paid_at'               => ['nullable', 'date'],
            'payment.receipt'               => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ])['payment'];

        $receipt = $request->file('payment.receipt');
        unset($data['receipt']);

        $data['client_id'] = $client->id;
        $data['created_by'] = auth()->id();
        $data['amount_received'] = $data['amount_received'] ?? 0;

        $payment = Payment::create($data);

        if ($receipt instanceof UploadedFile) {
            $payment->update([
                'receipt_path' => $receipt->store("clients/{$client->id}/receipts", 'private'),
            ]);
        }

        $proofNote = $receipt ? ' with payment proof' : '';
        $this->activity->log(
            $client,
            Activity::ACTION_PAYMENT_CREATED,
            "Payment of \${$payment->invoice_amount} created (received: \${$payment->amount_received}){$proofNote}"
        );

        if ((float) $payment->amount_received > 0) {
            $this->notifications->notifyClientStakeholders($client, NotificationService::TYPE_PAYMENT_RECEIVED, [
                'payment_id'    => $payment->id,
                'client_id'     => $client->id,
                'client_name'   => $client->display_name,
                'client_number' => $client->client_number,
                'amount'        => $payment->amount_received,
            ]);
        }

        return $payment;
    }
}
