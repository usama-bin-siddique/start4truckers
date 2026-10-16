<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::table('clients', fn (Blueprint $t) => $t->json('additional_emails')->nullable()->after('business_email')); }
    public function down(): void { Schema::table('clients', fn (Blueprint $t) => $t->dropColumn('additional_emails')); }
};
