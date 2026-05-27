<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('task.{id}', function ($user, $id) {
    // Allow access if user is task creator, assigned user, or admin
    $task = \App\Models\Task::find($id);
    
    if (!$task) {
        return false;
    }
    
    return $user->id === $task->created_by || 
           $user->id === $task->assigned_user_id ||
           $user->role === 'admin';
});
