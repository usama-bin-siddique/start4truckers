<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->date('monthly_compliance_started_at')->nullable()->after('compliance_type');
            $table->date('compliance_reminder_sent_for')->nullable()->after('last_compliance_completed_at');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->string('kind')->nullable()->after('status');
            $table->index('kind');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['monthly_compliance_started_at', 'compliance_reminder_sent_for']);
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['kind']);
            $table->dropColumn('kind');
        });
    }
};
