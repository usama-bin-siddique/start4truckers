<?php

namespace App\Http\Controllers;

use App\Models\DeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DeviceTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:512'],
        ]);

        DeviceToken::query()->updateOrCreate(
            ['token' => $data['token']],
            ['user_id' => Auth::id()],
        );

        return response()->json(['saved' => true]);
    }

    public function testPush(Request $request, \App\Services\FirebasePush $push): JsonResponse
    {
        $userId = Auth::id();
        $tokenCount = DeviceToken::where('user_id', $userId)->count();

        if ($tokenCount === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No registered device token found for your user. Please grant browser notification permission first.',
            ], 422);
        }

        try {
            $push->send(
                $userId,
                '🔔 Test Push Notification',
                'FCM is working! Desktop push notification received successfully.',
                url('/notifications')
            );

            return response()->json([
                'success' => true,
                'message' => 'Test push notification sent successfully!',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send push: ' . $e->getMessage(),
            ], 500);
        }
    }
}
