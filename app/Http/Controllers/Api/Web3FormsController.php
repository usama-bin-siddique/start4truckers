<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Setting;
use App\Services\ActivityService;
use App\Services\LeadIntakeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class Web3FormsController extends Controller
{
    public function __construct(
        private LeadIntakeService $intake,
        private ActivityService $activity
    ) {}

    public function receive(Request $request): JsonResponse
    {
        $secret = Setting::get('web3forms_secret');
        if ($secret) {
            $incoming = $request->header('X-Web3Forms-Secret')
                ?? $request->input('access_key');

            if ($incoming !== $secret) {
                Log::warning('Web3Forms: invalid secret key received.');
                return response()->json(['message' => 'Unauthorized'], 401);
            }
        }

        $payload = $request->all();

        $name    = $payload['name']             ?? $payload['full_name']      ?? $payload['your-name']     ?? null;
        $email   = $payload['email']            ?? $payload['your-email']     ?? null;
        $phone   = $payload['phone']            ?? $payload['phone_number']   ?? $payload['your-phone']    ?? null;
        $state   = $payload['state']            ?? $payload['your-state']     ?? null;
        $company = $payload['company']          ?? $payload['company_name']   ?? $payload['your-company']  ?? null;
        $service = $payload['service']          ?? $payload['service_required'] ?? $payload['what_service'] ?? null;
        $message = $payload['message']          ?? $payload['notes']          ?? $payload['your-message']  ?? null;
        $address = $payload['address'] ?? implode(', ', array_filter([
            $payload['address_street'] ?? null,
            $payload['address_city'] ?? null,
            $payload['address_state'] ?? null,
            $payload['address_zip'] ?? null,
        ]));

        if (empty($name) && empty($email)) {
            Log::warning('Web3Forms: received submission with no name or email.', $payload);
            return response()->json(['message' => 'Missing required fields'], 422);
        }

        // Collect all extra payload fields into meta
        $knownKeys = [
            'name', 'full_name', 'your-name', 'email', 'your-email', 'phone', 'phone_number', 'your-phone',
            'state', 'your-state', 'company', 'company_name', 'your-company', 'service', 'service_required',
            'what_service', 'message', 'notes', 'your-message', 'address', 'address_street', 'address_city',
            'address_state', 'address_zip', 'date_of_birth', 'dob', 'ssn_itin', 'business_name_1',
            'business_name_2', 'business_name_3', 'state_of_formation', 'formation_state', 'business_purpose',
            'truck_type', 'truck_vin', 'operation_area', 'operation_type', 'hear_about_us', 'reference_id',
            'subject', 'from_name', 'access_key', 'botcheck',
        ];
        $meta = collect($payload)->except($knownKeys)->filter(fn ($v) => $v !== null && $v !== '')->all();
        if ($request->filled('subject')) {
            $meta['submission_subject'] = $request->input('subject');
        }

        $lead = $this->intake->createFromWebsite([
            'name'             => $name ?? 'Unknown',
            'email'            => $email,
            'phone'            => $phone,
            'date_of_birth'    => $payload['date_of_birth'] ?? $payload['dob'] ?? null,
            'state'            => $state ?: ($payload['address_state'] ?? null),
            'address'          => $address ?: null,
            'ssn_itin'         => $payload['ssn_itin'] ?? null,
            'company'          => $company,
            'business_name_1'  => $payload['business_name_1'] ?? null,
            'business_name_2'  => $payload['business_name_2'] ?? null,
            'business_name_3'  => $payload['business_name_3'] ?? null,
            'state_of_formation' => $payload['state_of_formation'] ?? $payload['formation_state'] ?? null,
            'business_purpose' => $payload['business_purpose'] ?? null,
            'truck_type'       => $payload['truck_type'] ?? null,
            'truck_vin'        => $payload['truck_vin'] ?? null,
            'operation_area'   => $payload['operation_area'] ?? null,
            'operation_type'   => $payload['operation_type'] ?? null,
            'hear_about_us'    => $payload['hear_about_us'] ?? null,
            'reference_id'     => $payload['reference_id'] ?? null,
            'service_required' => $service,
            'notes'            => $message,
            'meta'             => $meta ?: null,
        ]);

        Log::info("Web3Forms: lead #{$lead->id} created for {$lead->name}");

        $this->activity->log(
            $lead,
            Activity::ACTION_WEBHOOK_RECEIVED,
            "Web3Forms webhook triggered successfully for {$lead->name} (Form submission captured)",
            null,
            [
                'service'   => $service,
                'email'     => $email,
                'phone'     => $phone,
                'client_ip' => $request->ip(),
            ]
        );

        return response()->json([
            'message' => 'Lead created successfully',
            'lead_id' => $lead->id,
        ], 201);
    }
}
