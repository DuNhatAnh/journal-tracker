<?php
 
namespace App\Http\Controllers\Api\Admin;
 
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
 
class AdminSettingsController extends Controller
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
        ]);
 
        $path = $this->getSettingsPath();
        File::ensureDirectoryExists(dirname($path));
        File::put($path, json_encode($validated, JSON_PRETTY_PRINT));
 
        return response()->json([
            'message'  => 'Lưu cấu hình hệ thống thành công!',
            'settings' => $validated
        ]);
    }
}
