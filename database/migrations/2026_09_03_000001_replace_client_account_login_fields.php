<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->text('login_gov_password')->nullable()->after('login_gov_email');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn([
                'motus_account_email',
                'fmcsa_account_email',
                'portal_username',
                'account_status',
                'account_last_verified_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->string('motus_account_email')->nullable()->after('login_gov_email');
            $table->string('fmcsa_account_email')->nullable()->after('motus_account_email');
            $table->string('portal_username')->nullable()->after('fmcsa_account_email');
            $table->string('account_status')->nullable()->after('portal_username');
            $table->date('account_last_verified_at')->nullable()->after('account_status');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('login_gov_password');
        });
    }
};
