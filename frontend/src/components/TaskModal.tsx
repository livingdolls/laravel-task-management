import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateTask, useUpdateTask, useDeleteTask, useAddComment, useUploadAttachment, useDeleteAttachment, useTask } from '../hooks/useTasks';
import type { Task } from '../types';

interface TaskModalProps {
  mode: 'create' | 'detail' | 'edit';
  task?: Task;
  onClose: () => void;
}

export const TaskModal = ({ mode, task, onClose }: TaskModalProps) => {
  const isCreate = mode === 'create';
  const [isEditMode, setIsEditMode] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: taskDetail, refetch } = useTask(task?.id || null);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addComment = useAddComment();
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  const currentTask = taskDetail || task;
  
  // WebSocket listener for real-time comments
  useEffect(() => {
    if (!task?.id || !taskDetail) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Dynamically import Pusher
    import('pusher-js').then((PusherModule) => {
      const Pusher = PusherModule.default;
      const key = import.meta.env.VITE_REVERB_APP_KEY || 'my-app-key';
      const host = import.meta.env.VITE_REVERB_HOST || 'localhost';
      const port = parseInt(import.meta.env.VITE_REVERB_PORT || '8080');
      
      const pusher = new Pusher(key, {
        cluster: 'mt1',
        wsHost: host,
        wsPort: port,
        wssPort: port,
        enabledTransports: ['ws'],
        forceTLS: false,
        disableStats: true,
        authEndpoint: `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/broadcasting/auth`,
        auth: {
          headers: { Authorization: `Bearer ${token}` },
        },
      });
      
      const channelName = `private-task.${task.id}`;
      console.log('[WebSocket] TaskModal subscribing to:', channelName);
      
      const channel = pusher.subscribe(channelName);
      
      channel.bind('pusher:subscription_succeeded', () => {
        console.log('[WebSocket] Task channel subscription succeeded:', channelName);
      });
      
      channel.bind('pusher:subscription_error', (err: unknown) => {
        console.log('[WebSocket] Task channel subscription error:', err);
      });
      
      channel.bind('task.comment.created', (event: { task_id: number }) => {
        console.log('[WebSocket] task.comment.created received:', event);
        if (event.task_id === task.id) {
          // Refetch task to show new comment
          queryClient.invalidateQueries({ queryKey: ['tasks', task.id] });
          // Also refetch comments list
          queryClient.invalidateQueries({ queryKey: ['tasks', task.id, 'comments'] });
        }
      });
      
      // Listen to all events for debug
      channel.bind_global((eventName: string, event: unknown) => {
        console.log('[WebSocket] Task channel all events:', eventName, event);
      });
      
      return () => {
        console.log('[WebSocket] TaskModal unsubscribing from:', channelName);
        pusher.unsubscribe(channelName);
        pusher.disconnect();
      };
    });
  }, [task?.id, taskDetail, queryClient]);
  
  const commentsRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'pending',
    priority: task?.priority || 'medium',
    assigned_user_id: task?.assigned_user_id || '',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
  });

  // Auto-scroll to bottom when comments change
  useEffect(() => {
    if (commentsRef.current && currentTask?.comments?.length) {
      commentsRef.current.scrollTop = commentsRef.current.scrollHeight;
    }
  }, [currentTask?.comments?.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      assigned_user_id: formData.assigned_user_id ? Number(formData.assigned_user_id) : null,
    };
    
    if (isCreate) {
      await createTask.mutateAsync(data);
      onClose();
    } else if (task) {
      await updateTask.mutateAsync({ id: task.id, data });
      setIsEditMode(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm('Are you sure you want to delete this task?')) return;
    await deleteTask.mutateAsync(task.id);
    onClose();
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;
    await addComment.mutateAsync({ taskId: task.id, comment: { comment: newComment } });
    setNewComment('');
    refetch();
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !task) return;
    
    setUploadProgress(0);
    
    try {
      await uploadAttachment.mutateAsync({
        taskId: task.id,
        file,
        onProgress: (progress) => setUploadProgress(progress),
      });
      refetch();
    } catch {
      setUploadProgress(0);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFileUpload(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && task) {
      await handleFileUpload(files[0]);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm('Delete this attachment?')) return;
    await deleteAttachment.mutateAsync({ attachmentId, taskId: task?.id || 0 });
    refetch();
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString();
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isEditing = isCreate || isEditMode;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-50 rounded-lg shadow-2xl shadow-accent/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-100">
              {isCreate ? 'Create New Task' : isEditMode ? 'Edit Task' : currentTask?.title}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-accent transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field bg-dark-100 border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field bg-dark-100 border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-accent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pending' | 'in_progress' | 'completed' | 'cancelled' })}
                    className="input-field bg-dark-100 border-gray-600 text-gray-100 focus:ring-accent"
                  >
                    <option value="pending" className="bg-dark-100">Pending</option>
                    <option value="in_progress" className="bg-dark-100">In Progress</option>
                    <option value="completed" className="bg-dark-100">Completed</option>
                    <option value="cancelled" className="bg-dark-100">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                    className="input-field bg-dark-100 border-gray-600 text-gray-100 focus:ring-accent"
                  >
                    <option value="low" className="bg-dark-100">Low</option>
                    <option value="medium" className="bg-dark-100">Medium</option>
                    <option value="high" className="bg-dark-100">High</option>
                    <option value="urgent" className="bg-dark-100">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Assigned To</label>
                <select
                  value={formData.assigned_user_id}
                  onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                  className="input-field bg-dark-100 border-gray-600 text-gray-100 focus:ring-accent"
                >
                  <option value="" className="bg-dark-100">Unassigned</option>
                  {[1, 2, 3, 4, 5, 6, 7].map(id => (
                    <option key={id} value={id} className="bg-dark-100">User {id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="input-field bg-dark-100 border-gray-600 text-gray-100 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => isCreate ? onClose() : setIsEditMode(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createTask.isPending || updateTask.isPending}>
                  {createTask.isPending || updateTask.isPending ? 'Saving...' : isCreate ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Task Details */}
              <div className="flex gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${
                  currentTask?.priority === 'high' ? 'bg-orange-900/60 text-orange-200 border-orange-700' :
                  currentTask?.priority === 'medium' ? 'bg-yellow-900/60 text-yellow-200 border-yellow-700' :
                  currentTask?.priority === 'low' ? 'bg-green-900/60 text-green-200 border-green-700' :
                  currentTask?.priority === 'urgent' ? 'bg-red-900/60 text-red-200 border-red-700' :
                  'bg-dark-100 text-gray-300 border-gray-600'
                }`}>
                  {currentTask?.priority}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${
                  currentTask?.status === 'pending' ? 'bg-dark-100 text-gray-300 border-gray-600' :
                  currentTask?.status === 'in_progress' ? 'bg-accent-400/30 text-accent border-accent-300' :
                  currentTask?.status === 'completed' ? 'bg-green-900/60 text-green-200 border-green-700' :
                  currentTask?.status === 'cancelled' ? 'bg-red-900/60 text-red-200 border-red-700' :
                  'bg-dark-100 text-gray-300 border-gray-600'
                }`}>
                  {currentTask?.status?.replace('_', ' ')}
                </span>
              </div>

              <p className="text-gray-400">{currentTask?.description || 'No description'}</p>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                <div><span className="text-gray-500">Assigned to:</span> {currentTask?.assigned_user?.name || 'Unassigned'}</div>
                <div><span className="text-gray-500">Created by:</span> {currentTask?.creator?.name}</div>
                {currentTask?.due_date && <div><span className="text-gray-500">Due date:</span> {formatDate(currentTask.due_date)}</div>}
                <div><span className="text-gray-500">Created:</span> {formatDate(currentTask?.created_at || '')}</div>
              </div>

              {/* Attachments */}
              <div>
                <h3 className="font-semibold mb-2 text-gray-200">Attachments</h3>
                
                {/* Upload Progress */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Uploading...</span>
                      <span className="text-accent font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-dark-100 rounded-full h-2.5">
                      <div
                        className="bg-accent h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-4 text-center mb-2 transition-colors ${
                    isDragOver
                      ? 'border-accent bg-accent-400/10'
                      : 'border-gray-600 bg-dark-100'
                  } ${uploadProgress > 0 && uploadProgress < 100 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <label className={`cursor-pointer ${isDragOver ? 'text-accent' : 'text-accent hover:text-accent-50'}`}>
                    {isDragOver ? (
                      <span className="font-semibold">Drop file here</span>
                    ) : (
                      <>
                        <span className="font-semibold">Click to upload</span>
                        <span className="text-gray-500 block text-sm mt-1">or drag and drop</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileInputChange}
                      disabled={uploadProgress > 0 && uploadProgress < 100}
                    />
                  </label>
                </div>
                
                {currentTask?.attachments?.map((att) => (
                  <div key={att.id} className="flex justify-between items-center p-2 bg-dark-100 rounded mb-1 border border-gray-700">
                    <span className="text-sm text-gray-300">{att.file_name} ({formatFileSize(att.file_size)})</span>
                    <div className="flex gap-2">
                      <a
                        href={`http://localhost:8000/api/attachments/${att.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:text-accent-50 text-sm transition-colors"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="text-red-400 hover:text-red-300 text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comments */}
              <div>
                <h3 className="font-semibold mb-2 text-gray-200 flex items-center gap-2">
                  Comments
                  {currentTask?.comments && currentTask.comments.length > 0 && (
                    <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full">
                      {currentTask.comments.length}
                    </span>
                  )}
                </h3>
                <div ref={commentsRef} className="max-h-60 overflow-y-auto space-y-2 mb-4 scroll-smooth">
                  {currentTask?.comments?.map((comment) => (
                    <div key={comment.id} className="p-3 bg-dark-100 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-gray-200">{comment.user?.name}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-300">{comment.comment}</p>
                    </div>
                  ))}
                  {!currentTask?.comments?.length && (
                    <p className="text-gray-500 text-center py-4">No comments yet</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="input-field flex-1 bg-dark-100 border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-accent"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="btn-primary"
                  >
                    Send
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setIsEditMode(true)} className="btn-secondary">
                  Edit
                </button>
                <button onClick={handleDelete} className="btn-danger" disabled={deleteTask.isPending}>
                  {deleteTask.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
