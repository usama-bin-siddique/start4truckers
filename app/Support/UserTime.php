<?php

namespace App\Support;

use Carbon\Carbon;
use Illuminate\Http\Request;

class UserTime
{
    public static function zone(?Request $request = null): string
    {
        $request ??= request();
        $candidates = [
            $request->header('X-Timezone'),
            $request->input('timezone'),
        ];

        foreach ($candidates as $timezone) {
            if (is_string($timezone) && in_array($timezone, timezone_identifiers_list(), true)) {
                return $timezone;
            }
        }

        return 'UTC';
    }

    public static function parse(?string $value, ?string $timezone = null, ?int $offsetMinutes = null): ?Carbon
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $value = str_replace('T', ' ', trim($value));
        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $value)) {
            $value .= ':00';
        }

        if (is_string($timezone) && in_array($timezone, timezone_identifiers_list(), true)) {
            $parsed = Carbon::createFromFormat('Y-m-d H:i:s', substr($value, 0, 19), $timezone);
        } elseif ($offsetMinutes !== null) {
            $parsed = Carbon::createFromFormat('Y-m-d H:i:s', substr($value, 0, 19), 'UTC')?->addMinutes($offsetMinutes);
        } else {
            $parsed = Carbon::createFromFormat('Y-m-d H:i:s', substr($value, 0, 19), self::zone());
        }

        return $parsed ? $parsed->utc() : null;
    }

    public static function iso(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return Carbon::parse($value)->utc()->toIso8601String();
    }
}
