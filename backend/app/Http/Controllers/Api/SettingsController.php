<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show(Request $request)
    {
        $settings = $request->user()->settings ?? [
            'notify_journal' => true,
            'notify_keyword' => true,
            'notify_trending' => true,
        ];
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'notify_journal' => 'boolean',
            'notify_keyword' => 'boolean',
            'notify_trending' => 'boolean',
        ]);

        $user = $request->user();
        $settings = array_merge($user->settings ?? [], $validated);
        
        $user->settings = $settings;
        $user->save();

        return response()->json($settings);
    }
}
