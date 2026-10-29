<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->json('meta')->nullable()->after('notes');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->json('meta')->nullable()->after('client_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('meta');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('meta');
        });
    }
};
