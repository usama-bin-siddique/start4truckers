<?php

namespace App\Support;

class ClientProfile
{
    public const STATUSES = [
        'lead'               => 'Lead',
        'onboarding'         => 'Onboarding',
        'documents_pending'  => 'Documents Pending',
        'payment_pending'    => 'Payment Pending',
        'in_progress'        => 'In Progress',
        'government_review'  => 'Government Review',
        'completed'          => 'Completed',
        'compliance'         => 'Compliance',
        'inactive'           => 'Inactive',
    ];

    public const COMPLIANCE_TYPES = [
        'project' => 'One-Time',
        'monthly' => 'Monthly',
    ];

    public const OPEN_STATUSES = [
        'lead',
        'onboarding',
        'documents_pending',
        'payment_pending',
        'in_progress',
        'government_review',
        'compliance',
    ];

    public const CONTACT_METHODS = [
        'email' => 'Email',
        'phone' => 'Phone',
        'sms'   => 'SMS',
        'whatsapp' => 'WhatsApp',
    ];

    public const CITIZENSHIP_STATUSES = [
        'us_citizen'          => 'US Citizen',
        'permanent_resident'  => 'Permanent Resident',
        'work_authorization'  => 'Work Authorization',
        'other'               => 'Other',
    ];

    public const ENTITY_TYPES = [
        'llc'              => 'LLC',
        'corporation'      => 'Corporation',
        'sole_proprietor'  => 'Sole Proprietor',
        'partnership'      => 'Partnership',
        'other'            => 'Other',
    ];

    public const AUTHORITY_STATUSES = [
        'not_started' => 'Not started',
        'pending'     => 'Pending',
        'active'      => 'Active',
        'inactive'    => 'Inactive',
        'suspended'   => 'Suspended',
        'expired'     => 'Expired',
    ];

    public const FMCSA_AUTHORITY_TYPES = [
        'ff' => 'FF Number',
        'mc' => 'MC Number',
        'mx' => 'MX Number',
    ];

    public const TRUCK_TYPES = [
        'semi'     => 'Semi',
        'box'      => 'Box Truck',
        'dump'     => 'Dump',
        'flatbed'  => 'Flatbed',
        'reefer'   => 'Reefer',
        'other'    => 'Other',
    ];

    public const ELD_STATUSES = [
        'installed'    => 'Installed',
        'pending'      => 'Pending',
        'not_required' => 'Not required',
        'issue'        => 'Issue',
    ];

    public const US_STATES = [
        'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
        'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
        'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
        'VA','WA','WV','WI','WY','DC',
    ];

    public static function statusKeys(): array
    {
        return array_merge(array_keys(self::STATUSES), ['active']);
    }

    public static function normalizeStatus(?string $status, string $default = 'onboarding'): string
    {
        if ($status === 'active' || $status === null || $status === '') {
            return $status === 'active' ? 'in_progress' : $default;
        }

        return $status;
    }

    public static function statusLabel(string $status): string
    {
        if ($status === 'active') {
            return 'In Progress';
        }

        return self::STATUSES[$status] ?? ucfirst(str_replace('_', ' ', $status));
    }

    public static function complianceLabel(?string $type, ?string $default = 'Not set'): ?string
    {
        if (! $type) {
            return $default;
        }

        return self::COMPLIANCE_TYPES[$type] ?? $default;
    }

    public static function options(): array
    {
        return [
            'statuses'             => self::STATUSES,
            'compliance_types'    => self::COMPLIANCE_TYPES,
            'contact_methods'      => self::CONTACT_METHODS,
            'citizenship_statuses' => self::CITIZENSHIP_STATUSES,
            'entity_types'         => self::ENTITY_TYPES,
            'authority_statuses'     => self::AUTHORITY_STATUSES,
            'fmcsa_authority_types'  => self::FMCSA_AUTHORITY_TYPES,
            'truck_types'          => self::TRUCK_TYPES,
            'eld_statuses'         => self::ELD_STATUSES,
            'us_states'            => self::US_STATES,
        ];
    }

