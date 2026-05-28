<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;

class NotificationController extends Controller
{
    public function index()
    {
        $perPage = request('per_page', 5);
        $notifications = auth()->user()
            ->notifications()
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($notifications);
    }

    public function unreadCount()
    {
        $count = auth()->user()
            ->notifications()
            ->where('is_read', 'false')
            ->count();

        return response()->json(['count' => $count]);
    }

    public function markRead(int $id)
    {
        $notification = auth()->user()
            ->notifications()
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json(['message' => 'Đã đọc.']);
    }

    public function markAllRead()
    {
        auth()->user()
            ->notifications()
            ->where('is_read', 'false')
            ->update(['is_read' => 'true', 'read_at' => now()]);

        return response()->json(['message' => 'Đã đọc tất cả.']);
    }

    public function deleteRead()
    {
        auth()->user()
            ->notifications()
            ->where('is_read', 'true')
            ->delete();

        return response()->json(['message' => 'Đã xóa thông báo đã đọc.']);
    }

    public function deleteMultiple(\Illuminate\Http\Request $request)
    {
        $ids = $request->input('ids', []);
        
        if (empty($ids)) {
            return response()->json(['message' => 'Vui lòng chọn thông báo cần xóa.'], 400);
        }

        auth()->user()
            ->notifications()
            ->whereIn('id', $ids)
            ->delete();

        return response()->json(['message' => 'Đã xóa các thông báo được chọn.']);
    }
}
