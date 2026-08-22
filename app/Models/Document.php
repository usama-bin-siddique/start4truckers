<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'client_id',
        'lead_id',
        'category',
        'original_filename',
        'stored_path',
        'mime_type',
        'file_size',
        'expires_at',
        'status',
        'uploaded_by',
    ];

    // Category constants
    const CATEGORIES = [
        'driver_license'       => 'Driver License',
        'passport'             => 'Passport',
        'ein_letter'           => 'SS-4 / EIN Letter',
        'llc_articles'         => 'Articles of Organization',
        'operating_agreement'  => 'Operating Agreement',
        'utility_bill'         => 'Utility Bill',
        'w9'                   => 'W-9',
        'insurance'            => 'Insurance Certificate',
        'boc3'                 => 'BOC-3 Confirmation',
        'dot_confirmation'     => 'DOT Confirmation',
        'mc_confirmation'      => 'MC Confirmation',
        'vehicle_title'        => 'Vehicle Title',
        'truck_registration'   => 'Registration',
        'form_2290'            => 'Form 2290',
        'ifta'                 => 'IFTA Documents',
        'irp'                  => 'IRP Documents',
        'other'                => 'Other Documents',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'date',
        ];
    }

    public function isVisibleTo(User $user): bool
    {
        if (! $user->isSalesRep()) {
            return true;
        }

        $this->loadMissing(['lead', 'client']);

        return ($this->lead && $this->lead->isAssignedTo($user))
            || ($this->client && $this->client->isAssignedTo($user));
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if (! $user->isSalesRep()) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($user) {
            $q->whereHas('lead', fn (Builder $lead) => $lead->where('assigned_to', $user->id))
                ->orWhereHas('client', fn (Builder $client) => $client->where('assigned_to', $user->id));
        });
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getCategoryLabelAttribute(): string
    {
        return self::CATEGORIES[$this->category] ?? $this->category;
    }

    public function getFileSizeFormattedAttribute(): string
    {
        if (!$this->file_size) return '—';
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        $size = $this->file_size;
        while ($size >= 1024 && $i < count($units) - 1) {
            $size /= 1024;
            $i++;
        }
        return round($size, 1) . ' ' . $units[$i];
    }
}