    public static function rules(bool $creating = false): array
    {
        return [
            'name' => $creating
                ? ['required', 'string', 'max:255']
                : ['sometimes', 'required', 'string', 'max:255'],
            'phone'                        => ['nullable', 'string', 'max:30'],
            'email'                        => ['nullable', 'email', 'max:255'],
            'state'                        => ['nullable', 'string', 'max:10'],
            'address'                      => ['nullable', 'string'],
            'ssn'                          => ['nullable', 'string', 'max:20'],
            'date_of_birth'                => ['nullable', 'date'],
            'citizenship_status'           => ['nullable', 'string', 'max:50'],
            'dl_number'                    => ['nullable', 'string', 'max:50'],
            'dl_state'                     => ['nullable', 'string', 'max:10'],
            'dl_expiration'                => ['nullable', 'date'],
            'preferred_contact_method'     => ['nullable', 'string', 'max:50'],
            'emergency_contact_name'       => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone'      => ['nullable', 'string', 'max:30'],
            'emergency_contact_relation'   => ['nullable', 'string', 'max:100'],
            'company'                      => ['nullable', 'string', 'max:255'],
            'business_phone'               => ['nullable', 'string', 'max:30'],
            'business_email'               => ['nullable', 'email', 'max:255'],
            'company_address'              => ['nullable', 'string'],
            'entity_type'                  => ['nullable', 'string', 'max:50'],
            'state_of_formation'           => ['nullable', 'string', 'max:10'],
            'llc_formed_at'                => ['nullable', 'date'],
            'registered_agent'             => ['nullable', 'string', 'max:255'],
            'mailing_address'              => ['nullable', 'string'],
            'ein'                          => ['nullable', 'string', 'max:20'],
            'usdot_number'                 => ['nullable', 'string', 'max:30'],
            'usdot_status'                 => ['nullable', 'string', 'max:50'],
            'mc_number'                    => ['nullable', 'string', 'max:30'],
            'mc_status'                    => ['nullable', 'string', 'max:50'],
            'fmcsa_authority_type'         => ['nullable', 'in:'.implode(',', array_keys(self::FMCSA_AUTHORITY_TYPES))],
            'ff_number'                    => ['nullable', 'string', 'max:30'],
            'ucr_number'                   => ['nullable', 'string', 'max:30'],
            'ucr_status'                   => ['nullable', 'string', 'max:50'],
            'boc3_status'                  => ['nullable', 'string', 'max:50'],
            'insurance_status'             => ['nullable', 'string', 'max:50'],
            'insurance_company'            => ['nullable', 'string', 'max:255'],
            'insurance_policy_number'      => ['nullable', 'string', 'max:100'],
            'insurance_expires_at'         => ['nullable', 'date'],
            'operating_authority_status'   => ['nullable', 'string', 'max:50'],
            'mcs150_status'                => ['nullable', 'string', 'max:50'],
            'mcs150_due_at'                => ['nullable', 'date'],
            'ucr_due_at'                   => ['nullable', 'date'],
            'ifta_status'                  => ['nullable', 'string', 'max:50'],
            'ifta_due_at'                  => ['nullable', 'date'],
            'irp_status'                   => ['nullable', 'string', 'max:50'],
            'irp_due_at'                   => ['nullable', 'date'],
            'form_2290_status'             => ['nullable', 'string', 'max:50'],
            'form_2290_due_at'             => ['nullable', 'date'],
            'annual_updates_status'        => ['nullable', 'string', 'max:50'],
            'compliance_package'           => ['nullable', 'string', 'max:100'],
            'next_compliance_due_at'       => ['nullable', 'date'],
            'last_compliance_completed_at' => ['nullable', 'date'],
            'overall_compliance_status'    => ['nullable', 'string', 'max:50'],
            'next_action'                  => ['nullable', 'string', 'max:255'],
            'next_action_due_at'           => ['nullable', 'date'],
            'login_gov_email'              => ['nullable', 'email', 'max:255'],
            'login_gov_password'           => ['nullable', 'string', 'max:255'],
            'notes'                        => ['nullable', 'string'],
            'client_notes'                 => ['nullable', 'string'],
            'assigned_to'                  => ['nullable', 'exists:users,id'],
            'compliance_type'              => ['nullable', 'in:project,monthly'],
            'status'                       => $creating
                ? ['nullable', 'in:'.implode(',', self::statusKeys())]
                : ['sometimes', 'nullable', 'in:'.implode(',', self::statusKeys())],
        ];
    }

    public static function vehicleRules(): array
    {
        return [
            'truck_type'        => ['nullable', 'string', 'max:50'],
            'vin'               => ['nullable', 'string', 'max:30'],
            'year'              => ['nullable', 'integer', 'min:1980', 'max:2100'],
            'make'              => ['nullable', 'string', 'max:100'],
            'model'             => ['nullable', 'string', 'max:100'],
            'gvwr'              => ['nullable', 'string', 'max:50'],
            'license_plate'     => ['nullable', 'string', 'max:20'],
            'plate_state'       => ['nullable', 'string', 'max:10'],
            'title_number'      => ['nullable', 'string', 'max:50'],
            'purchase_date'     => ['nullable', 'date'],
            'form_2290_status'  => ['nullable', 'string', 'max:50'],
            'eld_provider'      => ['nullable', 'string', 'max:100'],
            'eld_status'        => ['nullable', 'string', 'max:50'],
            'notes'             => ['nullable', 'string'],
        ];
    }
}
