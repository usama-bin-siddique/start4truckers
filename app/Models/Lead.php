<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'date_of_birth',
        'state',
        'address',
        'ssn_itin',
        'company',
        'business_name_1',
        'business_name_2',
        'business_name_3',
        'state_of_formation',
        'business_purpose',
        'truck_type',
        'truck_vin',
        'operation_area',
        'operation_type',
        'hear_about_us',
        'reference_id',
        'service_required',
        'notes',
        'meta',
        'source',
        'status',
        'assigned_to',
        'client_id',
        'converted_by',
        'converted_at',
        'reviewed_at',
        'sla_started_at',
        'sla_expires_at',
        'sla_completed_at',
        'sla_breached_at',
    ];

    protected function casts(): array
    {
        return [
            'converted_at'     => 'datetime',
            'date_of_birth'    => 'date',
            'ssn_itin'         => 'encrypted',
            'meta'             => 'array',
            'reviewed_at'      => 'datetime',
            'sla_started_at'   => 'datetime',
            'sla_expires_at'   => 'datetime',
            'sla_completed_at' => 'datetime',
            'sla_breached_at'  => 'datetime',
        ];
    }

    // Status constants
    const STATUS_NEW        = 'new';
    const STATUS_REVIEWED   = 'reviewed';
    const STATUS_CONTACTED  = 'contacted';
    const STATUS_FOLLOW_UP  = 'follow-up';
    const STATUS_QUOTE_SENT = 'quote_sent';
    const STATUS_WON        = 'won';
    const STATUS_LOST       = 'lost';

    public static function statuses(): array
    {
        return [
            self::STATUS_NEW        => 'New',
            self::STATUS_REVIEWED   => 'Lead Reviewed',
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

    public function isStatusLocked(): bool
    {
        return in_array($this->status, [self::STATUS_WON, self::STATUS_LOST], true);
    }

    public function isAssignedTo(User $user): bool
    {
        return (int) $this->assigned_to === (int) $user->id;
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isSalesRep()) {
            $query->where('assigned_to', $user->id);
        }

        return $query;
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

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class)->latest();
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(LeadInvoice::class)->latest();
    }

    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'subject')->latest();
    }
}
