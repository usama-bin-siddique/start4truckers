<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientReminder extends Model
{
    public const MAX_PER_BATCH = 10;

    protected $fillable = [
        'client_id',
        'remind_at',
        'timezone',
        'description',
        'created_by',
        'notified_at',
    ];

    protected function casts(): array
    {
        return [
            'remind_at'   => 'datetime',
            'notified_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function scopeUpcoming($query)
    {
        return $query->whereNull('notified_at')->where('remind_at', '>=', now());
    }

    public function scopeOverdue($query)
    {
        return $query->whereNull('notified_at')->where('remind_at', '<', now());
    }

    public function displayTimezone(): string
    {
        if (is_string($this->timezone) && in_array($this->timezone, timezone_identifiers_list(), true)) {
            return $this->timezone;
        }

        return 'UTC';
    }

    public function dueLabel(): string
    {
        return $this->remind_at
            ? $this->remind_at->copy()->timezone($this->displayTimezone())->format('M j, Y g:i A')
            : '';
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
