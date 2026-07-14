<?php
 
namespace App\Http\Controllers\Api\Admin;
 
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
 
class SystemSettingsController extends Controller
{
    private function getSettingsPath()
    {
        return storage_path('app/system_settings.json');
    }
 
    private function loadSettings()
    {
        $path = $this->getSettingsPath();
        if (!File::exists($path)) {
            $defaultSettings = [
                'allow_registration'          => true,
                'student_bookmark_limit'      => 50,
                'lecturer_bookmark_limit'     => 200,
                'researcher_bookmark_limit'   => 0, // 0 means unlimited
            ];
            File::ensureDirectoryExists(dirname($path));
            File::put($path, json_encode($defaultSettings, JSON_PRETTY_PRINT));
            return $defaultSettings;
        }
        return json_decode(File::get($path), true);
    }
 
    /**
     * GET /api/admin/settings
     */
    public function getSettings()
    {
        $settings = $this->loadSettings();
 
        return response()->json([
            'settings'  => $settings
        ]);
    }
 
    /**
     * PUT /api/admin/settings
     */
    public function saveSettings(Request $request)
    {
        $validated = $request->validate([
            'allow_registration'          => 'required|boolean',
            'student_bookmark_limit'      => 'required|integer|min:0',
            'lecturer_bookmark_limit'     => 'required|integer|min:0',
            'researcher_bookmark_limit'   => 'required|integer|min:0',
            'reason'                      => 'required|string|min:5|max:1000',
        ]);

        $oldSettings = $this->loadSettings();
        $reason = $validated['reason'];
        unset($validated['reason']);

        // Determine changed bookmark limits
        $changedRoles = [];
        $roleMapping = [
            'student' => [
                'field' => 'student_bookmark_limit',
                'label' => 'Sinh viên'
            ],
            'lecturer' => [
                'field' => 'lecturer_bookmark_limit',
                'label' => 'Giảng viên'
            ],
            'researcher' => [
                'field' => 'researcher_bookmark_limit',
                'label' => 'Nhà nghiên cứu'
            ],
        ];

        foreach ($roleMapping as $role => $info) {
            $field = $info['field'];
            $oldLimit = isset($oldSettings[$field]) ? (int)$oldSettings[$field] : null;
            $newLimit = (int)$validated[$field];

            if ($oldLimit !== $newLimit) {
                $changedRoles[$role] = [
                    'label' => $info['label'],
                    'old'   => $oldLimit,
                    'new'   => $newLimit,
                ];
            }
        }

        // Save new settings to file
        $path = $this->getSettingsPath();
        File::ensureDirectoryExists(dirname($path));
        File::put($path, json_encode($validated, JSON_PRETTY_PRINT));

        // Send notifications to affected roles
        if (!empty($changedRoles)) {
            $now = now();
            foreach ($changedRoles as $role => $limits) {
                $oldStr = $limits['old'] === 0 ? 'không giới hạn' : $limits['old'] . ' bài báo';
                $newStr = $limits['new'] === 0 ? 'không giới hạn' : $limits['new'] . ' bài báo';
                
                $title = 'Thay đổi hạn mức lưu trữ bài báo';
                $content = "Hạn mức lưu bài báo của vai trò {$limits['label']} đã được thay đổi từ {$oldStr} thành {$newStr}. Lý do: {$reason}";

                $userIds = \App\Models\User::where('role', $role)->pluck('id');

                $insertData = [];
                foreach ($userIds as $userId) {
                    $insertData[] = [
                        'user_id'    => $userId,
                        'title'      => $title,
                        'content'    => $content,
                        'type'       => 'alert',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                if (!empty($insertData)) {
                    foreach (array_chunk($insertData, 500) as $chunk) {
                        \App\Models\Notification::insert($chunk);
                    }
                }
            }
        }

        return response()->json([
            'message'  => 'Lưu cấu hình hệ thống thành công!',
            'settings' => $validated
        ]);
    }
}
