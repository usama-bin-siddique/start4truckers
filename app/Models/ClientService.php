<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientService extends Model
{
    protected $fillable = [
        'client_id',
        'service_id',
        'package',
        'purchase_date',
        'service_price',
        'government_fee',
        'payment_status',
        'status',
        'assigned_to',
        'start_date',
        'completion_date',
        'renewal_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'completion_date' => 'datetime',
            'purchase_date'   => 'date',
            'start_date'      => 'date',
            'renewal_date'    => 'date',
            'service_price'   => 'decimal:2',
            'government_fee'  => 'decimal:2',
        ];
    }

    // Status constants
    const STATUS_PENDING     = 'pending';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED   = 'completed';

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
