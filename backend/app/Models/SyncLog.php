<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SyncLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'api_source_id',
        'status',
        'papers_synced',
        'error_message',
        'progress_details',
    ];

    protected $casts = [
        'progress_details' => 'array',
    ];

    public function apiSource()
    {
        return $this->belongsTo(ApiSource::class);
    }
}
