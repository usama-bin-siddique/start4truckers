<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Client;
use App\Models\ClientService;
use App\Models\Service;
use App\Services\ActivityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OperationController extends Controller
{
    public function __construct(private ActivityService $activity) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', ClientService::class);

        $query = ClientService::with(['client.lead', 'service', 'assignedUser'])
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->service_id, fn ($q, $v) => $q->where('service_id', $v))
            ->when($request->assigned_to, fn ($q, $v) => $q->where('assigned_to', $v))
            ->when($request->search, fn ($q, $v) =>
                $q->whereHas('client.lead', fn ($q) =>
                    $q->where('name', 'like', "%{$v}%")
                      ->orWhere('company', 'like', "%{$v}%")
                )->orWhereHas('client', fn ($q) =>
                    $q->where('client_number', 'like', "%{$v}%")
                )
            );

        $services = $query->latest()->paginate(25)->withQueryString();

        return Inertia::render('Operations/Index', [
            'services'     => $services->through(fn ($cs) => [
                'id'              => $cs->id,
                'client_id'       => $cs->client_id,
                'client_number'   => $cs->client->client_number,
                'client_name'     => $cs->client->display_name,
                'service_name'    => $cs->service->name,
                'status'          => $cs->status,
                'assigned_user'   => $cs->assignedUser ? ['name' => $cs->assignedUser->name] : null,
                'completion_date' => $cs->completion_date?->toDateString(),
                'notes'           => $cs->notes,
            ]),
            'all_services' => Service::where('is_active', true)->orderBy('order')->get(['id', 'name']),
            'users'        => \App\Models\User::where('is_active', true)->select('id', 'name', 'role')->get(),
            'filters'      => $request->only(['search', 'status', 'service_id', 'assigned_to']),
            'stats'        => [
                'pending'     => ClientService::where('status', 'pending')->count(),
                'in_progress' => ClientService::where('status', 'in_progress')->count(),
                'completed'   => ClientService::where('status', 'completed')->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', ClientService::class);

        $data = $request->validate([
            'client_id'   => ['required', 'exists:clients,id'],
            'service_id'  => [
                'required',
                'exists:services,id',
                Rule::unique('client_services', 'service_id')->where(
                    fn ($q) => $q->where('client_id', $request->integer('client_id'))
                ),
            ],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'notes'       => ['nullable', 'string', 'max:1000'],
        ], [
            'service_id.unique' => 'That service is already assigned to this client.',
        ]);

        $data['status'] = ClientService::STATUS_PENDING;

        $operation = ClientService::create($data)->load('service');
        $client    = Client::findOrFail($data['client_id']);

        if ($client->status === Client::STATUS_COMPLETED) {
            $client->update(['status' => Client::STATUS_ACTIVE]);
        }

        $this->activity->log(
            $client,
            Activity::ACTION_SERVICE_ASSIGNED,
            "Service \"{$operation->service->name}\" assigned"
        );

        return Inertia::flash('success', 'Service assigned.')->back()->with('success', 'Service assigned.');
    }

    public function update(Request $request, ClientService $operation): RedirectResponse
    {
        $this->authorize('update', $operation);

        $data = $request->validate([
            'status'          => ['required', 'in:pending,in_progress,completed'],
            'assigned_to'     => ['nullable', 'exists:users,id'],
            'completion_date' => ['nullable', 'date'],
            'notes'           => ['nullable', 'string', 'max:1000'],
        ]);

        $old = $operation->status;
        $operation->update($data);

        $this->activity->log(
            $operation->client,
            Activity::ACTION_SERVICE_UPDATED,
            "Service \"{$operation->service->name}\" updated to \"{$data['status']}\"",
            ['status' => $old],
            ['status' => $data['status']]
        );

        // Auto-complete client if all services done
        $client = $operation->client;
        $allDone = $client->clientServices()->where('status', '!=', 'completed')->doesntExist();
        if ($allDone && $client->status === 'active') {
            $client->update(['status' => Client::STATUS_COMPLETED]);
            $this->activity->log($client, 'status_changed',
                'All services completed — client status set to Completed'
            );
        }

        return back()->with('success', 'Service updated.');
    }
}
