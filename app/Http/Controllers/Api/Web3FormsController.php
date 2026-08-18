<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\LeadIntakeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class Web3FormsController extends Controller
{
    public function __construct(
        private LeadIntakeService $intake
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

        if (empty($name) && empty($email)) {
            Log::warning('Web3Forms: received submission with no name or email.', $payload);
            return response()->json(['message' => 'Missing required fields'], 422);
        }

        $lead = $this->intake->createFromWebsite([
            'name'             => $name ?? 'Unknown',
            'email'            => $email,
            'phone'            => $phone,
            'state'            => $state,
            'company'          => $company,
            'service_required' => $service,
            'notes'            => $message,
        ]);

        Log::info("Web3Forms: lead #{$lead->id} created for {$lead->name}");

        return response()->json([
            'message' => 'Lead created successfully',
            'lead_id' => $lead->id,
        ], 201);
    }
}
