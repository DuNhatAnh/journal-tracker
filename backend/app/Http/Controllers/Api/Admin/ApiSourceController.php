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

    public function show($id)
    {
        $apiSource = ApiSource::findOrFail($id);
        return response()->json($apiSource);
    }

    public function update(Request $request, $id)
    {
        $apiSource = ApiSource::findOrFail($id);
        
        $validated = $request->validate([
            'name'      => 'nullable|string|max:255',
            'api_url'   => 'nullable|url',
            'is_active' => 'nullable|boolean',
            'config'    => 'nullable|array',
        ]);
        
        \Illuminate\Support\Facades\Log::info("API SOURCE UPDATE: id={$id}", $request->all());

        if ($request->has('name')) $apiSource->name = $validated['name'];
        if ($request->has('api_url')) $apiSource->api_url = $validated['api_url'];
        if ($request->has('is_active')) $apiSource->is_active = (bool) $validated['is_active'];
        if ($request->has('config')) $apiSource->config = $validated['config'];
        
        $apiSource->save();

        return response()->json($apiSource);
    }

    public function destroy($id)
    {
        $apiSource = ApiSource::findOrFail($id);
        
        // Remove related sync logs before deleting the source to prevent foreign key errors
        \App\Models\SyncLog::where('api_source_id', $apiSource->id)->delete();
        
        $apiSource->delete();
        return response()->json(null, 204);
    }

    public function sync(Request $request, $id)
    {
        $apiSource = ApiSource::findOrFail($id);
        
        $field = $request->input('field', 'deep learning');
        $pages = (int) $request->input('pages', 1);
        $years = $request->input('years', '');
        $startPage = (int) $request->input('start_page', 1);

        $syncLog = \App\Models\SyncLog::create([
            'api_source_id' => $apiSource->id,
            'status'        => 'running',
            'papers_synced' => 0,
            'progress_details' => [
                'total_expected' => $pages,
                'items' => [],
                'summary' => ['success' => 0, 'skipped' => 0, 'failed' => 0],
                'parameters' => [
                    'keyword' => $field,
                    'years' => $years,
                    'domain' => $request->input('domain', 'Computer Science')
                ]
            ]
        ]);

        \App\Jobs\SyncPapersFromApi::dispatch($field, strtolower($apiSource->name), $pages, '', $years, $startPage, $syncLog);

        return response()->json([
            'message' => "Bắt đầu đồng bộ nguồn {$apiSource->name} với từ khóa '{$field}' (Trang: {$startPage}, Hạn mức: {$pages}) ngầm...",
            'sync_log' => $syncLog,
        ]);
    }

    public function showSyncLog($id)
    {
        $syncLog = \App\Models\SyncLog::with('apiSource')->findOrFail($id);
        return response()->json($syncLog);
    }

    public function cancelSync($id)
    {
        $syncLog = \App\Models\SyncLog::findOrFail($id);

        if ($syncLog->status !== 'running') {
            return response()->json(['message' => 'Tiến trình này không đang chạy.'], 422);
        }

        $syncLog->update([
            'status'        => 'cancelled',
            'error_message' => 'Đã bị hủy bởi quản trị viên.',
        ]);

        return response()->json(['message' => 'Đã hủy tiến trình đồng bộ.']);
    }

    public function syncLogs()
    {
        $logs = \App\Models\SyncLog::with('apiSource')
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($logs);
    }
}
