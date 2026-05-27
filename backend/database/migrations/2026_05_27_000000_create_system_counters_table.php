<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_counters', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->bigInteger('value')->default(0);
            $table->timestamps();
        });

        // Initialize counters with current counts of papers and keywords
        $papersCount = DB::table('research_papers')->count();
        $keywordsCount = DB::table('keywords')->count();

        DB::table('system_counters')->insert([
            [
                'key' => 'total_papers',
                'value' => $papersCount,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'total_keywords',
                'value' => $keywordsCount,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('system_counters');
    }
};
