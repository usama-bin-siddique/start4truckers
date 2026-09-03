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

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
