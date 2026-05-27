import { useQuery, useMutation } from '@tanstack/react-query';
import { api as axios } from '../lib/axios';

export interface Job {
  id: number;
  type: 'export_tasks' | 'bulk_update_status';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  progress: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface PaginatedJobsResponse {
  data: Job[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// List all jobs
export const useJobs = () => {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await axios.get<PaginatedJobsResponse>('/jobs');
      return response.data;
    },
  });
};

// Get single job status
export const useJobStatus = (jobId: number | null) => {
  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const response = await axios.get<{ job: Job }>(`/jobs/${jobId}`);
      return response.data.job;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 2 seconds if job is pending or processing
      if (data && (data.status === 'pending' || data.status === 'processing')) {
        return 2000;
      }
      return false;
    },
    enabled: !!jobId,
  });
};

// Export tasks to CSV
export const useExportTasks = () => {
  return useMutation({
    mutationFn: async (status?: string) => {
      const response = await axios.post<{ message: string; job_id: number }>(
        '/jobs/export-tasks',
        { status }
      );
      return response.data;
    },
  });
};

// Bulk update task status
export const useBulkUpdateStatus = () => {
  return useMutation({
    mutationFn: async ({
      taskIds,
      status,
    }: {
      taskIds: number[];
      status: string;
    }) => {
      const response = await axios.post<{ message: string; job_id: number }>(
        '/jobs/bulk-update-status',
        { task_ids: taskIds, status }
      );
      return response.data;
    },
  });
};

// Download exported file
export const downloadExportFile = async (jobId: number) => {
  const response = await axios.get(`/jobs/${jobId}/download`, {
    responseType: 'blob',
  });
  
  // Create download link
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tasks_export.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
