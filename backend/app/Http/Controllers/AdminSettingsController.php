<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAiSettingsRequest;
use App\Services\AdminSettingsService;
use Illuminate\Http\JsonResponse;
use Exception;

class AdminSettingsController extends Controller
{
    public function __construct(
        private readonly AdminSettingsService $adminSettingsService
    ) {}

    /**
     * Get current AI Settings.
     */
    public function getAiSettings(): JsonResponse
    {
        $settings = $this->adminSettingsService->getAiSettings();
        
        return response()->json($settings);
    }

    /**
     * Get whitelist models from config.
     */
    public function getModels(): JsonResponse
    {
        $models = $this->adminSettingsService->getModelsWhitelist();
        
        return response()->json($models);
    }

    /**
     * Test AI driver connection without saving.
     */
    public function testConnection(UpdateAiSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        try {
            $this->adminSettingsService->testConnection($validated['driver'], $validated);
            
            return response()->json([
                'message' => 'Connection successful',
                'status' => 'valid'
            ]);
        } catch (Exception $e) {
            $status = $e->getCode() ?: 500;
            return response()->json([
                'message' => $e->getMessage(),
                'status' => 'invalid'
            ], $status >= 400 && $status < 600 ? $status : 500);
        }
    }

    /**
     * Validate, Test Connection, and Save AI Settings.
     */
    public function updateAiSettings(UpdateAiSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            // 1. Test Connection
            $this->adminSettingsService->testConnection($validated['driver'], $validated);
            
            // 2. Save Settings
            $this->adminSettingsService->saveAiSettings($validated['driver'], $validated);
            
            return response()->json([
                'message' => 'AI Settings updated successfully',
                'status' => 'valid'
            ]);
        } catch (Exception $e) {
            $status = $e->getCode() ?: 500;
            return response()->json([
                'message' => 'Test connection failed: ' . $e->getMessage(),
                'status' => 'invalid'
            ], $status >= 400 && $status < 600 ? $status : 500);
        }
    }

    /**
     * Reset AI Settings.
     */
    public function deleteAiSettings(): JsonResponse
    {
        $this->adminSettingsService->resetAiSettings();
        
        return response()->json([
            'message' => 'AI Settings reset successfully'
        ]);
    }
}
