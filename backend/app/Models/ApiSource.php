<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApiSource extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'api_url',
        'api_key',
        'is_active',
        'last_synced_at',
        'config',          // JSON column for extra config
    ];

    protected $hidden = ['api_key'];

    protected $casts = [
        'is_active'      => 'boolean',
        'last_synced_at' => 'datetime',
        'config'         => 'array',
    ];
}
