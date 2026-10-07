<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable()->after('email');
            $table->text('address')->nullable()->after('state');
            $table->string('ssn_itin')->nullable()->after('address');
            $table->string('business_name_1')->nullable()->after('company');
            $table->string('business_name_2')->nullable()->after('business_name_1');
            $table->string('business_name_3')->nullable()->after('business_name_2');
            $table->string('state_of_formation')->nullable()->after('business_name_3');
            $table->text('business_purpose')->nullable()->after('state_of_formation');
            $table->string('truck_type')->nullable()->after('business_purpose');
            $table->string('truck_vin')->nullable()->after('truck_type');
            $table->string('operation_area')->nullable()->after('truck_vin');
            $table->string('operation_type')->nullable()->after('operation_area');
            $table->string('hear_about_us')->nullable()->after('operation_type');
            $table->string('reference_id')->nullable()->after('hear_about_us');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn([
                'date_of_birth', 'address', 'ssn_itin', 'business_name_1',
                'business_name_2', 'business_name_3', 'state_of_formation',
                'business_purpose', 'truck_type', 'truck_vin', 'operation_area',
                'operation_type', 'hear_about_us', 'reference_id',
            ]);
        });
    }
};
