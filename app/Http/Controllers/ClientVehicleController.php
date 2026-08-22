<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientVehicle;
use App\Services\ActivityService;
use App\Support\ClientProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ClientVehicleController extends Controller
{
    public function __construct(private ActivityService $activity) {}

    public function store(Request $request, Client $client): RedirectResponse
    {
        $this->authorize('update', $client);

        $request->merge(
            collect($request->all())->map(fn ($value) => $value === '' ? null : $value)->all()
        );
        $data = $this->blankToNull($request->validate(ClientProfile::vehicleRules()));
        $vehicle = $client->vehicles()->create($data);

        $label = trim(collect([$vehicle->year, $vehicle->make, $vehicle->model])->filter()->implode(' ')) ?: 'vehicle';
        $this->activity->log($client, 'vehicle_added', "Fleet vehicle added ({$label})");

        return back()->with('success', 'Vehicle added.');
    }

    public function update(Request $request, Client $client, ClientVehicle $vehicle): RedirectResponse
    {
        $this->authorize('update', $client);
        abort_unless($vehicle->client_id === $client->id, 404);

        $request->merge(collect($request->all())->map(fn ($value) => $value === '' ? null : $value)->all());
        $vehicle->update($request->validate(ClientProfile::vehicleRules()));

        return back()->with('success', 'Vehicle updated.');
    }

    public function destroy(Client $client, ClientVehicle $vehicle): RedirectResponse
    {
        $this->authorize('update', $client);
        abort_unless($vehicle->client_id === $client->id, 404);

        $vehicle->delete();

        return back()->with('success', 'Vehicle removed.');
    }

    private function blankToNull(array $data): array
    {
        return collect($data)->map(fn ($value) => $value === '' ? null : $value)->all();
    }
}
