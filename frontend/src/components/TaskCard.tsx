import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export const TaskCard = ({ task, onClick, selectable, selected, onSelect }: TaskCardProps) => {
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-orange-900/60 text-orange-200 border border-orange-700';
      case 'medium': return 'bg-yellow-900/60 text-yellow-200 border border-yellow-700';
      case 'low': return 'bg-green-900/60 text-green-200 border border-green-700';
      case 'urgent': return 'bg-red-900/60 text-red-200 border border-red-700';
      default: return 'bg-dark-100 text-gray-300 border border-gray-600';
    }
  };

  const getPriorityBarClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      case 'urgent': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-dark-100 text-gray-300 border border-gray-600';
      case 'in_progress': return 'bg-accent-400/30 text-accent border border-accent-300';
      case 'completed': return 'bg-green-900/60 text-green-200 border border-green-700';
      case 'cancelled': return 'bg-red-900/60 text-red-200 border border-red-700';
      default: return 'bg-dark-100 text-gray-300 border border-gray-600';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div
      onClick={(e) => {
        // Don't trigger click when clicking checkbox
        if ((e.target as HTMLElement).tagName !== 'INPUT') {
          onClick();
        }
      }}
      className="bg-dark-50 rounded-lg shadow-lg hover:shadow-accent/20 hover:shadow-xl transition-all duration-200 cursor-pointer border border-gray-700 flex flex-col h-full overflow-hidden group"
    >
      {/* Card Header with Priority Color Bar */}
      <div className={`h-1.5 w-full ${getPriorityBarClass(task.priority)}`}></div>
      
      <div className="p-4 flex flex-col flex-1">
        {/* Header with checkbox and title */}
        <div className="flex items-start gap-2 mb-2">
          {selectable && (
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect?.(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 w-4 h-4 rounded border-gray-600 text-accent focus:ring-accent bg-dark-100"
            />
          )}
          <h3 className="font-semibold text-sm text-gray-100 line-clamp-2 leading-tight group-hover:text-accent transition-colors flex-1">
            {task.title}
          </h3>
        </div>
        
        {/* Description */}
        <p className="text-gray-400 text-xs mb-3 line-clamp-2 flex-1">
          {task.description || 'No description'}
        </p>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getPriorityClass(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusClass(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
        
        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-2 border-t border-gray-700">
          <div className="flex items-center gap-2">
            {task.assigned_user && (
              <span className="flex items-center gap-1" title={`Assigned to: ${task.assigned_user.name}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-accent" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="truncate max-w-[60px] text-gray-300">{task.assigned_user.name.split(' ')[0]}</span>
              </span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-1" title={`Due: ${formatDate(task.due_date)}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-accent" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            {task.comments?.length || 0}
            {(task.attachments?.length ?? 0) > 0 && (
              <>
                <span className="mx-1 text-gray-600">·</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                {task.attachments?.length ?? 0}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
