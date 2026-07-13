<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaperChunk extends Model
{
    use HasFactory;

    protected $fillable = [
        'paper_id',
        'content',
    ];

    // Since 'embedding' is stored as a vector in PostgreSQL, retrieving it directly might return a string representation depending on the PDO driver.
    // However, as per instructions, we keep it simple for Phase 1. 

    public function paper()
    {
        return $this->belongsTo(ResearchPaper::class, 'paper_id');
    }
}
