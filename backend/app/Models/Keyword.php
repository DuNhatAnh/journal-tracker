<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Keyword extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'slug'];

    protected static function booted()
    {
        static::created(function ($keyword) {
            \App\Models\SystemCounter::incrementKey('total_keywords');
        });

        static::deleted(function ($keyword) {
            // Soft delete still fires the deleted event
            \App\Models\SystemCounter::decrementKey('total_keywords');
        });

        static::restored(function ($keyword) {
            // When restored from soft delete
            \App\Models\SystemCounter::incrementKey('total_keywords');
        });
    }

    public function papers()
    {
        return $this->belongsToMany(ResearchPaper::class, 'keyword_paper', 'keyword_id', 'paper_id');
    }

    public function trends()
    {
        return $this->hasMany(PublicationTrend::class);
    }

    public function followers()
    {
        return $this->belongsToMany(User::class, 'user_keyword')
                    ->withTimestamps();
    }

    /**
     * Total number of papers using this keyword.
     */
    public function paperCount(): int
    {
        return $this->papers()->count();
    }
}
