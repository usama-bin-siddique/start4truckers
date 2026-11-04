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
        'refunded_at',
        'refund_amount',
        'refunded_by',
        'refund_reason',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'invoice_amount'  => 'decimal:2',
            'amount_received' => 'decimal:2',
            'paid_at'         => 'datetime',
            'refunded_at'     => 'datetime',
            'refund_amount'   => 'decimal:2',
        ];
    }

    // Computed balance for this specific payment record
    public function getBalanceDueAttribute(): float
    {
        return (float) $this->invoice_amount - (float) $this->amount_received;
    }

    public function getInvoiceNumberAttribute(): string
    {
        return 'INV-'.str_pad((string) $this->id, 5, '0', STR_PAD_LEFT);
    }

    public function getPaymentStatusAttribute(): string
    {
        if ($this->refunded_at) {
            return 'refunded';
        }

        $received = (float) $this->amount_received;
        $invoice = (float) $this->invoice_amount;

        if ($received <= 0) {
            return 'unpaid';
        }

        if ($received < $invoice) {
            return 'partial';
        }

        return 'paid';
    }

    public function isVisibleTo(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager'], true);
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if (! in_array($user->role, ['admin', 'manager'], true)) {
            $query->whereRaw('0 = 1');
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

    public function refundedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'refunded_by');
    }
}
