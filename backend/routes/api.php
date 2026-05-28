<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\PaperController;
use App\Http\Controllers\Api\JournalController;
use App\Http\Controllers\Api\KeywordController;
use App\Http\Controllers\Api\TrendController;
use App\Http\Controllers\Api\BookmarkController;
use App\Http\Controllers\Api\FollowingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\ApiSourceController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;

/*
|--------------------------------------------------------------------------
| Public Routes (không cần đăng nhập)
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Routes (cần Sanctum token)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout',  [AuthController::class, 'logout']);
    Route::get('/me',       [AuthController::class, 'me']);

    // Settings & Profile
    Route::get('/settings', [App\Http\Controllers\Api\SettingsController::class, 'show']);
    Route::put('/settings', [App\Http\Controllers\Api\SettingsController::class, 'update']);
    Route::post('/profile', [App\Http\Controllers\Api\Auth\AuthController::class, 'updateProfile']);
    Route::delete('/avatar', [App\Http\Controllers\Api\Auth\AuthController::class, 'deleteAvatar']);
    Route::post('/password', [App\Http\Controllers\Api\Auth\AuthController::class, 'changePassword']);

    // Dashboard
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats',       [DashboardController::class, 'stats']);
        Route::get('/bookmarks',   [DashboardController::class, 'bookmarks']);
        Route::get('/trending',    [DashboardController::class, 'trending']);
        Route::get('/recent',      [DashboardController::class, 'recent']);
        Route::get('/recommended', [DashboardController::class, 'recommended']);
        Route::get('/journals',    [DashboardController::class, 'journals']);
        Route::get('/fields',      [DashboardController::class, 'fields']);
    });

    // Research Papers
    Route::prefix('papers')->group(function () {
        Route::get('/',         [PaperController::class, 'index']);
        Route::get('/search',   [PaperController::class, 'search']);
        Route::get('/{paper}',  [PaperController::class, 'show']);
    });

    // Journals
    Route::prefix('journals')->group(function () {
        Route::get('/',                              [JournalController::class, 'index']);
        Route::get('/feed',                          [JournalController::class, 'feed']);
        Route::get('/{journal}',                     [JournalController::class, 'show']);
        Route::post('/{journal}/follow',             [JournalController::class, 'follow']);
        Route::delete('/{journal}/follow',           [JournalController::class, 'unfollow']);
    });

    // Keywords
    Route::prefix('keywords')->group(function () {
        Route::get('/',           [KeywordController::class, 'index']);
        Route::get('/{keyword}',  [KeywordController::class, 'show']);
    });

    // Trends
    Route::prefix('trends')->middleware('role:researcher,admin')->group(function () {
        Route::get('/',           [TrendController::class, 'index']);
        Route::get('/trending',   [TrendController::class, 'trending']);
        Route::get('/author/{author}/history',  [TrendController::class, 'authorHistory']);
        Route::get('/author/{author}/network',  [TrendController::class, 'authorNetwork']);
        Route::get('/author/{author}/journals', [TrendController::class, 'authorJournals']);
        Route::get('/author/{author}/papers',   [TrendController::class, 'authorPapers']);
        Route::get('/{keyword}',  [TrendController::class, 'show']);
        Route::get('/{keyword}/history',  [TrendController::class, 'history']);
        Route::get('/{keyword}/network',  [TrendController::class, 'network']);
        Route::get('/{keyword}/journals', [TrendController::class, 'journals']);
        Route::get('/{keyword}/papers',   [TrendController::class, 'papers']);
    });

    // Bookmarks
    Route::prefix('bookmarks')->group(function () {
        Route::get('/',              [BookmarkController::class, 'index']);
        Route::get('/export',        [BookmarkController::class, 'export'])->middleware('role:researcher,admin');
        Route::post('/',             [BookmarkController::class, 'store']);
        Route::delete('/paper/{paper_id}', [BookmarkController::class, 'destroyByPaperId']);
        Route::put('/{bookmark}',    [BookmarkController::class, 'update']);
        Route::delete('/{bookmark}', [BookmarkController::class, 'destroy']);
    });

    // Following
    Route::prefix('following')->group(function () {
        Route::get('/status',        [FollowingController::class, 'index']);
        Route::post('/keywords',     [FollowingController::class, 'followKeyword']);
        Route::delete('/keywords/{keyword}', [FollowingController::class, 'unfollowKeyword']);

        Route::get('/feed',          [FollowingController::class, 'feed']);
        Route::get('/search',        [FollowingController::class, 'search']);
        Route::post('/journals',     [FollowingController::class, 'followJournal']);
        Route::delete('/journals/{journal}', [FollowingController::class, 'unfollowJournal']);
        Route::post('/authors',      [FollowingController::class, 'followAuthor']);
        Route::delete('/authors/{author}', [FollowingController::class, 'unfollowAuthor']);
    });

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/',           [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::delete('/read',    [NotificationController::class, 'deleteRead']);
        Route::post('/delete-multiple', [NotificationController::class, 'deleteMultiple']);
        Route::patch('/{id}/read',[NotificationController::class, 'markRead']);
        Route::post('/read-all',  [NotificationController::class, 'markAllRead']);
    });

    /*
    |--------------------------------------------------------------------------
    | Admin-only Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        // Admin Dashboard Stats & Charts
        Route::get('stats',  [AdminDashboardController::class, 'stats']);
        Route::get('charts', [AdminDashboardController::class, 'charts']);

        // User Management
        Route::apiResource('users',       AdminUserController::class);

        // API Source Management & Sync
        Route::apiResource('api-sources', ApiSourceController::class);
        Route::post('api-sources/{api_source}/sync', [ApiSourceController::class, 'sync']);
        Route::post('sync-logs/{sync_log}/cancel', [ApiSourceController::class, 'cancelSync']);
        Route::get('sync-logs', [ApiSourceController::class, 'syncLogs']);
        Route::get('sync-logs/{sync_log}', [ApiSourceController::class, 'showSyncLog']);
    });
});
