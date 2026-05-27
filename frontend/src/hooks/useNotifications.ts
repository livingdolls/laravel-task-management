import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import type { Notification, NotificationFilters, PaginatedResponse } from '../types';

const NOTIFICATIONS_KEY = 'notifications';

export const useNotifications = (filters: NotificationFilters = {}) => {
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      
      const { data } = await api.get<PaginatedResponse<Notification>>(`/notifications?${params.toString()}`);
      return data;
    },
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get<{ unread_count: number }>('/notifications/unread-count');
      return data.unread_count;
    },
    // WebSocket handles real-time updates, no polling needed
    staleTime: Infinity,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const { data } = await api.post(`/notifications/${notificationId}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/notifications/mark-all-read');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const { data } = await api.delete(`/notifications/${notificationId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });
};
