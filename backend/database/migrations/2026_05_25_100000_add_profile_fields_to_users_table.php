<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('academic_title')->nullable()->after('name');
            $table->date('dob')->nullable()->after('academic_title');
            $table->string('phone')->nullable()->after('dob');
            $table->string('gender')->nullable()->after('phone');
            $table->string('institution')->nullable()->after('gender');
            $table->text('bio')->nullable()->after('institution');
            $table->string('website')->nullable()->after('bio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'academic_title',
                'dob',
                'phone',
                'gender',
                'institution',
                'bio',
                'website'
            ]);
        });
    }
};
