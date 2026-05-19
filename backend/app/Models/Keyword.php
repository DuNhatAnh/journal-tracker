<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Keyword extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug'];

    public function papers()
    {
        return $this->belongsToMany(ResearchPaper::class, 'keyword_paper', 'keyword_id', 'paper_id');
    }

    public function trends()
    {
        return $this->hasMany(PublicationTrend::class);
    }

    /**
     * Total number of papers using this keyword.
     */
    public function paperCount(): int
    {
        return $this->papers()->count();
    }
}
