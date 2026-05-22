<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_journal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('journal_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'journal_id']); // Mỗi user chỉ theo dõi 1 tạp chí 1 lần
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_journal');
    }
};
