export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_user_id: number | null;
  created_by: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assigned_user?: User;
  creator?: User;
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface Attachment {
  id: number;
  task_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  thumbnail_path: string | null;
  uploaded_at: string;
}

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  assigned_user_id?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigned_user_id?: number | null;
  due_date?: string;
}

export interface CreateCommentData {
  comment: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'task_assigned' | 'status_changed' | 'comment_added';
  title: string;
  message: string;
  task_id: number | null;
  data: {
    task_title?: string;
    assigned_by?: string;
    priority?: string;
    commenter_name?: string;
    comment_preview?: string;
    old_status?: string;
    new_status?: string;
    updated_by?: string;
  } | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  status?: 'read' | 'unread';
  page?: number;
  per_page?: number;
}
