<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('request_logs', function (Blueprint $table) {
            $table->id();
            $table->string('action')->default('request'); // request, login, logout, failed_login
            $table->string('method')->nullable();
            $table->text('url')->nullable();
            $table->string('ip')->nullable();
            $table->text('user_agent')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->longText('request_payload')->nullable();
            $table->longText('response_payload')->nullable();
            $table->integer('status_code')->nullable();
            $table->decimal('duration', 8, 4)->nullable();
            $table->integer('total_queries')->nullable();
            $table->longText('db_queries')->nullable();
            $table->timestamps();

            $table->index('action');
            $table->index('method');
            $table->index('status_code');
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_logs');
    }
};
