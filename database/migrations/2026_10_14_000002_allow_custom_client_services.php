<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::table('client_services', fn (Blueprint $t) => $t->string('custom_service_name')->nullable()->after('service_id'));

        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE client_services MODIFY service_id BIGINT UNSIGNED NULL');
        }
    }
    public function down(): void { DB::table('client_services')->whereNull('service_id')->delete(); DB::statement('ALTER TABLE client_services MODIFY service_id BIGINT UNSIGNED NOT NULL'); Schema::table('client_services', fn (Blueprint $t) => $t->dropColumn('custom_service_name')); }
};
