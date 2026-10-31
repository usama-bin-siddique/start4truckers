<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Lead;
use App\Services\LeadIntakeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Website intake endpoint.
 *
 * Accepts the field names used by the Starter Package HTML form as well as the
 * normalized API field names. Logs every raw payload (for the website partner
 * debugging) and persists the submission as a Lead plus a linked Client record.
 */
class PayloadLogController extends Controller
{
    private const FILE_CATEGORIES = [
        'dl', 'ssn_card', 'cdl', 'proof_of_address', 'photo',
        'signature', 'global_entry', 'social_security_card', 'birth_certificate',
    ];

    public function store(Request $request, LeadIntakeService $intake): JsonResponse
    {
        $street = $this->firstFilled($request, ['address_street', 'Street Address', 'Business Physical Address']);
        $city = $this->firstFilled($request, ['address_city', 'City']);
        $state = $this->firstFilled($request, ['state', 'address_state', 'State']);
        $zip = $this->firstFilled($request, ['address_zip', 'ZIP', 'Zip']);
        $address = $this->firstFilled($request, ['address']);

        $request->merge([
            'name' => $this->firstFilled($request, ['name', 'full_name', 'Full Legal Name']),
            'email' => $this->firstFilled($request, ['email', 'Email', 'replyto']),
            'phone' => $this->firstFilled($request, ['phone', 'phone_number', 'Phone']),
            'date_of_birth' => $this->firstFilled($request, ['date_of_birth', 'dob', 'Date of Birth']),
            'state' => $state,
            'state_of_formation' => $this->firstFilled($request, ['state_of_formation', 'formation_state', 'State of LLC Formation']),
            'company' => $this->firstFilled($request, ['company', 'Business Legal Name']),
            'service_required' => $this->serviceFromSubject($request->input('subject'))
                ?? $this->firstFilled($request, ['service_required']),
            'address' => $address !== null && $address !== ''
                ? $address
                : implode(', ', array_filter([$street, $city, $state, $zip])),
            'ssn_itin' => $this->firstFilled($request, ['ssn_itin', 'SSN or ITIN']),
            'business_name_1' => $this->firstFilled($request, ['business_name_1', 'llc_name_1', 'Desired Business Name (1st choice)']),
            'business_name_2' => $this->firstFilled($request, ['business_name_2', 'llc_name_2', 'Alternative Name (2nd choice)']),
            'business_name_3' => $this->firstFilled($request, ['business_name_3', 'llc_name_3', 'Alternative Name (3rd choice)']),
            'business_purpose' => $this->firstFilled($request, ['business_purpose', 'Business Purpose / Activity']),
            'truck_type' => $this->firstFilled($request, ['truck_type', 'Truck Type']),
            'truck_vin' => $this->firstFilled($request, ['truck_vin', 'Truck VIN']),
            'operation_area' => $this->firstFilled($request, ['operation_area', 'Operation Area (City/Region)']),
            'operation_type' => $this->firstFilled($request, ['operation_type', 'Operation Type']),
            'hear_about_us' => $this->firstFilled($request, ['hear_about_us', 'heard_about_us', 'How did you hear about us?']),
            'reference_id' => $this->firstFilled($request, ['reference_id', 'Reference ID']),
            'notes' => $this->firstFilled($request, ['notes', 'Additional Notes / Questions', 'Current compliance issues or concerns']),
        ]);

        $webhookLog = Activity::create([
            'subject_type' => Lead::class,
            'subject_id'   => 0,
            'causer_id'    => null,
            'action'       => Activity::ACTION_WEBHOOK_RECEIVED,
            'description'  => 'Website webhook /api/leads/log was called.',
            'new_value'    => [
                'subject'   => $request->input('subject'),
                'name'      => $request->input('name'),
                'email'     => $request->input('email'),
                'phone'     => $request->input('phone'),
                'client_ip' => $request->ip(),
            ],
        ]);

        // Keep the raw payload in the logs so we can debug partner submissions.
        Log::info('--- INCOMING PAYLOG ---', [
            'subject' => $request->input('subject'),
            'ip'      => $request->ip(),
            'json'    => $request->json()->all(),
            'file_names' => collect($request->allFiles())->flatten()->map(
                fn (UploadedFile $f) => $f->getClientOriginalName()
            )->all(),
        ]);

        try {
            $data = $request->validate([
            'name'              => ['required', 'string', 'max:255'],
            'date_of_birth'     => ['nullable', 'date'],
            'email'             => ['nullable', 'email', 'max:255', 'required_without:phone'],
            'phone'             => ['nullable', 'string', 'max:50', 'required_without:email'],
            'state'             => ['nullable', 'string', 'max:100'],
            'address'           => ['nullable', 'string', 'max:2000'],
            'ssn_itin'          => ['nullable', 'string', 'max:50'],
            'company'           => ['nullable', 'string', 'max:255'],
            'business_name_1'   => ['nullable', 'string', 'max:255'],
            'business_name_2'   => ['nullable', 'string', 'max:255'],
            'business_name_3'   => ['nullable', 'string', 'max:255'],
            'state_of_formation'=> ['nullable', 'string', 'max:255'],
            'business_purpose'  => ['nullable', 'string', 'max:2000'],
            'truck_type'        => ['nullable', 'string', 'max:100'],
            'truck_vin'         => ['nullable', 'string', 'max:30'],
            'operation_area'    => ['nullable', 'string', 'max:255'],
            'operation_type'    => ['nullable', 'string', 'max:50'],
            'hear_about_us'     => ['nullable', 'string', 'max:100'],
            'reference_id'      => ['nullable', 'string', 'max:100'],
            'service_required'  => ['nullable', 'string', 'max:255'],
            'notes'             => ['nullable', 'string', 'max:5000'],
            ]);
        } catch (ValidationException $e) {
            $webhookLog->update([
                'description' => 'Website webhook /api/leads/log was called, but the payload was rejected.',
                'new_value'   => array_merge($webhookLog->new_value ?? [], [
                    'errors' => $e->errors(),
                ]),
            ]);

            throw $e;
        }

        // Collect all extra payload fields into meta so no submission data is lost
        $knownKeys = [
            'name', 'full_name', 'Full Legal Name', 'date_of_birth', 'dob', 'Date of Birth',
            'email', 'Email', 'replyto', 'phone', 'phone_number', 'Phone',
            'state', 'address_state', 'State', 'address', 'address_street', 'Street Address',
            'address_city', 'City', 'address_zip', 'ZIP', 'Zip',
            'ssn_itin', 'SSN or ITIN', 'company', 'Business Legal Name',
            'Business Physical Address', 'Current compliance issues or concerns',
            'business_name_1', 'llc_name_1', 'Desired Business Name (1st choice)',
            'business_name_2', 'llc_name_2', 'Alternative Name (2nd choice)',
            'business_name_3', 'llc_name_3', 'Alternative Name (3rd choice)',
            'state_of_formation', 'formation_state', 'State of LLC Formation',
            'business_purpose', 'Business Purpose / Activity',
            'truck_type', 'Truck Type', 'truck_vin', 'Truck VIN',
            'operation_area', 'Operation Area (City/Region)',
            'operation_type', 'Operation Type',
            'hear_about_us', 'heard_about_us', 'How did you hear about us?',
            'reference_id', 'Reference ID',
            'service_required', 'notes', 'Additional Notes / Questions',
            'files', 'files_note', 'subject', 'from_name', 'access_key', 'botcheck',
        ];
        $meta = collect($request->all())->except($knownKeys)->filter(fn ($v) => $v !== null && $v !== '')->all();
        if ($request->filled('subject')) {
            $meta['submission_subject'] = $request->input('subject');
        }
        $data['meta'] = $meta ?: null;

        $uploads = $request->file('files', []) ?? [];
        $files   = [];

        foreach ($uploads as $category => $fileList) {
            $category = preg_replace('/[^a-z0-9_]/', '', mb_strtolower($category));

            if (! in_array($category, self::FILE_CATEGORIES, true)) {
                continue;
            }

            foreach ((array) $fileList as $file) {
                if ($file instanceof UploadedFile && $file->isValid()) {
                    $files[$category][] = $file;
                }
            }
        }

        $lead = DB::transaction(function () use ($intake, $data, $files) {
            $lead = $intake->createFromWebsite($data, $files);
            $lead->update(['source' => 'website']);

            return $lead;
        });

        $webhookLog->update([
            'subject_id'  => $lead->id,
            'description' => "Website webhook /api/leads/log received a lead for {$lead->name}.",
            'new_value'   => array_merge($webhookLog->new_value ?? [], [
                'lead_id' => $lead->id,
                'service' => $lead->service_required,
                'email'   => $lead->email,
            ]),
        ]);

        return response()->json([
            'message' => 'Lead received and stored.',
            'data'    => [
                'lead'            => [
                    'id'              => $lead->id,
                    'status'          => $lead->status,
                    'service'         => $lead->service_required,
                    'documents_count' => $lead->documents()->count(),
                ],
            ],
        ], 201);
    }

    /**
     * Derive the service name from the website's subject line,
     * e.g. "New Starter Package Order — $999" => "Starter Package".
     */
    private function firstFilled(Request $request, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $request->input($key);

            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return null;
    }

    private function serviceFromSubject(?string $subject): ?string
    {
        $subject = trim((string) $subject);

        if ($subject === '') {
            return null;
        }

        if (preg_match('/^New\s+(.+?)\s+(?:Order|Request)\b/iu', $subject, $m)) {
            return trim($m[1]);
        }

        if (preg_match('/^New\s+(.+?)(?:\s+[—–\-].*)?$/u', $subject, $m)) {
            return trim($m[1]);
        }

        return null;
    }
}
