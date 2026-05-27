<?php

namespace App\Jobs;

use App\Events\NotificationCreated;
use App\Models\Notification;
use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTaskAssignedNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public Task $task;

    public function __construct(Task $task)
    {
        $this->task = $task;
    }

    public function handle(): void
    {
        if (!$this->task->assigned_user_id) {
            return;
        }

        $assignedUser = User::find($this->task->assigned_user_id);
        $creator = User::find($this->task->created_by);

        if (!$assignedUser) {
            return;
        }

        // Create notification
        $notification = Notification::create([
            'user_id' => $assignedUser->id,
            'type' => 'task_assigned',
            'title' => 'New Task Assigned',
            'message' => "You have been assigned to task: {$this->task->title}",
            'task_id' => $this->task->id,
            'data' => [
                'task_title' => $this->task->title,
                'assigned_by' => $creator?->name ?? 'System',
                'priority' => $this->task->priority,
            ],
        ]);
        
        // Broadcast notification
        broadcast(new NotificationCreated($notification))->toOthers();

        Log::info('Task assigned notification created', [
            'task_id' => $this->task->id,
            'assigned_user_id' => $this->task->assigned_user_id,
            'title' => $this->task->title,
        ]);
    }
}
