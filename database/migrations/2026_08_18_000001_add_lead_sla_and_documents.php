<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->timestamp('reviewed_at')->nullable()->after('converted_at');
            $table->timestamp('sla_started_at')->nullable()->after('reviewed_at');
            $table->timestamp('sla_expires_at')->nullable()->after('sla_started_at');
            $table->timestamp('sla_completed_at')->nullable()->after('sla_expires_at');
            $table->timestamp('sla_breached_at')->nullable()->after('sla_completed_at');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->unsignedBigInteger('client_id')->nullable()->change();
            $table->foreign('client_id')->references('id')->on('clients')->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->after('client_id')->constrained('leads')->nullOnDelete();
            $table->index('lead_id');
        });

        Schema::create('lead_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_invoices');

        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['lead_id']);
            $table->dropColumn('lead_id');
            $table->dropForeign(['client_id']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->unsignedBigInteger('client_id')->nullable(false)->change();
            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn([
                'reviewed_at',
                'sla_started_at',
                'sla_expires_at',
                'sla_completed_at',
                'sla_breached_at',
            ]);
        });
    }
};
