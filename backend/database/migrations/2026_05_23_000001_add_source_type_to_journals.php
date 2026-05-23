<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('journals', function (Blueprint $table) {
            // OpenAlex source type: journal | repository | conference | book-series | ebook-platform | etc.
            $table->string('source_type', 50)->nullable()->after('field');
        });
    }

    public function down(): void
    {
        Schema::table('journals', function (Blueprint $table) {
            $table->dropColumn('source_type');
        });
    }
};
