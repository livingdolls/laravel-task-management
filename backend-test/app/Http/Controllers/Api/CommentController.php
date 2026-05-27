<?php

namespace App\Http\Controllers\Api;

use App\Events\NotificationCreated;
use App\Events\TaskCommentCreated;
use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CommentController extends Controller
{
    public function store(Request $request, Task $task)
    {
        $validated = $request->validate([
            'comment' => 'required|string',
        ]);
        
        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'comment' => $validated['comment'],
        ]);
        
        $comment->load('user');
        
        // Notify task creator and assigned user (not the commenter)
        $notifications = $this->createCommentNotifications($task, $comment, $request->user()->id);
        
        // Broadcast comment event for real-time update
        Log::info('[Broadcast] Broadcasting TaskCommentCreated', [
            'task_id' => $task->id,
            'comment_id' => $comment->id
        ]);
        broadcast(new TaskCommentCreated($comment, $task));
        
        // Broadcast notifications
        foreach ($notifications as $notification) {
            Log::info('[Broadcast] Broadcasting NotificationCreated', [
                'notification_id' => $notification->id,
                'user_id' => $notification->user_id,
                'channel' => 'user.' . $notification->user_id
            ]);
            broadcast(new NotificationCreated($notification));
        }
        
        return $comment;
    }

    private function createCommentNotifications(Task $task, TaskComment $comment, int $commenterId): array
    {
        $commenter = $comment->user;
        $notifiedUsers = [];
        $notifications = [];

        // Notify task creator if not the commenter
        if ($task->created_by && $task->created_by !== $commenterId) {
            $notifications[] = Notification::create([
                'user_id' => $task->created_by,
                'type' => 'comment_added',
                'title' => 'New Comment on Task',
                'message' => "{$commenter->name} commented on: {$task->title}",
                'task_id' => $task->id,
                'data' => [
                    'task_title' => $task->title,
                    'commenter_name' => $commenter->name,
                    'comment_preview' => substr($comment->comment, 0, 100),
                ],
            ]);
            $notifiedUsers[] = $task->created_by;
        }

        // Notify assigned user if not the commenter and not already notified
        if ($task->assigned_user_id && 
            $task->assigned_user_id !== $commenterId && 
            !in_array($task->assigned_user_id, $notifiedUsers)) {
            $notifications[] = Notification::create([
                'user_id' => $task->assigned_user_id,
                'type' => 'comment_added',
                'title' => 'New Comment on Your Task',
                'message' => "{$commenter->name} commented on: {$task->title}",
                'task_id' => $task->id,
                'data' => [
                    'task_title' => $task->title,
                    'commenter_name' => $commenter->name,
                    'comment_preview' => substr($comment->comment, 0, 100),
                ],
            ]);
        }

        Log::info('Comment notification created', [
            'task_id' => $task->id,
            'comment_id' => $comment->id,
            'commenter_id' => $commenterId,
        ]);
        
        return $notifications;
    }
}
