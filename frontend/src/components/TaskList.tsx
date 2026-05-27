import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTasks } from '../hooks/useTasks';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { JobManager } from './JobManager';
import type { Task } from '../types';

export const TaskList = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    sort_by: 'created_at',
    sort_order: 'desc' as 'asc' | 'desc',
    page: 1,
    per_page: 10,
  });
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [showJobManager, setShowJobManager] = useState(false);
  
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useTasks(filters);

  const handleTaskSelect = (taskId: number, selected: boolean) => {
    setSelectedTaskIds(prev => 
      selected 
        ? [...prev, taskId]
        : prev.filter(id => id !== taskId)
    );
  };

  const handleBulkUpdateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    setSelectedTaskIds([]);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }));
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, priority: e.target.value, page: 1 }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, sort_by: e.target.value }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Error loading tasks. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card bg-dark-50 border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="flex-1 w-full lg:min-w-[200px]">
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={handleSearchChange}
              className="input-field w-full bg-dark-100 border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-accent"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <select
              value={filters.status}
              onChange={handleStatusChange}
              className="input-field w-full sm:w-auto bg-dark-100 border-gray-600 text-gray-100 focus:ring-accent"
            >
              <option value="" className="bg-dark-100">All Status</option>
              <option value="pending" className="bg-dark-100">Pending</option>
              <option value="in_progress" className="bg-dark-100">In Progress</option>
              <option value="completed" className="bg-dark-100">Completed</option>
              <option value="cancelled" className="bg-dark-100">Cancelled</option>
            </select>
            
            <select
              value={filters.priority}
              onChange={handlePriorityChange}
              className="input-field w-full sm:w-auto bg-dark-100 border-gray-600 text-gray-100 focus:ring-accent"
            >
              <option value="" className="bg-dark-100">All Priority</option>
              <option value="low" className="bg-dark-100">Low</option>
              <option value="medium" className="bg-dark-100">Medium</option>
              <option value="high" className="bg-dark-100">High</option>
              <option value="urgent" className="bg-dark-100">Urgent</option>
            </select>
            
            <select
              value={filters.sort_by}
              onChange={handleSortChange}
              className="input-field w-full sm:w-auto bg-dark-100 border-gray-600 text-gray-100 focus:ring-accent"
            >
              <option value="created_at" className="bg-dark-100">Sort by Created</option>
              <option value="due_date" className="bg-dark-100">Sort by Due Date</option>
              <option value="priority" className="bg-dark-100">Sort by Priority</option>
            </select>
          </div>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary w-full lg:w-auto whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Task
          </button>
          
          <button
            onClick={() => setShowJobManager(!showJobManager)}
            className="btn-secondary w-full lg:w-auto whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Jobs
          </button>
        </div>
      </div>
      
      {/* Job Manager */}
      {showJobManager && (
        <JobManager 
          selectedTaskIds={selectedTaskIds}
          onBulkUpdateSuccess={handleBulkUpdateSuccess}
        />
      )}

      {/* Task Grid - 4 cards per row */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        </div>
      ) : data?.data.length === 0 ? (
        <div className="card bg-dark-50 border-gray-700 text-center py-12">
          <p className="text-gray-400">No tasks found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.data.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => setSelectedTask(task)}
              selectable={showJobManager}
              selected={selectedTaskIds.includes(task.id)}
              onSelect={(selected) => handleTaskSelect(task.id, selected)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.last_page > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page === 1}
            className="px-3 py-1 border border-gray-600 rounded bg-dark-50 text-gray-300 hover:bg-dark-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-gray-400">
            Page {filters.page} of {data.last_page}
          </span>
          <button
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page === data.last_page}
            className="px-3 py-1 border border-gray-600 rounded bg-dark-50 text-gray-300 hover:bg-dark-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <TaskModal
          mode="create"
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
      
      {selectedTask && (
        <TaskModal
          mode="detail"
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};
