<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Diagnostic endpoint: receives any payload and logs it verbatim.
 * Attach once to the real endpoint; check it before we start saving data.
 */
class PayloadLogController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $payload = [
            'headers'   => collect($request->headers->all())
                ->only(['content-type', 'user-agent', 'origin', 'referer'])
                ->all(),
            'ip'        => $request->ip(),
            'method'    => $request->method(),
            'url'       => $request->fullUrl(),
            'json'      => $request->json()->all(),
            'input'     => $request->except(['files']),
            'all'       => $request->all(),
            'files'     => collect($request->allFiles())
                ->flatten()
                ->map(fn ($file) => [
                    'field'   => $file->getClientOriginalName(),
                    'size'    => $file->getSize(),
                    'mime'    => $file->getClientMimeType(),
                ])
                ->all(),
        ];

        Log::info('--- INCOMING PAYLOG ---', $payload);

        return response()->json([
            'message' => 'Payload logged.',
            'logged'  => $payload,
        ]);
    }
}
