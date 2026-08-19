<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'client_id',
        'invoice_amount',
        'amount_received',
        'payment_method',
        'transaction_reference',
        'receipt_path',
        'notes',
        'paid_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'invoice_amount'  => 'decimal:2',
            'amount_received' => 'decimal:2',
            'paid_at'         => 'datetime',
        ];
    }

    // Computed balance for this specific payment record
    public function getBalanceDueAttribute(): float
    {
        return (float) $this->invoice_amount - (float) $this->amount_received;
    }

    public function isVisibleTo(User $user): bool
    {
        if (! $user->isSalesRep()) {
            return true;
        }

        $this->loadMissing('client');

        return $this->client?->isAssignedTo($user) ?? false;
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isSalesRep()) {
            $query->whereHas('client', fn (Builder $q) => $q->where('assigned_to', $user->id));
        }

        return $query;
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
