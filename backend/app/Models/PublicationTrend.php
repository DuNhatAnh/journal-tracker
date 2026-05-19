<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublicationTrend extends Model
{
    use HasFactory;

    protected $fillable = [
        'keyword_id',
        'year',
        'paper_count',
        'citation_count',
        'growth_rate',
    ];

    protected $casts = [
        'paper_count'    => 'integer',
        'citation_count' => 'integer',
        'growth_rate'    => 'float',
        'year'           => 'integer',
    ];

    public function keyword()
    {
        return $this->belongsTo(Keyword::class);
    }
}
