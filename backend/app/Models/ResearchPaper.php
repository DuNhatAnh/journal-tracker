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

    protected static function booted()
    {
        static::created(function ($paper) {
            \App\Models\SystemCounter::incrementKey('total_papers');
        });

        static::deleted(function ($paper) {
            \App\Models\SystemCounter::decrementKey('total_papers');
        });
    }

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
        $term = trim(preg_replace('/\s+/', ' ', $term));
        if (empty($term)) return $query;

        // Split by OR (OR has the lowest precedence)
        $orGroups = explode(' OR ', $term);

        return $query->where(function ($q) use ($orGroups) {
            foreach ($orGroups as $orGroup) {
                $q->orWhere(function ($subQ) use ($orGroup) {
                    // Extract phrases in quotes or individual words
                    preg_match_all('/"([^"]+)"|(\S+)/', $orGroup, $matches);
                    
                    $tokens = [];
                    foreach ($matches[0] as $index => $match) {
                        if (!empty($matches[1][$index])) {
                            $tokens[] = $matches[1][$index]; // Quoted phrase
                        } else {
                            $tokens[] = $matches[2][$index]; // Normal word
                        }
                    }
                    
                    $expectingNot = false;
                    foreach ($tokens as $token) {
                        // Skip 'AND' as it is the default implicit behavior
                        if ($token === 'AND') {
                            continue;
                        }
                        if ($token === 'NOT') {
                            $expectingNot = true;
                            continue;
                        }
                        
                        $isNot = $expectingNot;
                        $expectingNot = false;
                        
                        $condition = function ($q2) use ($token) {
                            $q2->where('title', 'ilike', "%{$token}%")
                               ->orWhere('abstract', 'ilike', "%{$token}%")
                               ->orWhereHas('keywords', fn($k) => $k->where('name', 'ilike', "%{$token}%"))
                               ->orWhereHas('authors', fn($a) => $a->where('name', 'ilike', "%{$token}%"))
                               ->orWhereHas('journal', fn($j) => $j->where('name', 'ilike', "%{$token}%"));
                        };

                        if ($isNot) {
                            $subQ->whereNot($condition);
                        } else {
                            $subQ->where($condition);
                        }
                    }
                });
            }
        });
    }
}
