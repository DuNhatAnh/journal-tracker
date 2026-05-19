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
        $field = $request->input('field', 'deep learning');
        $pages = (int) $request->input('pages', 1);

        \App\Jobs\SyncPapersFromApi::dispatch($field, strtolower($apiSource->name), $pages);

        return response()->json([
            'message' => "Bắt đầu đồng bộ nguồn {$apiSource->name} với từ khóa '{$field}' (Số trang: {$pages}) ngầm...",
        ]);
    }

    public function syncLogs()
    {
        $logs = \App\Models\SyncLog::with('apiSource')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($logs);
    }
}
