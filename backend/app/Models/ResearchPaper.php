<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResearchPaper extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'abstract',
        'published_year',
        'journal_id',
        'citations_count',
        'doi',
        'source',       // e.g. 'openalex', 'semantic_scholar'
        'source_id',    // External API ID
        'url',
    ];

    protected $casts = [
        'citations_count' => 'integer',
        'published_year'  => 'integer',
    ];

    // ─── Relationships ──────────────────────────────────────────────────────────

    public function journal()
    {
        return $this->belongsTo(Journal::class);
    }

    public function authors()
    {
        return $this->belongsToMany(Author::class, 'paper_author', 'paper_id', 'author_id');
    }

    public function keywords()
    {
        return $this->belongsToMany(Keyword::class, 'keyword_paper', 'paper_id', 'keyword_id');
    }

    public function bookmarks()
    {
        return $this->hasMany(Bookmark::class, 'paper_id');
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeByYear($query, int $year)
    {
        return $query->where('published_year', $year);
    }

    public function scopeByKeyword($query, string $keyword)
    {
        return $query->whereHas('keywords', fn($q) => $q->where('name', 'ilike', "%{$keyword}%"));
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title', 'ilike', "%{$term}%")
              ->orWhere('abstract', 'ilike', "%{$term}%");
        });
    }
}
