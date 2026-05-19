<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApiSource;
use Illuminate\Http\Request;

class ApiSourceController extends Controller
{
    public function index()
    {
        return response()->json(ApiSource::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'api_url'   => 'required|url',
            'is_active' => 'boolean',
            'config'    => 'nullable|array',
        ]);

        $source = ApiSource::create($validated);
        return response()->json($source, 201);
    }

    public function show(ApiSource $apiSource)
    {
        return response()->json($apiSource);
    }

    public function update(Request $request, ApiSource $apiSource)
    {
        $validated = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'api_url'   => 'sometimes|url',
            'is_active' => 'sometimes|boolean',
            'config'    => 'sometimes|nullable|array',
        ]);

        $apiSource->update($validated);
        return response()->json($apiSource);
    }

    public function destroy(ApiSource $apiSource)
    {
        $apiSource->delete();
        return response()->json(null, 204);
    }

    public function sync(Request $request, ApiSource $apiSource)
    {
        // Placeholder for sync action
        return response()->json([
            'message' => "Synchronization started for source: {$apiSource->name}",
        ]);
    }
}
