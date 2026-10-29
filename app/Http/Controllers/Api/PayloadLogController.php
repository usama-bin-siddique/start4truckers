<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Lead;
use App\Services\ActivityService;
use App\Services\LeadIntakeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

    public function store(Request $request, LeadIntakeService $intake, ActivityService $activity): JsonResponse
    {
        $request->merge([
            'name'              => $request->input('name', $request->input('full_name')),
            'date_of_birth'     => $request->input('date_of_birth', $request->input('dob')),
            'state'             => $request->input('state', $request->input('address_state')),
            'state_of_formation'=> $request->input('state_of_formation', $request->input('formation_state')),
            'service_required'  => $request->input('service_required', $this->serviceFromSubject($request->input('subject'))),
            'address'           => $request->input('address', implode(', ', array_filter([
                $request->input('address_street'),
                $request->input('address_city'),
                $request->input('address_state'),
                $request->input('address_zip'),
            ]))),
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

        $data = $request->validate([
            'name'              => ['required', 'string', 'max:255'],
            'date_of_birth'     => ['nullable', 'date'],
            'email'             => ['nullable', 'email', 'max:255', 'required_without:phone'],
            'phone'             => ['nullable', 'string', 'max:30', 'required_without:email'],
            'state'             => ['nullable', 'string', 'max:100'],
            'address'           => ['nullable', 'string', 'max:2000'],
            'ssn_itin'          => ['nullable', 'string', 'max:50'],
            'company'           => ['nullable', 'string', 'max:255'],
            'business_name_1'   => ['nullable', 'string', 'max:255'],
            'business_name_2'   => ['nullable', 'string', 'max:255'],
            'business_name_3'   => ['nullable', 'string', 'max:255'],
            'state_of_formation'=> ['nullable', 'string', 'max:10'],
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

        // Collect all extra payload fields into meta so no submission data is lost
        $knownKeys = [
            'name', 'full_name', 'date_of_birth', 'dob', 'email', 'phone', 'phone_number',
            'state', 'address_state', 'address', 'address_street', 'address_city', 'address_zip',
            'ssn_itin', 'company', 'business_name_1', 'business_name_2', 'business_name_3',
            'state_of_formation', 'formation_state', 'business_purpose', 'truck_type', 'truck_vin',
            'operation_area', 'operation_type', 'hear_about_us', 'reference_id', 'service_required',
            'notes', 'files', 'files_note', 'subject', 'from_name', 'access_key', 'botcheck',
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

        $activity->log(
            $lead,
            Activity::ACTION_WEBHOOK_RECEIVED,
            "Website lead intake received for {$lead->name} ({$lead->service_required})",
            null,
            [
                'subject'   => $request->input('subject'),
                'service'   => $lead->service_required,
                'email'     => $lead->email,
                'client_ip' => $request->ip(),
            ]
        );

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
    private function serviceFromSubject(?string $subject): ?string
    {
        if (preg_match('/New\s+(.+?)\s+Request/i', (string) $subject, $m)) {
            return trim($m[1]);
        }

        if (preg_match('/New\s+(.+?)\s+Order/i', (string) $subject, $m)) {
            return trim($m[1]);
        }

        return 'Starter Package';
    }
}
