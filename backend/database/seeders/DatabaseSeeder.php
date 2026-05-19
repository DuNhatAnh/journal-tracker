<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Journal;
use App\Models\Keyword;
use App\Models\Author;
use App\Models\ResearchPaper;
use App\Models\PublicationTrend;
use App\Models\ApiSource;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Demo Users ──────────────────────────────────────────────────────────
        $admin = User::create([
            'name'     => 'System Admin',
            'email'    => 'admin@journaltracker.app',
            'password' => Hash::make('12345678'),
            'role'     => 'admin',
        ]);

        User::create([
            'name'     => 'Dr. Researcher',
            'email'    => 'researcher@journaltracker.app',
            'password' => Hash::make('12345678'),
            'role'     => 'researcher',
        ]);

        User::create([
            'name'     => 'Prof. Lecturer',
            'email'    => 'lecturer@journaltracker.app',
            'password' => Hash::make('12345678'),
            'role'     => 'lecturer',
        ]);

        User::create([
            'name'     => 'Student Demo',
            'email'    => 'student@journaltracker.app',
            'password' => Hash::make('12345678'),
            'role'     => 'student',
        ]);

        // ─── API Sources ─────────────────────────────────────────────────────────
        ApiSource::create([
            'name'     => 'OpenAlex',
            'api_url'  => 'https://api.openalex.org',
            'is_active' => true,
            'config'   => ['email' => 'admin@journaltracker.app'],
        ]);

        ApiSource::create([
            'name'     => 'Semantic Scholar',
            'api_url'  => 'https://api.semanticscholar.org/graph/v1',
            'is_active' => true,
        ]);

        $this->command->info('✅ Seeding complete! User accounts and API sources created.');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Admin',      'admin@journaltracker.app',      '12345678'],
                ['Researcher', 'researcher@journaltracker.app', '12345678'],
                ['Lecturer',   'lecturer@journaltracker.app',   '12345678'],
                ['Student',    'student@journaltracker.app',    '12345678'],
            ]
        );
    }
}
