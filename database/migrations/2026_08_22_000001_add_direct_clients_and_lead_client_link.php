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
            $table->string('name')->nullable()->after('client_number');
            $table->string('phone')->nullable()->after('name');
            $table->string('email')->nullable()->after('phone');
            $table->string('state')->nullable()->after('email');
            $table->string('company')->nullable()->after('state');
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('client_id')->nullable()->after('assigned_to')->constrained('clients')->nullOnDelete();
        });

        $clients = DB::table('clients')->whereNotNull('lead_id')->get();
        foreach ($clients as $client) {
            $lead = DB::table('leads')->where('id', $client->lead_id)->first();
            if (! $lead) {
                continue;
            }

            DB::table('clients')->where('id', $client->id)->update([
                'name'    => $client->name ?: $lead->name,
                'phone'   => $client->phone ?: $lead->phone,
                'email'   => $client->email ?: $lead->email,
                'state'   => $client->state ?: $lead->state,
                'company' => $client->company ?: $lead->company,
            ]);

            if (empty($lead->client_id)) {
                DB::table('leads')->where('id', $lead->id)->update(['client_id' => $client->id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('client_id');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['name', 'phone', 'email', 'state', 'company']);
        });
    }
};
