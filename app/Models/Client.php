<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'client_number',
        'lead_id',
        'assigned_to',
        'status',
        'notes',
    ];

    // Status constants
    const STATUS_ACTIVE    = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_INACTIVE  = 'inactive';

    // Auto-generate client number on creation
    protected static function booted(): void
    {
        static::creating(function (Client $client) {
            if (empty($client->client_number)) {
                $client->client_number = self::generateClientNumber();
            }
        });
    }

    public static function generateClientNumber(): string
    {
        $year     = now()->year;
        $lastId   = self::withTrashed()->whereYear('created_at', $year)->count();
        $sequence = str_pad($lastId + 1, 5, '0', STR_PAD_LEFT);
        return "S4T-{$year}-{$sequence}";
    }

    // Relationships
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->latest();
    }

    public function clientServices(): HasMany
    {
        return $this->hasMany(ClientService::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class)->latest();
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class)->latest();
    }

    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'subject')->latest();
    }

    // Computed: total invoice amount across all payments
    public function getTotalInvoicedAttribute(): float
    {
        return (float) $this->payments()->sum('invoice_amount');
    }

    // Computed: total received across all payments
    public function getTotalReceivedAttribute(): float
    {
        return (float) $this->payments()->sum('amount_received');
    }

    // Computed: balance due
    public function getBalanceDueAttribute(): float
    {
        return $this->total_invoiced - $this->total_received;
    }
}
