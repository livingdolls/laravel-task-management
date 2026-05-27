<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\BulkUpdateTaskStatus;
use App\Jobs\ExportTasksToCsv;
use App\Models\JobStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class JobController extends Controller
{
    /**
     * Export tasks to CSV
     */
    public function exportTasks(Request $request)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|in:pending,in_progress,completed,cancelled',
        ]);

        $userId = $request->user()->id;
        $status = $validated['status'] ?? null;

        // Create job status record
        $jobStatus = JobStatus::create([
            'user_id' => $userId,
            'type' => 'export_tasks',
            'status' => 'pending',
            'payload' => ['status' => $status],
        ]);

        // Dispatch job
        ExportTasksToCsv::dispatch($userId, $status, $jobStatus->id);

        Log::info('[Job] Export tasks job dispatched', [
            'job_id' => $jobStatus->id,
            'user_id' => $userId,
            'filter_status' => $status,
        ]);

        return response()->json([
            'message' => 'Export job started',
            'job_id' => $jobStatus->id,
        ]);
    }

    /**
     * Bulk update task status
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'task_ids' => 'required|array|min:1',
            'task_ids.*' => 'integer|exists:tasks,id',
            'status' => 'required|string|in:pending,in_progress,completed,cancelled',
        ]);

        $userId = $request->user()->id;

        // Create job status record
        $jobStatus = JobStatus::create([
            'user_id' => $userId,
            'type' => 'bulk_update_status',
            'status' => 'pending',
            'payload' => [
                'task_count' => count($validated['task_ids']),
                'new_status' => $validated['status'],
            ],
        ]);

        // Dispatch job
        BulkUpdateTaskStatus::dispatch($validated['task_ids'], $validated['status'], $jobStatus->id);

        Log::info('[Job] Bulk update job dispatched', [
            'job_id' => $jobStatus->id,
            'task_count' => count($validated['task_ids']),
            'new_status' => $validated['status'],
        ]);

        return response()->json([
            'message' => 'Bulk update job started',
            'job_id' => $jobStatus->id,
        ]);
    }

    /**
     * Get job status
     */
    public function getJobStatus(Request $request, int $jobId)
    {
        $jobStatus = JobStatus::where('id', $jobId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return response()->json([
            'job' => [
                'id' => $jobStatus->id,
                'type' => $jobStatus->type,
                'status' => $jobStatus->status,
                'payload' => $jobStatus->payload,
                'result' => $jobStatus->result,
                'progress' => $jobStatus->progress,
                'created_at' => $jobStatus->created_at,
                'updated_at' => $jobStatus->updated_at,
                'completed_at' => $jobStatus->completed_at,
            ],
        ]);
    }

    /**
     * List user's jobs
     */
    public function listJobs(Request $request)
    {
        $jobs = JobStatus::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $jobs->items(),
            'meta' => [
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
                'per_page' => $jobs->perPage(),
                'total' => $jobs->total(),
            ],
        ]);
    }

    /**
     * Download export file
     */
    public function downloadExport(Request $request, int $jobId)
    {
        $jobStatus = JobStatus::where('id', $jobId)
            ->where('user_id', $request->user()->id)
            ->where('type', 'export_tasks')
            ->where('status', 'completed')
            ->firstOrFail();

        if (!isset($jobStatus->result['file_path'])) {
            return response()->json(['error' => 'File not found'], 404);
        }

        $filePath = $jobStatus->result['file_path'];

        if (!Storage::exists($filePath)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        return Storage::download($filePath, 'tasks_export.csv');
    }
}
