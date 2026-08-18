<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LeadIntakeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebsiteLeadController extends Controller
{
    public function store(Request $request, LeadIntakeService $intake): JsonResponse
    {
        $data = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'email'            => ['nullable', 'email', 'max:255', 'required_without:phone'],
            'phone'            => ['nullable', 'string', 'max:30', 'required_without:email'],
            'state'            => ['nullable', 'string', 'max:100'],
            'company'          => ['nullable', 'string', 'max:255'],
            'service_required' => ['nullable', 'string', 'max:255'],
            'notes'            => ['nullable', 'string', 'max:5000'],
        ]);

        $lead = $intake->createFromWebsite($data);

        return response()->json([
            'message' => 'Lead received.',
            'data'    => [
                'id'     => $lead->id,
                'status' => $lead->status,
            ],
        ], 201);
    }
}
