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
                'client_name'     => $cs->client->lead?->name ?? '—',
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
