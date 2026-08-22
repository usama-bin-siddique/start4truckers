<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->text('address')->nullable()->after('state');
            $table->text('ssn')->nullable()->after('address');
            $table->date('date_of_birth')->nullable()->after('ssn');
            $table->string('citizenship_status')->nullable()->after('date_of_birth');
            $table->string('dl_number')->nullable()->after('citizenship_status');
            $table->string('dl_state', 10)->nullable()->after('dl_number');
            $table->date('dl_expiration')->nullable()->after('dl_state');
            $table->string('preferred_contact_method')->nullable()->after('dl_expiration');
            $table->string('emergency_contact_name')->nullable()->after('preferred_contact_method');
            $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
            $table->string('emergency_contact_relation')->nullable()->after('emergency_contact_phone');

            $table->string('business_phone')->nullable()->after('company');
            $table->string('business_email')->nullable()->after('business_phone');
            $table->text('company_address')->nullable()->after('business_email');
            $table->string('entity_type')->nullable()->after('company_address');
            $table->string('state_of_formation', 10)->nullable()->after('entity_type');
            $table->date('llc_formed_at')->nullable()->after('state_of_formation');
            $table->string('registered_agent')->nullable()->after('llc_formed_at');
            $table->text('mailing_address')->nullable()->after('registered_agent');
            $table->string('ein')->nullable()->after('mailing_address');
            $table->string('usdot_number')->nullable()->after('ein');
            $table->string('usdot_status')->nullable()->after('usdot_number');
            $table->string('mc_number')->nullable()->after('usdot_status');
            $table->string('mc_status')->nullable()->after('mc_number');
            $table->string('fmcsa_authority_type')->nullable()->after('mc_status');
            $table->string('ff_number')->nullable()->after('fmcsa_authority_type');
            $table->string('ucr_number')->nullable()->after('ff_number');
            $table->string('ucr_status')->nullable()->after('ucr_number');
            $table->string('boc3_status')->nullable()->after('ucr_status');
            $table->string('insurance_status')->nullable()->after('boc3_status');
            $table->string('insurance_company')->nullable()->after('insurance_status');
            $table->string('insurance_policy_number')->nullable()->after('insurance_company');
            $table->date('insurance_expires_at')->nullable()->after('insurance_policy_number');
            $table->string('operating_authority_status')->nullable()->after('insurance_expires_at');

            $table->string('mcs150_status')->nullable()->after('operating_authority_status');
            $table->date('mcs150_due_at')->nullable()->after('mcs150_status');
            $table->date('ucr_due_at')->nullable()->after('mcs150_due_at');
            $table->string('ifta_status')->nullable()->after('ucr_due_at');
            $table->date('ifta_due_at')->nullable()->after('ifta_status');
            $table->string('irp_status')->nullable()->after('ifta_due_at');
            $table->date('irp_due_at')->nullable()->after('irp_status');
            $table->string('form_2290_status')->nullable()->after('irp_due_at');
            $table->date('form_2290_due_at')->nullable()->after('form_2290_status');
            $table->string('annual_updates_status')->nullable()->after('form_2290_due_at');
            $table->string('compliance_package')->nullable()->after('annual_updates_status');
            $table->date('next_compliance_due_at')->nullable()->after('compliance_package');
            $table->date('last_compliance_completed_at')->nullable()->after('next_compliance_due_at');
            $table->string('overall_compliance_status')->nullable()->after('last_compliance_completed_at');
            $table->string('next_action')->nullable()->after('overall_compliance_status');
            $table->date('next_action_due_at')->nullable()->after('next_action');

            $table->string('login_gov_email')->nullable()->after('next_action_due_at');
            $table->string('motus_account_email')->nullable()->after('login_gov_email');
            $table->string('fmcsa_account_email')->nullable()->after('motus_account_email');
            $table->string('portal_username')->nullable()->after('fmcsa_account_email');
            $table->string('account_status')->nullable()->after('portal_username');
            $table->date('account_last_verified_at')->nullable()->after('account_status');
            $table->text('client_notes')->nullable()->after('notes');
        });

        DB::table('clients')->where('status', 'active')->update(['status' => 'in_progress']);

        Schema::create('client_vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->string('truck_type')->nullable();
            $table->string('vin')->nullable();
            $table->unsignedSmallInteger('year')->nullable();
            $table->string('make')->nullable();
            $table->string('model')->nullable();
            $table->string('gvwr')->nullable();
            $table->string('license_plate')->nullable();
            $table->string('plate_state', 10)->nullable();
            $table->string('title_number')->nullable();
            $table->date('purchase_date')->nullable();
            $table->string('form_2290_status')->nullable();
            $table->string('eld_provider')->nullable();
            $table->string('eld_status')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::table('client_services', function (Blueprint $table) {
            $table->string('package')->nullable()->after('service_id');
            $table->date('purchase_date')->nullable()->after('package');
            $table->decimal('service_price', 10, 2)->nullable()->after('purchase_date');
            $table->decimal('government_fee', 10, 2)->nullable()->after('service_price');
            $table->string('payment_status')->nullable()->after('government_fee');
            $table->date('start_date')->nullable()->after('assigned_to');
            $table->date('renewal_date')->nullable()->after('completion_date');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->date('expires_at')->nullable()->after('file_size');
            $table->string('status')->nullable()->after('expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['expires_at', 'status']);
        });

        Schema::table('client_services', function (Blueprint $table) {
            $table->dropColumn([
                'package', 'purchase_date', 'service_price', 'government_fee',
                'payment_status', 'start_date', 'renewal_date',
            ]);
        });

        Schema::dropIfExists('client_vehicles');

        DB::table('clients')->where('status', 'in_progress')->update(['status' => 'active']);

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn([
                'address', 'ssn', 'date_of_birth', 'citizenship_status',
                'dl_number', 'dl_state', 'dl_expiration', 'preferred_contact_method',
                'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
                'business_phone', 'business_email', 'company_address', 'entity_type',
                'state_of_formation', 'llc_formed_at', 'registered_agent', 'mailing_address',
                'ein', 'usdot_number', 'usdot_status', 'mc_number', 'mc_status',
                'fmcsa_authority_type', 'ff_number', 'ucr_number', 'ucr_status', 'boc3_status',
                'insurance_status', 'insurance_company', 'insurance_policy_number',
                'insurance_expires_at', 'operating_authority_status',
                'mcs150_status', 'mcs150_due_at', 'ucr_due_at', 'ifta_status', 'ifta_due_at',
                'irp_status', 'irp_due_at', 'form_2290_status', 'form_2290_due_at',
                'annual_updates_status', 'compliance_package', 'next_compliance_due_at',
                'last_compliance_completed_at', 'overall_compliance_status',
                'next_action', 'next_action_due_at',
                'login_gov_email', 'motus_account_email', 'fmcsa_account_email',
                'portal_username', 'account_status', 'account_last_verified_at', 'client_notes',
            ]);
        });
    }
};
