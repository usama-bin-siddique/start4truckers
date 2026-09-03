<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Client;
use App\Models\ClientCustomField;
use App\Services\ActivityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ClientCustomFieldController extends Controller
{
    public function __construct(private ActivityService $activity) {}

    public function store(Request $request, Client $client): RedirectResponse
    {
        $this->authorize('update', $client);

        $data = $this->validated($request);

        if ($client->customFields()->count() >= ClientCustomField::MAX_PER_CLIENT) {
            throw ValidationException::withMessages([
                'label' => 'This client already has the maximum number of custom fields.',
            ]);
        }

        $field = $client->customFields()->create([
            'label'      => $data['label'],
            'value'      => $data['value'] ?? null,
            'sort_order' => (int) $client->customFields()->max('sort_order') + 1,
        ]);

        $this->activity->log(
            $client,
            Activity::ACTION_CUSTOM_FIELD_ADDED,
            "Custom field \"{$field->label}\" added."
        );

        return back()->with('success', 'Custom field added.');
    }

    public function update(Request $request, Client $client, ClientCustomField $customField): RedirectResponse
    {
        $this->authorize('update', $client);
        abort_unless($customField->client_id === $client->id, 404);

        $data = $this->validated($request);
        $customField->update($data);

        $this->activity->log(
            $client,
            Activity::ACTION_CUSTOM_FIELD_UPDATED,
            "Custom field \"{$customField->label}\" updated."
        );

        return back()->with('success', 'Custom field updated.');
    }

    public function destroy(Client $client, ClientCustomField $customField): RedirectResponse
    {
        $this->authorize('update', $client);
        abort_unless($customField->client_id === $client->id, 404);

        $label = $customField->label;
        $customField->delete();

        $this->activity->log(
            $client,
            Activity::ACTION_CUSTOM_FIELD_DELETED,
            "Custom field \"{$label}\" removed."
        );

        return back()->with('success', 'Custom field removed.');
    }

    /**
     * @return array{label: string, value: ?string}
     */
    private function validated(Request $request): array
    {
        $request->merge(
            collect($request->only(['label', 'value']))->map(fn ($value) => $value === '' ? null : $value)->all()
        );

        $data = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'value' => ['nullable', 'string', 'max:5000'],
        ]);

        $data['label'] = trim($data['label']);
        $data['value'] = isset($data['value']) ? trim((string) $data['value']) : null;
        if ($data['value'] === '') {
            $data['value'] = null;
        }

        return $data;
    }
}
