<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'state',
        'company',
        'service_required',
        'notes',
        'source',
        'status',
        'assigned_to',
        'converted_by',
        'converted_at',
    ];

    protected function casts(): array
    {
        return [
            'converted_at' => 'datetime',
        ];
    }

    // Status constants
    const STATUS_NEW        = 'new';
    const STATUS_CONTACTED  = 'contacted';
    const STATUS_FOLLOW_UP  = 'follow-up';
    const STATUS_QUOTE_SENT = 'quote_sent';
    const STATUS_WON        = 'won';
    const STATUS_LOST       = 'lost';

    public static function statuses(): array
    {
        return [
            self::STATUS_NEW        => 'New',
            self::STATUS_CONTACTED  => 'Contacted',
            self::STATUS_FOLLOW_UP  => 'Follow-up',
            self::STATUS_QUOTE_SENT => 'Quote Sent',
            self::STATUS_WON        => 'Won',
            self::STATUS_LOST       => 'Lost',
        ];
    }

    public function isConverted(): bool
    {
        return $this->converted_at !== null;
    }

    // Relationships
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function convertedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'converted_by');
    }

    public function client(): HasOne
    {
        return $this->hasOne(Client::class);
    }

    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'subject')->latest();
    }
}
