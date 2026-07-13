<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('paper_chunks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paper_id')->constrained('research_papers')->cascadeOnDelete();
            $table->text('content');
            $table->timestamps();
        });

        // Add vector column using raw SQL since pgvector package is not installed
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE paper_chunks ADD COLUMN embedding vector(768)');
        } else {
            // Fallback for SQLite testing
            Schema::table('paper_chunks', function (Blueprint $table) {
                $table->text('embedding')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paper_chunks');
    }
};
