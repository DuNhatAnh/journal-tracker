<?php

use Illuminate\Support\Facades\Schedule;

// Automatically sync papers from OpenAlex daily for default academic fields
Schedule::command('papers:sync --field="deep learning" --pages=2')->daily();
Schedule::command('papers:sync --field="computer vision" --pages=2')->daily();
Schedule::command('papers:sync --field="natural language processing" --pages=2')->daily();

// Automatically recalculate trends daily after papers sync
Schedule::command('trends:calculate')->dailyAt('01:00');
