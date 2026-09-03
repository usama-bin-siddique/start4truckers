<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientCustomField extends Model
{
    public const MAX_PER_CLIENT = 50;

    protected $fillable = [
        'client_id',
        'label',
        'value',
        'sort_order',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
