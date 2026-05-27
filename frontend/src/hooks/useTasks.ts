import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import type { Task, TaskFilters, PaginatedResponse, CreateTaskData, CreateCommentData } from '../types';

const TASKS_KEY = 'tasks';

export const useTasks = (filters: TaskFilters = {}) => {
  return useQuery({
    queryKey: [TASKS_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      
      const { data } = await api.get<PaginatedResponse<Task>>(`/tasks?${params.toString()}`);
      return data;
    },
  });
};

export const useTask = (id: number | null) => {
  return useQuery({
    queryKey: [TASKS_KEY, id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get<Task>(`/tasks/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      const { data } = await api.post<Task>('/tasks', taskData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateTaskData> }) => {
      const { data: response } = await api.put<Task>(`/tasks/${id}`, data);
      return response;
    },
    onSuccess: () => {
      // Refetch semua task lists untuk memastikan urutan benar
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY], refetchType: 'all' });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/tasks/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, comment }: { taskId: number; comment: CreateCommentData }) => {
      const { data } = await api.post(`/tasks/${taskId}/comments`, comment);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY, variables.taskId] });
    },
  });
};

export const useUploadAttachment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, file, onProgress }: { taskId: number; file: File; onProgress?: (progress: number) => void }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data } = await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY, variables.taskId] });
    },
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ attachmentId, taskId }: { attachmentId: number; taskId: number }) => {
      await api.delete(`/attachments/${attachmentId}`);
      return { attachmentId, taskId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY, variables.taskId] });
    },
  });
};
