<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Author extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'affiliation', 'orcid'];

    public function papers()
    {
        return $this->belongsToMany(ResearchPaper::class, 'paper_author');
    }
}
