<?php

use Illuminate\Support\Facades\Schedule;

// Automatically sync papers from OpenAlex daily for default academic fields
Schedule::command('papers:sync --keyword="deep learning" --pages=2')->daily();
Schedule::command('papers:sync --keyword="computer vision" --pages=2')->daily();
Schedule::command('papers:sync --keyword="natural language processing" --pages=2')->daily();

// Automatically recalculate trends daily after papers sync
Schedule::command('trends:calculate')->dailyAt('01:00');

// Send weekly trending notifications to users on Monday morning
Schedule::command('papers:trending-notify')->weeklyOn(1, '08:00');
