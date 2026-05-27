<?php

namespace App\Http\Controllers\Api;

use App\Events\NotificationCreated;
use App\Http\Controllers\Controller;
use App\Jobs\SendTaskAssignedNotification;
use App\Models\Notification;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $query = Task::query()->with(['assignedUser', 'creator', 'comments.user']);
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }
        
        if ($request->has('assigned_user_id')) {
            $query->where('assigned_user_id', $request->assigned_user_id);
        }
        
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }
        
        // Validasi sort parameters
        $allowedSortColumns = ['created_at', 'updated_at', 'due_date', 'priority', 'title', 'status'];
        $sortBy = in_array($request->get('sort_by'), $allowedSortColumns) ? $request->get('sort_by') : 'created_at';
        $sortOrder = in_array($request->get('sort_order'), ['asc', 'desc']) ? $request->get('sort_order') : 'desc';
        
        $query->orderBy($sortBy, $sortOrder);
        
        
        if ($sortBy !== 'created_at') {
            $query->orderBy('created_at', 'desc');
        }
       
        $query->orderBy('id', 'desc');
        
        $perPage = $request->get('per_page', 10);
        
        return $query->paginate($perPage);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:pending,in_progress,completed,cancelled',
            'priority' => 'in:low,medium,high,urgent',
            'assigned_user_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
        ]);
        
        $validated['created_by'] = $request->user()->id;
        
        $task = Task::create($validated);
        
        if ($task->assigned_user_id) {
            SendTaskAssignedNotification::dispatch($task);
        }
        
        return $task->load(['assignedUser', 'creator']);
    }

    public function show(Task $task)
    {
        return $task->load(['assignedUser', 'creator', 'comments.user', 'attachments']);
    }

    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:pending,in_progress,completed,cancelled',
            'priority' => 'in:low,medium,high,urgent',
            'assigned_user_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
        ]);
        
        $oldAssignedUserId = $task->assigned_user_id;
        $oldStatus = $task->status;
        
        // Update langsung ke database tanpa mengubah timestamps
        Task::where('id', $task->id)->update($validated);
        
        // Refresh model untuk mendapatkan data terbaru
        $task->refresh();
        
        // Check for assignment change
        if (isset($validated['assigned_user_id']) && $validated['assigned_user_id'] !== $oldAssignedUserId) {
            SendTaskAssignedNotification::dispatch($task);
        }
        
        // Check for status change notification
        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            $this->createStatusChangeNotification($task, $oldStatus, $validated['status'], $request->user());
        }
        
        return $task->load(['assignedUser', 'creator']);
    }

    private function createStatusChangeNotification(Task $task, string $oldStatus, string $newStatus, $updater): void
    {
        $notifications = [];
        
        // Notify task creator if not the updater
        if ($task->created_by && $task->created_by !== $updater->id) {
            $notifications[] = Notification::create([
                'user_id' => $task->created_by,
                'type' => 'status_changed',
                'title' => 'Task Status Updated',
                'message' => "Task '{$task->title}' status changed from {$oldStatus} to {$newStatus}",
                'task_id' => $task->id,
                'data' => [
                    'task_title' => $task->title,
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                    'updated_by' => $updater->name,
                ],
            ]);
        }

        // Notify assigned user if exists and not the updater
        if ($task->assigned_user_id && $task->assigned_user_id !== $updater->id) {
            $notifications[] = Notification::create([
                'user_id' => $task->assigned_user_id,
                'type' => 'status_changed',
                'title' => 'Task Status Updated',
                'message' => "Task '{$task->title}' status changed from {$oldStatus} to {$newStatus}",
                'task_id' => $task->id,
                'data' => [
                    'task_title' => $task->title,
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                    'updated_by' => $updater->name,
                ],
            ]);
        }

        // Broadcast notifications
        foreach ($notifications as $notification) {
            broadcast(new NotificationCreated($notification))->toOthers();
        }

        Log::info('Status change notification created', [
            'task_id' => $task->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
        ]);
    }

    public function destroy(Task $task)
    {
        $task->delete();
        
        return response()->json(['message' => 'Task deleted successfully']);
    }
}
