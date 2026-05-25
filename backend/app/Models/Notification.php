<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'title', 'content', 'type', 'is_read', 'read_at', 'data'];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'data'    => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function markAsRead(): void
    {
        $this->update(['is_read' => 'true', 'read_at' => now()]);
    }
}
