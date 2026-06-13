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
        Schema::create('keyword_merge_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_keyword_id')->constrained('keywords')->onDelete('cascade');
            $table->foreignId('target_keyword_id')->constrained('keywords')->onDelete('cascade');
            $table->string('entity_type'); // 'paper' or 'user'
            $table->unsignedBigInteger('entity_id');
            $table->string('action'); // 'updated' or 'deleted'
            $table->timestamps();

            // Indexes for fast restoring
            $table->index(['source_keyword_id', 'target_keyword_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('keyword_merge_logs');
    }
};
