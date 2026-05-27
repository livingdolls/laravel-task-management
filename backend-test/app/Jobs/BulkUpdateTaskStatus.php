<?php

namespace App\Jobs;

use App\Models\JobStatus;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BulkUpdateTaskStatus implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public array $taskIds;
    public string $status;
    public int $jobStatusId;

    public function __construct(array $taskIds, string $status, int $jobStatusId = 0)
    {
        $this->taskIds = $taskIds;
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

            $count = DB::table('tasks')
                ->whereIn('id', $this->taskIds)
                ->update(['status' => $this->status, 'updated_at' => now()]);
            
            if ($jobStatus) {
                $jobStatus->update([
                    'status' => 'completed',
                    'progress' => 100,
                    'result' => [
                        'updated_count' => $count,
                        'task_ids' => $this->taskIds,
                        'new_status' => $this->status,
                    ],
                    'completed_at' => now(),
                ]);
            }
            
            Log::info('[Job] Bulk task status update completed', [
                'job_status_id' => $this->jobStatusId,
                'task_count' => $count,
                'new_status' => $this->status,
            ]);
        } catch (\Exception $e) {
            if (isset($jobStatus)) {
                $jobStatus->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
            }
            Log::error('[Job] Bulk task status update failed', [
                'job_status_id' => $this->jobStatusId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
