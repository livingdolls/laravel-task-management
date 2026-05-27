<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BroadcastController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\NotificationController;
use Illuminate\Support\Facades\Route;

// Health check endpoint (no auth required)
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    
    Route::apiResource('tasks', TaskController::class);
    Route::post('tasks/{task}/attachments', [AttachmentController::class, 'store']);
    Route::post('tasks/{task}/comments', [CommentController::class, 'store']);
    
    Route::get('attachments/{attachment}/download', [AttachmentController::class, 'download']);
    Route::delete('attachments/{attachment}', [AttachmentController::class, 'destroy']);
    
    // Notification routes
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);
    
    // Broadcasting auth route
    Route::post('/broadcasting/auth', [BroadcastController::class, 'auth']);
    
    // Background Jobs routes
    Route::post('jobs/export-tasks', [JobController::class, 'exportTasks']);
    Route::post('jobs/bulk-update-status', [JobController::class, 'bulkUpdateStatus']);
    Route::get('jobs', [JobController::class, 'listJobs']);
    Route::get('jobs/{job}', [JobController::class, 'getJobStatus']);
    Route::get('jobs/{job}/download', [JobController::class, 'downloadExport']);
});
