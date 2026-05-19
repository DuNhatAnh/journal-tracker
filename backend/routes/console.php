<?php

use Illuminate\Support\Facades\Schedule;

// Automatically sync papers from OpenAlex daily for default academic fields
Schedule::command('papers:sync --field="deep learning" --pages=2')->daily();
Schedule::command('papers:sync --field="computer vision" --pages=2')->daily();
Schedule::command('papers:sync --field="natural language processing" --pages=2')->daily();
