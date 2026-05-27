<?php

namespace App\Events;

use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskCommentCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public TaskComment $comment;
    public Task $task;

    public function __construct(TaskComment $comment, Task $task)
    {
        $this->comment = $comment;
        $this->task = $task;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('task.' . $this->task->id),
            new PrivateChannel('user.' . $this->task->created_by),
        ];
    }

    public function broadcastAs(): string
    {
        return 'task.comment.created';
    }

    public function broadcastWith(): array
    {
        return [
            'task_id' => $this->task->id,
            'comment_id' => $this->comment->id,
            'comment' => $this->comment->comment,
            'user_id' => $this->comment->user_id,
            'user_name' => $this->comment->user?->name,
            'comments_count' => $this->task->comments()->count(),
            'created_at' => $this->comment->created_at,
        ];
    }
}
