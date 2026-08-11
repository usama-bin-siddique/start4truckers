<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Activity extends Model
{
    protected $fillable = [
        'subject_type',
        'subject_id',
        'causer_id',
        'action',
        'description',
        'old_value',
        'new_value',
    ];

    protected function casts(): array
    {
        return [
            'old_value' => 'array',
            'new_value' => 'array',
        ];
    }

    // Action constants
    const ACTION_LEAD_CREATED       = 'lead_created';
    const ACTION_LEAD_ASSIGNED      = 'lead_assigned';
    const ACTION_STATUS_CHANGED     = 'status_changed';
    const ACTION_NOTE_ADDED         = 'note_added';
    const ACTION_PAYMENT_CREATED    = 'payment_created';
    const ACTION_PAYMENT_UPDATED    = 'payment_updated';
    const ACTION_CONVERTED          = 'converted_to_client';
    const ACTION_DOCUMENT_UPLOADED  = 'document_uploaded';
    const ACTION_DOCUMENT_DELETED   = 'document_deleted';
    const ACTION_TASK_CREATED       = 'task_created';
    const ACTION_SERVICE_UPDATED    = 'service_updated';
    const ACTION_CLIENT_CREATED     = 'client_created';

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function causer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'causer_id');
    }
}
