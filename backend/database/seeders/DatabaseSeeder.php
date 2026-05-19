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
            'password' => Hash::make('password'),
            'role'     => 'admin',
        ]);

        User::create([
            'name'     => 'Dr. Researcher',
            'email'    => 'researcher@journaltracker.app',
            'password' => Hash::make('password'),
            'role'     => 'researcher',
        ]);

        User::create([
            'name'     => 'Prof. Lecturer',
            'email'    => 'lecturer@journaltracker.app',
            'password' => Hash::make('password'),
            'role'     => 'lecturer',
        ]);

        User::create([
            'name'     => 'Student Demo',
            'email'    => 'student@journaltracker.app',
            'password' => Hash::make('password'),
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

        // ─── Demo Journals ───────────────────────────────────────────────────────
        $journals = [
            ['name' => 'Nature', 'issn' => '0028-0836', 'publisher' => 'Springer Nature', 'field' => 'Multidisciplinary'],
            ['name' => 'IEEE Transactions on Neural Networks', 'issn' => '2162-237X', 'publisher' => 'IEEE', 'field' => 'Computer Science'],
            ['name' => 'arXiv (cs.AI)', 'issn' => null, 'publisher' => 'Cornell University', 'field' => 'Artificial Intelligence'],
        ];

        foreach ($journals as $j) {
            Journal::create($j);
        }

        // ─── Demo Keywords ───────────────────────────────────────────────────────
        $keywordNames = [
            'Machine Learning', 'Deep Learning', 'Natural Language Processing',
            'Computer Vision', 'Reinforcement Learning', 'Transformer', 'Large Language Models',
        ];

        $keywords = [];
        foreach ($keywordNames as $kw) {
            $keywords[] = Keyword::create([
                'name' => $kw,
                'slug' => \Illuminate\Support\Str::slug($kw),
            ]);
        }

        // ─── Demo Publication Trends ─────────────────────────────────────────────
        $trendData = [
            'Machine Learning'   => [2020 => 1200, 2021 => 1450, 2022 => 1890, 2023 => 2200, 2024 => 2750],
            'Deep Learning'      => [2020 => 980,  2021 => 1300, 2022 => 1700, 2023 => 2100, 2024 => 2600],
            'Large Language Models' => [2020 => 50, 2021 => 200, 2022 => 800, 2023 => 2500, 2024 => 5100],
        ];

        foreach ($trendData as $kwName => $years) {
            $kw = Keyword::where('name', $kwName)->first();
            $prev = null;
            foreach ($years as $year => $count) {
                $growth = $prev ? round(($count - $prev) / $prev * 100, 2) : 0;
                PublicationTrend::create([
                    'keyword_id'   => $kw->id,
                    'year'         => $year,
                    'paper_count'  => $count,
                    'citation_count' => $count * rand(3, 8),
                    'growth_rate'  => $growth,
                ]);
                $prev = $count;
            }
        }

        $this->command->info('✅ Seeding complete! Demo accounts created.');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Admin',      'admin@journaltracker.app',      'password'],
                ['Researcher', 'researcher@journaltracker.app', 'password'],
                ['Lecturer',   'lecturer@journaltracker.app',   'password'],
                ['Student',    'student@journaltracker.app',    'password'],
            ]
        );
    }
}
