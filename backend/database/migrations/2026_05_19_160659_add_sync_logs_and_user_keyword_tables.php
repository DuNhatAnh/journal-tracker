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
        Schema::create('sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('api_source_id')->nullable()->constrained('api_sources')->nullOnDelete();
            $table->string('status')->default('running'); // running, success, failed
            $table->integer('papers_synced')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamps();
        });

        Schema::create('user_keyword', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('keyword_id')->constrained('keywords')->cascadeOnDelete();
            $table->primary(['user_id', 'keyword_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_keyword');
        Schema::dropIfExists('sync_logs');
    }
};
