<?php

namespace App\Jobs;

use App\Models\JobStatus;
use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ExportTasksToCsv implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $userId;
    public ?string $status;
    public int $jobStatusId;

    public function __construct(int $userId, ?string $status = null, int $jobStatusId = 0)
    {
        $this->userId = $userId;
        $this->status = $status;
        $this->jobStatusId = $jobStatusId;
    }

    public function handle(): void
    {
        try {
            $jobStatus = JobStatus::find($this->jobStatusId);
            if ($jobStatus) {
                $jobStatus->update(['status' => 'processing']);
            }

            $query = Task::query()->with(['assignedUser', 'creator']);
            
            if ($this->status) {
                $query->where('status', $this->status);
            }
            
            $tasks = $query->get();
            $total = $tasks->count();
            
            $filename = 'exports/tasks_export_' . time() . '.csv';
            Storage::makeDirectory('exports');
            
            $file = fopen(Storage::path($filename), 'w');
            
            fputcsv($file, ['ID', 'Title', 'Description', 'Status', 'Priority', 'Assigned To', 'Created By', 'Due Date', 'Created At']);
            
            foreach ($tasks as $index => $task) {
                fputcsv($file, [
                    $task->id,
                    $task->title,
                    $task->description,
                    $task->status,
                    $task->priority,
                    $task->assignedUser?->name,
                    $task->creator?->name,
                    $task->due_date?->format('Y-m-d'),
                    $task->created_at->format('Y-m-d H:i:s'),
                ]);
                
                // Update progress every 10 rows
                if ($jobStatus && ($index + 1) % 10 === 0) {
                    $progress = (int) ((($index + 1) / $total) * 100);
                    $jobStatus->update(['progress' => $progress]);
                }
            }
            
            fclose($file);
            
            if ($jobStatus) {
                $jobStatus->update([
                    'status' => 'completed',
                    'progress' => 100,
                    'result' => ['file_path' => $filename, 'total_rows' => $total],
                    'completed_at' => now(),
                ]);
            }
            
            Log::info('[Job] Export tasks completed', [
                'job_status_id' => $this->jobStatusId,
                'user_id' => $this->userId,
                'total_rows' => $total,
                'file' => $filename,
            ]);
        } catch (\Exception $e) {
            if (isset($jobStatus)) {
                $jobStatus->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
            }
            Log::error('[Job] Export tasks failed', [
                'job_status_id' => $this->jobStatusId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
