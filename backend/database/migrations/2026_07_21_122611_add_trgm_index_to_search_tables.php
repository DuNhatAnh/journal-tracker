<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Kích hoạt extension pg_trgm (nếu chưa có)
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

        // Đánh index GIN trigram cho bảng keywords (cột name)
        DB::statement('CREATE INDEX IF NOT EXISTS keywords_name_trgm_idx ON keywords USING GIN (name gin_trgm_ops);');

        // Đánh index GIN trigram cho bảng authors (cột name)
        DB::statement('CREATE INDEX IF NOT EXISTS authors_name_trgm_idx ON authors USING GIN (name gin_trgm_ops);');

        // Đánh index GIN trigram cho bảng journals (cột name)
        DB::statement('CREATE INDEX IF NOT EXISTS journals_name_trgm_idx ON journals USING GIN (name gin_trgm_ops);');

        // Đánh index GIN trigram cho bảng research_papers (cột title và abstract)
        DB::statement('CREATE INDEX IF NOT EXISTS research_papers_title_trgm_idx ON research_papers USING GIN (title gin_trgm_ops);');
        // abstract can be huge, but if it is searched via ILIKE it's needed
        DB::statement('CREATE INDEX IF NOT EXISTS research_papers_abstract_trgm_idx ON research_papers USING GIN (abstract gin_trgm_ops);');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS keywords_name_trgm_idx;');
        DB::statement('DROP INDEX IF EXISTS authors_name_trgm_idx;');
        DB::statement('DROP INDEX IF EXISTS journals_name_trgm_idx;');
        DB::statement('DROP INDEX IF EXISTS research_papers_title_trgm_idx;');
        DB::statement('DROP INDEX IF EXISTS research_papers_abstract_trgm_idx;');
    }
};
