<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Users table (extends Laravel default)
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', ['admin', 'researcher', 'lecturer', 'student'])->default('student');
            $table->string('avatar')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // 2. Journals
        Schema::create('journals', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('issn', 20)->nullable()->unique();
            $table->string('publisher')->nullable();
            $table->string('url')->nullable();
            $table->string('field')->nullable();      // e.g. "Computer Science"
            $table->timestamps();
        });

        // 3. Authors
        Schema::create('authors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('affiliation')->nullable();
            $table->string('orcid', 30)->nullable()->unique();
            $table->timestamps();
        });

        // 4. Keywords
        Schema::create('keywords', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->timestamps();
        });

        // 5. Research Papers
        Schema::create('research_papers', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('abstract')->nullable();
            $table->integer('published_year');
            $table->foreignId('journal_id')->nullable()->constrained('journals')->nullOnDelete();
            $table->integer('citations_count')->default(0);
            $table->string('doi')->nullable()->unique();
            $table->string('url')->nullable();
            $table->string('source')->nullable();      // 'openalex' | 'semantic_scholar'
            $table->string('source_id')->nullable();   // ID from external API
            $table->timestamps();

            $table->index(['published_year']);
            $table->index(['citations_count']);
        });

        // 6. Pivot: paper ↔ author
        Schema::create('paper_author', function (Blueprint $table) {
            $table->foreignId('paper_id')->constrained('research_papers')->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('authors')->cascadeOnDelete();
            $table->primary(['paper_id', 'author_id']);
        });

        // 7. Pivot: paper ↔ keyword
        Schema::create('keyword_paper', function (Blueprint $table) {
            $table->foreignId('paper_id')->constrained('research_papers')->cascadeOnDelete();
            $table->foreignId('keyword_id')->constrained('keywords')->cascadeOnDelete();
            $table->primary(['paper_id', 'keyword_id']);
        });

        // 8. Publication Trends (aggregated per keyword per year)
        Schema::create('publication_trends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('keyword_id')->constrained('keywords')->cascadeOnDelete();
            $table->integer('year');
            $table->integer('paper_count')->default(0);
            $table->integer('citation_count')->default(0);
            $table->float('growth_rate')->default(0);   // YoY percentage
            $table->timestamps();

            $table->unique(['keyword_id', 'year']);
            $table->index(['year']);
        });

        // 9. Bookmarks
        Schema::create('bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('paper_id')->constrained('research_papers')->cascadeOnDelete();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'paper_id']);
        });

        // 10. Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('content');
            $table->string('type')->default('info');  // info | warning | success
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_read']);
        });

        // 11. API Data Sources
        Schema::create('api_sources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('api_url');
            $table->string('api_key')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('config')->nullable();        // Extra config (rate limits, etc.)
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_sources');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('bookmarks');
        Schema::dropIfExists('publication_trends');
        Schema::dropIfExists('keyword_paper');
        Schema::dropIfExists('paper_author');
        Schema::dropIfExists('research_papers');
        Schema::dropIfExists('keywords');
        Schema::dropIfExists('authors');
        Schema::dropIfExists('journals');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
