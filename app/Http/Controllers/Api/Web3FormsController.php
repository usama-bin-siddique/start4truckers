<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Lead;
use App\Models\Setting;
use App\Services\ActivityService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class Web3FormsController extends Controller
{
    public function __construct(
        private ActivityService $activity,
        private NotificationService $notification
    ) {}

    public function receive(Request $request): JsonResponse
    {
        // Validate the secret key if configured
        $secret = Setting::get('web3forms_secret');
        if ($secret) {
            $incoming = $request->header('X-Web3Forms-Secret')
                ?? $request->input('access_key');

            if ($incoming !== $secret) {
                Log::warning('Web3Forms: invalid secret key received.');
                return response()->json(['message' => 'Unauthorized'], 401);
            }
        }

        // Map incoming fields — Web3Forms field names may vary
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

        $lead = Lead::create([
            'name'             => $name ?? 'Unknown',
            'email'            => $email,
            'phone'            => $phone,
            'state'            => $state,
            'company'          => $company,
            'service_required' => $service,
            'notes'            => $message,
            'source'           => 'website',
            'status'           => Lead::STATUS_NEW,
        ]);

        $this->activity->log(
            $lead,
            Activity::ACTION_LEAD_CREATED,
            "Lead created automatically from website form submission",
            null,
            null,
            null // system action, no causer
        );
        
        // Notify all admins and sales users about new lead
        $adminsAndSales = \App\Models\User::whereIn('role', ['admin', 'sales'])
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();
        
        $this->notification->notifyMultiple($adminsAndSales, NotificationService::TYPE_NEW_LEAD, [
            'lead_id'   => $lead->id,
            'lead_name' => $lead->name,
            'source'    => 'website',
        ]);

        Log::info("Web3Forms: lead #{$lead->id} created for {$lead->name}");

        return response()->json([
            'message' => 'Lead created successfully',
            'lead_id' => $lead->id,
        ], 201);
    }
}
