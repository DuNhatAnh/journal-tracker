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
        return $this->belongsToMany(ResearchPaper::class, 'paper_author', 'author_id', 'paper_id');
    }

    public function followers()
    {
        return $this->belongsToMany(User::class, 'user_author')
                    ->withTimestamps();
    }
}
