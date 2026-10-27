<?php

namespace App\Services;

use App\Contracts\SendsPushNotifications;
use App\Models\DeviceToken;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FirebasePush implements SendsPushNotifications
{
    public function send(int $userId, string $title, string $body, ?string $url, ?int $notificationId = null): void
    {
        $tokens = DeviceToken::query()->where('user_id', $userId)->pluck('token');

        if ($tokens->isEmpty()) {
            Log::info("FirebasePush: No device tokens found for User #{$userId}. Push skipped.");
            return;
        }

        $accessToken = $this->accessToken();

        if (! $accessToken) {
            Log::warning("FirebasePush: Could not obtain Google OAuth access token.");
            return;
        }

        $projectId = $this->projectId();
        Log::info("FirebasePush: Dispatching push to User #{$userId} ({$tokens->count()} token(s)): {$title}");

        foreach ($tokens as $token) {
            try {
                $response = Http::timeout(10)
                    ->retry(2, 200)
                    ->withToken($accessToken)
                    ->acceptJson()
                    ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                        'message' => [
                            'token' => $token,
                            'notification' => [
                                'title' => $title,
                                'body' => $body,
                            ],
                            'data' => array_filter([
                                'title' => $title,
                                'body' => $body,
                                'url' => $url,
                                'notification_id' => (string) $notificationId,
                            ]),
                            'webpush' => [
                                'headers' => [
                                    'Urgency' => 'high',
                                ],
                                'notification' => [
                                    'title' => $title,
                                    'body' => $body,
                                    'icon' => url('/images/logo.png'),
                                    'requireInteraction' => true,
                                ],
                                'fcm_options' => [
                                    'link' => $url ?: url('/notifications'),
                                ],
                            ],
                        ],
                    ]);

                if ($response->status() === 404 || str_contains($response->body(), 'UNREGISTERED')) {
                    DeviceToken::query()->where('token', $token)->delete();
                } elseif ($response->failed()) {
                    Log::warning('Firebase push failed', [
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);
                }
            } catch (\Throwable $e) {
                Log::error('FirebasePush HTTP Exception: ' . $e->getMessage());
            }
        }
    }

    private function accessToken(): ?string
    {
        $credentials = $this->credentials();

        if (! $credentials) {
            return null;
        }

        $cached = Cache::get('firebase_messaging_token');

        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $now = time();
        $header = $this->base64Url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $claim = $this->base64Url(json_encode([
            'iss' => $credentials['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
        ]));
        $unsigned = $header.'.'.$claim;

        $signed = openssl_sign($unsigned, $signature, $credentials['private_key'], OPENSSL_ALGO_SHA256);

        if (! $signed) {
            Log::warning('Firebase credentials could not be signed.');

            return null;
        }

        $jwt = $unsigned.'.'.$this->base64Url($signature);

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        $token = $response->json('access_token');

        if (! is_string($token) || $token === '') {
            Log::warning('Firebase access token request failed.', ['status' => $response->status()]);

            return null;
        }

        Cache::put('firebase_messaging_token', $token, now()->addMinutes(50));

        return $token;
    }

    /**
     * @return array{client_email: string, private_key: string, project_id?: string}|null
     */
    private function credentials(): ?array
    {
        $path = config('services.firebase.credentials');

        if (! is_string($path) || $path === '' || ! is_file($path)) {
            return null;
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        if (! is_array($decoded) || empty($decoded['client_email']) || empty($decoded['private_key'])) {
            return null;
        }

        return $decoded;
    }

    private function projectId(): string
    {
        $credentials = $this->credentials();

        return (string) ($credentials['project_id'] ?? config('services.firebase.project_id'));
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
