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
        DB::statement("ALTER TABLE research_papers ADD COLUMN searchable tsvector GENERATED ALWAYS AS (
            setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(abstract, '')), 'B')
        ) STORED");

        DB::statement("CREATE INDEX research_papers_searchable_gin ON research_papers USING GIN(searchable)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP INDEX IF EXISTS research_papers_searchable_gin");
        DB::statement("ALTER TABLE research_papers DROP COLUMN IF EXISTS searchable");
    }
};
