<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Journal extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'issn', 'publisher', 'url', 'field'];

    public function papers()
    {
        return $this->hasMany(ResearchPaper::class);
    }

    public function followers()
    {
        return $this->belongsToMany(User::class, 'user_journal')->withTimestamps();
    }

    public function paperCountByYear()
    {
        return $this->papers()
                    ->selectRaw('published_year, count(*) as total')
                    ->groupBy('published_year')
                    ->orderBy('published_year')
                    ->get();
    }
}
