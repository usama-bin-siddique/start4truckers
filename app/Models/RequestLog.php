<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestLog extends Model
{
    public const ACTION_REQUEST      = 'request';
    public const ACTION_LOGIN        = 'login';
    public const ACTION_LOGOUT       = 'logout';
    public const ACTION_FAILED_LOGIN = 'failed_login';

    protected $fillable = [
        'action',
        'method',
        'url',
        'ip',
        'user_agent',
        'user_id',
        'request_payload',
        'response_payload',
        'status_code',
        'duration',
        'total_queries',
        'db_queries',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function decodedRequestPayload(): mixed
    {
        $payload = $this->request_payload;

        if (! is_string($payload) || $payload === '') {
            return $payload;
        }

        $decoded = json_decode($payload, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : $payload;
    }

    public function decodedDbQueries(): array
    {
        $raw = $this->db_queries;

        if (! is_string($raw) || $raw === '') {
            return ['total_time_ms' => 0, 'queries' => []];
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return ['total_time_ms' => 0, 'queries' => []];
        }

        if (isset($decoded['queries'])) {
            return $decoded;
        }

        return ['total_time_ms' => 0, 'queries' => $decoded];
    }
}
