<?php

namespace App\Models;

use App\Support\ClientProfile;
use Illuminate\Database\Eloquent\Builder;
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
        'name',
        'phone',
        'email',
        'state',
        'address',
        'ssn',
        'date_of_birth',
        'citizenship_status',
        'dl_number',
        'dl_state',
        'dl_expiration',
        'preferred_contact_method',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relation',
        'company',
        'business_phone',
        'business_email',
        'company_address',
        'entity_type',
        'state_of_formation',
        'llc_formed_at',
        'registered_agent',
        'mailing_address',
        'ein',
        'usdot_number',
        'usdot_status',
        'mc_number',
        'mc_status',
        'fmcsa_authority_type',
        'ff_number',
        'ucr_number',
        'ucr_status',
        'boc3_status',
        'insurance_status',
        'insurance_company',
        'insurance_policy_number',
        'insurance_expires_at',
        'operating_authority_status',
        'mcs150_status',
        'mcs150_due_at',
        'ucr_due_at',
        'ifta_status',
        'ifta_due_at',
        'irp_status',
        'irp_due_at',
        'form_2290_status',
        'form_2290_due_at',
        'annual_updates_status',
        'compliance_package',
        'next_compliance_due_at',
        'last_compliance_completed_at',
        'overall_compliance_status',
        'next_action',
        'next_action_due_at',
        'login_gov_email',
        'login_gov_password',
        'assigned_to',
        'status',
        'compliance_type',
        'monthly_compliance_started_at',
        'compliance_reminder_sent_for',
        'notes',
        'client_notes',
    ];

    const STATUS_LEAD              = 'lead';
    const STATUS_ONBOARDING        = 'onboarding';
    const STATUS_DOCUMENTS_PENDING = 'documents_pending';
    const STATUS_PAYMENT_PENDING   = 'payment_pending';
    const STATUS_IN_PROGRESS       = 'in_progress';
    const STATUS_GOVERNMENT_REVIEW = 'government_review';
    const STATUS_COMPLETED         = 'completed';
    const STATUS_COMPLIANCE        = 'compliance';
    const STATUS_INACTIVE          = 'inactive';
    const STATUS_ACTIVE            = 'in_progress';

    const COMPLIANCE_PROJECT = 'project';
    const COMPLIANCE_MONTHLY = 'monthly';

    // Auto-generate client number on creation
    protected static function booted(): void
    {
        static::creating(function (Client $client) {
            if (empty($client->client_number)) {
                $client->client_number = self::generateClientNumber();
            }
            $client->status = ClientProfile::normalizeStatus($client->status, self::STATUS_ONBOARDING);
        });

        static::saving(function (Client $client) {
            if ($client->status === 'active') {
                $client->status = self::STATUS_IN_PROGRESS;
            }
        });

        static::created(function (Client $client) {
            if ($client->lead_id) {
                Lead::whereKey($client->lead_id)
                    ->whereNull('client_id')
                    ->update(['client_id' => $client->id]);
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

    protected function casts(): array
    {
        return [
            'ssn'                          => 'encrypted',
            'login_gov_password'           => 'encrypted',
            'date_of_birth'                => 'date',
            'dl_expiration'                => 'date',
            'llc_formed_at'                => 'date',
            'insurance_expires_at'         => 'date',
            'mcs150_due_at'                => 'date',
            'ucr_due_at'                   => 'date',
            'ifta_due_at'                  => 'date',
            'irp_due_at'                   => 'date',
            'form_2290_due_at'             => 'date',
            'next_compliance_due_at'       => 'date',
            'last_compliance_completed_at' => 'date',
            'monthly_compliance_started_at' => 'date',
            'compliance_reminder_sent_for' => 'date',
            'next_action_due_at'           => 'date',
        ];
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

    public function getDisplayNameAttribute(): string
    {
        return $this->name ?: $this->lead?->name ?: 'Unknown client';
    }

    // Relationships
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class)->latest();
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(ClientVehicle::class)->latest();
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(ClientReminder::class)->orderBy('remind_at');
    }

    public function customFields(): HasMany
    {
        return $this->hasMany(ClientCustomField::class)->orderBy('sort_order')->orderBy('id');
    }

    public function getStatusLabelAttribute(): string
    {
        return ClientProfile::statusLabel($this->status);
    }

    public function getSsnMaskedAttribute(): ?string
    {
        $ssn = preg_replace('/\D/', '', (string) $this->ssn);
        if ($ssn === '') {
            return null;
        }
        if (strlen($ssn) < 4) {
            return '***';
        }

        return '***-**-'.substr($ssn, -4);
    }

    public function getOverallServiceStatusAttribute(): string
    {
        $services = $this->relationLoaded('clientServices')
            ? $this->clientServices
            : $this->clientServices()->get();

        if ($services->isEmpty()) {
            return 'Not started';
        }
        if ($services->every(fn ($s) => $s->status === ClientService::STATUS_COMPLETED)) {
            return 'Completed';
        }
        if ($services->contains(fn ($s) => $s->status === ClientService::STATUS_IN_PROGRESS)) {
            return 'In progress';
        }

        return 'Pending';
    }

    public function getCurrentPackageAttribute(): string
    {
        $type = ClientProfile::complianceLabel($this->compliance_type, null);

        $names = ($this->relationLoaded('clientServices') ? $this->clientServices : $this->clientServices()->with('service')->get())
            ->map(fn ($s) => $s->service?->name)
            ->filter()
            ->unique()
            ->values();

        $package = $names->implode(', ');

        return collect([$type, $package ?: null])->filter()->implode(' · ') ?: '—';
    }

    public function getComputedNextDueDateAttribute(): ?string
    {
        $dates = collect([
            $this->next_action_due_at,
            $this->next_compliance_due_at,
            $this->insurance_expires_at,
            $this->dl_expiration,
            $this->mcs150_due_at,
            $this->ucr_due_at,
            $this->ifta_due_at,
            $this->irp_due_at,
            $this->form_2290_due_at,
        ])->filter()->sort()->values();

        return $dates->first()?->toDateString();
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->latest();
    }

    public function clientServices(): HasMany
    {
        return $this->hasMany(ClientService::class);
    }

    /**
     * Attach catalog services named on the originating lead.
     *
     * @return \Illuminate\Support\Collection<int, ClientService>
     */
    public function syncServicesFromLead(?Lead $fromLead = null)
    {
        $source = $fromLead ?? $this->lead;
        $this->loadMissing('lead');
        $created = collect();

        foreach (Service::matchingRequirement($source?->service_required) as $service) {
            $row = $this->clientServices()->firstOrCreate(
                ['service_id' => $service->id],
                ['status' => ClientService::STATUS_PENDING]
            );

            if ($row->wasRecentlyCreated) {
                $created->push($row->load('service'));
            }
        }

        return $created;
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
