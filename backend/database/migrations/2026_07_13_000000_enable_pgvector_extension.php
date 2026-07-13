<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS vector;');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Không DROP EXTENSION vì extension vector có thể đang được sử dụng bởi các bảng/database khác trên cùng server.
        // DB::statement('DROP EXTENSION IF EXISTS vector;');
    }
};
