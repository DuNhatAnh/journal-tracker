<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // research_papers: index journal_id để tăng tốc JOIN và whereIn
        Schema::table('research_papers', function (Blueprint $table) {
            if (!$this->hasIndex('research_papers', 'research_papers_journal_id_index')) {
                $table->index(['journal_id'], 'research_papers_journal_id_index');
            }
            // Composite index cho dashboard recent papers query
            if (!$this->hasIndex('research_papers', 'research_papers_year_created_index')) {
                $table->index(['published_year', 'created_at'], 'research_papers_year_created_index');
            }
            // Index cho citations + year (dashboard recommended papers)
            if (!$this->hasIndex('research_papers', 'research_papers_citations_index')) {
                $table->index(['citations_count', 'published_year'], 'research_papers_citations_index');
            }
        });

        // keyword_paper pivot: thêm index ngược để tăng tốc lookup theo keyword
        Schema::table('keyword_paper', function (Blueprint $table) {
            if (!$this->hasIndex('keyword_paper', 'keyword_paper_keyword_id_index')) {
                $table->index(['keyword_id', 'paper_id'], 'keyword_paper_keyword_id_index');
            }
        });

        // publication_trends: composite index cho dashboard trending query
        Schema::table('publication_trends', function (Blueprint $table) {
            if (!$this->hasIndex('publication_trends', 'trends_year_growth_papers_index')) {
                $table->index(['year', 'growth_rate', 'paper_count', 'citation_count'], 'trends_year_growth_papers_index');
            }
        });

        // bookmarks: index paper_id để tăng tốc pluck
        Schema::table('bookmarks', function (Blueprint $table) {
            if (!$this->hasIndex('bookmarks', 'bookmarks_user_paper_index')) {
                $table->index(['user_id', 'paper_id'], 'bookmarks_user_paper_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('research_papers', function (Blueprint $table) {
            $table->dropIndexIfExists('research_papers_journal_id_index');
            $table->dropIndexIfExists('research_papers_year_created_index');
            $table->dropIndexIfExists('research_papers_citations_index');
        });
        Schema::table('keyword_paper', function (Blueprint $table) {
            $table->dropIndexIfExists('keyword_paper_keyword_id_index');
        });
        Schema::table('publication_trends', function (Blueprint $table) {
            $table->dropIndexIfExists('trends_year_growth_papers_index');
        });
        Schema::table('bookmarks', function (Blueprint $table) {
            $table->dropIndexIfExists('bookmarks_user_paper_index');
        });
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        try {
            $sm = Schema::getConnection()->getDoctrineSchemaManager();
            $indexes = $sm->listTableIndexes($table);
            return isset($indexes[$indexName]);
        } catch (\Throwable) {
            return false;
        }
    }
};
