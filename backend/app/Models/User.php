<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Roles: admin | researcher | lecturer | student
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'avatar',
        'academic_title',
        'dob',
        'phone',
        'gender',
        'institution',
        'bio',
        'website',
        'settings',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'settings'          => 'array',
    ];

    // ─── Role helpers ───────────────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isResearcher(): bool
    {
        return $this->role === 'researcher';
    }

    // ─── Relationships ──────────────────────────────────────────────────────────

    public function bookmarks()
    {
        return $this->hasMany(Bookmark::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function bookmarkedPapers()
    {
        return $this->belongsToMany(ResearchPaper::class, 'bookmarks')
                    ->withPivot('note')
                    ->withTimestamps();
    }

    public function followedKeywords()
    {
        return $this->belongsToMany(Keyword::class, 'user_keyword')
                    ->withTimestamps();
    }

    public function followedJournals()
    {
        return $this->belongsToMany(Journal::class, 'user_journal')
                    ->withTimestamps();
    }

    public function followedAuthors()
    {
        return $this->belongsToMany(Author::class, 'user_author')
                    ->withTimestamps();
    }
}
