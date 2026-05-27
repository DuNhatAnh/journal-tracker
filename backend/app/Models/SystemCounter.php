<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemCounter extends Model
{
    use HasFactory;

    protected $table = 'system_counters';
    protected $fillable = ['key', 'value'];
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    public static function incrementKey(string $key, int $amount = 1): void
    {
        self::firstOrCreate(['key' => $key], ['value' => 0]);
        self::where('key', $key)->increment('value', $amount);
    }

    public static function decrementKey(string $key, int $amount = 1): void
    {
        self::firstOrCreate(['key' => $key], ['value' => 0]);
        self::where('key', $key)->decrement('value', $amount);
    }

    public static function getValue(string $key, int $default = 0): int
    {
        $counter = self::find($key);
        return $counter ? (int) $counter->value : $default;
    }
}
