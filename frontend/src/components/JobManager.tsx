import { useState } from 'react';
import { useJobs, useJobStatus, useExportTasks, useBulkUpdateStatus, downloadExportFile, type Job } from '../hooks/useJobs';

interface JobManagerProps {
  selectedTaskIds?: number[];
  onBulkUpdateSuccess?: () => void;
}

// Modern Status Icon Component
const StatusIcon = ({ status }: { status: Job['status'] }) => {
  const icons = {
    pending: (
      <svg className="animate-spin h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    ),
    processing: (
      <svg className="animate-pulse h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    completed: (
      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    failed: (
      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };
  return icons[status] || icons.pending;
};

// Job Type Icon
const JobTypeIcon = ({ type }: { type: Job['type'] }) => {
  if (type === 'export_tasks') {
    return (
      <svg className="h-6 w-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
};

export const JobManager = ({ selectedTaskIds, onBulkUpdateSuccess }: JobManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [bulkStatus, setBulkStatus] = useState<string>('pending');

  const { data: jobsData } = useJobs();
  const { data: activeJob } = useJobStatus(activeJobId);
  const exportTasks = useExportTasks();
  const bulkUpdate = useBulkUpdateStatus();

  const jobs = jobsData?.data || [];

  const handleExport = () => {
    exportTasks.mutate(exportStatus || undefined, {
      onSuccess: (data) => {
        setActiveJobId(data.job_id);
      },
    });
  };

  const handleBulkUpdate = () => {
    if (!selectedTaskIds || selectedTaskIds.length === 0) return;
    
    bulkUpdate.mutate(
      { taskIds: selectedTaskIds, status: bulkStatus },
      {
        onSuccess: (data) => {
          setActiveJobId(data.job_id);
          onBulkUpdateSuccess?.();
        },
      }
    );
  };

  const getStatusStyles = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
      case 'processing':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
      case 'completed':
        return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'failed':
        return 'bg-red-500/20 border-red-500/30 text-red-300';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-300';
    }
  };

  const getProgressColor = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getJobTypeLabel = (type: Job['type']) => {
    switch (type) {
      case 'export_tasks':
        return 'Export CSV';
      case 'bulk_update_status':
        return 'Bulk Update';
      default:
        return type;
    }
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const jobDate = new Date(date);
    const diff = now.getTime() - jobDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Tasks Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-dark-100 border border-gray-700 hover:border-accent/50 transition-all duration-300">
          <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-accent/20 border border-accent/30">
                <svg className="h-6 w-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div>
                <h3 className="text-gray-100 font-semibold text-lg">Export Tasks</h3>
                <p className="text-gray-400 text-sm">Download as CSV file</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={exportStatus}
                onChange={(e) => setExportStatus(e.target.value)}
                className="flex-1 bg-dark-50 border border-gray-600 rounded-xl px-4 py-2.5 text-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={handleExport}
                disabled={exportTasks.isPending}
                className="px-4 py-2.5 bg-accent hover:bg-accent-600 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {exportTasks.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Update Card */}
        <div className={`group relative overflow-hidden rounded-2xl bg-dark-100 border border-gray-700 hover:border-accent/50 transition-all duration-300 ${!selectedTaskIds?.length ? 'opacity-75' : ''}`}>
          <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-accent/20 border border-accent/30">
                <svg className="h-6 w-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="text-gray-100 font-semibold text-lg">Bulk Update</h3>
                <p className="text-gray-400 text-sm">
                  {selectedTaskIds?.length ? `${selectedTaskIds.length} tasks selected` : 'Select tasks to update'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="flex-1 bg-dark-50 border border-gray-600 rounded-xl px-4 py-2.5 text-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                disabled={!selectedTaskIds?.length}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={handleBulkUpdate}
                disabled={bulkUpdate.isPending || !selectedTaskIds?.length}
                className="px-4 py-2.5 bg-accent hover:bg-accent-600 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {bulkUpdate.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Working...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Job Card */}
      {activeJob && (
        <div className="relative overflow-hidden rounded-2xl bg-dark-100 border border-accent/40 animate-in zoom-in-95 duration-300">
          <div className="absolute inset-0 bg-accent/10 animate-pulse" />
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <StatusIcon status={activeJob.status} />
                <div>
                  <h4 className="text-gray-100 font-semibold">{getJobTypeLabel(activeJob.type)}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyles(activeJob.status)} border`}>
                    {activeJob.status}
                  </span>
                </div>
              </div>
              {activeJob.status === 'completed' && activeJob.type === 'export_tasks' && (
                <button
                  onClick={() => downloadExportFile(activeJob.id)}
                  className="group/btn flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-white font-medium rounded-xl transition-all duration-200"
                >
                  <svg className="h-4 w-4 group-hover/btn:animate-bounce" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download</span>
                </button>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Progress</span>
                <span className="font-medium text-gray-200">{activeJob.progress}%</span>
              </div>
              <div className="h-3 bg-dark-50 rounded-full overflow-hidden border border-gray-700">
                <div
                  className={`h-full rounded-full ${getProgressColor(activeJob.status)} transition-all duration-500 ease-out ${activeJob.status === 'processing' ? 'animate-pulse' : ''}`}
                  style={{ width: `${activeJob.progress}%` }}
                >
                </div>
              </div>
              {activeJob.error_message && (
                <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {activeJob.error_message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Job History */}
      <div className="relative rounded-2xl bg-dark-100 border border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <h3 className="text-gray-100 font-semibold flex items-center gap-2">
            <svg className="h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Jobs
          </h3>
          <button
            onClick={() => setIsOpen(true)}
            className="text-sm text-accent hover:text-accent-400 font-medium transition-colors"
          >
            View All ({jobs.length})
          </button>
        </div>
        
        <div className="divide-y divide-gray-700/50">
          {jobs.slice(0, 3).map((job, index) => (
            <div 
              key={job.id} 
              className="group p-4 hover:bg-dark-50/50 transition-colors duration-200 animate-in slide-in-from-left-4 duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <JobTypeIcon type={job.type} />
                  <div>
                    <p className="text-gray-200 font-medium text-sm">{getJobTypeLabel(job.type)}</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(job.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {job.status === 'processing' && (
                    <div className="w-24">
                      <div className="h-1.5 bg-dark-50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getProgressColor(job.status)} transition-all duration-300`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyles(job.status)} border flex items-center gap-1.5`}>
                    <StatusIcon status={job.status} />
                    <span className="capitalize">{job.status}</span>
                  </span>
                </div>
              </div>
              
              {job.status === 'completed' && job.type === 'export_tasks' && (job.result as { file_path?: string })?.file_path && (
                <button
                  onClick={() => downloadExportFile(job.id)}
                  className="mt-3 ml-9 text-sm text-accent hover:text-accent-400 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download file
                </button>
              )}
            </div>
          ))}
          
          {jobs.length === 0 && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-50 border border-gray-700 mb-3">
                <svg className="h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No jobs yet</p>
              <p className="text-gray-500 text-xs mt-1">Create an export or bulk update to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Full History Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-dark-50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-gray-700 animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-700/50 bg-dark-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-100 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent/20 border border-accent/30">
                    <svg className="h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Job History
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-all"
                >
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
              {jobs.map((job, index) => (
                <div 
                  key={job.id}
                  className="group p-4 rounded-xl bg-dark-50 border border-gray-700 hover:border-accent/30 transition-all duration-200 animate-in slide-in-from-right-4 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
                        <JobTypeIcon type={job.type} />
                      </div>
                      <div>
                        <p className="text-gray-100 font-medium">{getJobTypeLabel(job.type)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(job.status)} border flex items-center gap-1`}>
                            <StatusIcon status={job.status} />
                            <span className="capitalize">{job.status}</span>
                          </span>
                          <span className="text-xs text-gray-500">{formatRelativeTime(job.created_at)}</span>
                        </div>
                        {job.status === 'completed' && job.result && (
                          <p className="text-xs text-gray-400 mt-2">
                            {job.type === 'export_tasks' 
                              ? `${(job.result as { total_rows?: number }).total_rows || '?'} rows exported`
                              : `${(job.result as { updated_count?: number }).updated_count || '?'} tasks updated`
                            }
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {job.status === 'completed' && job.type === 'export_tasks' && (job.result as { file_path?: string })?.file_path && (
                      <button
                        onClick={() => downloadExportFile(job.id)}
                        className="p-2.5 rounded-xl bg-accent/20 border border-accent/50 text-accent hover:bg-accent/30 hover:text-accent-300 transition-all"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {job.status === 'processing' && (
                    <div className="mt-3 ml-12">
                      <div className="h-2 bg-dark-100 rounded-full overflow-hidden border border-gray-700">
                        <div
                          className={`h-full rounded-full ${getProgressColor(job.status)} transition-all duration-500 ${job.status === 'processing' ? 'animate-pulse' : ''}`}
                          style={{ width: `${job.progress}%` }}
                        >
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 text-right">{job.progress}% complete</p>
                    </div>
                  )}
                  
                  {job.error_message && (
                    <p className="text-red-400 text-sm mt-3 ml-12 flex items-center gap-2">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {job.error_message}
                    </p>
                  )}
                </div>
              ))}
              
              {jobs.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-dark-50 border border-gray-700 mb-4">
                    <svg className="h-10 w-10 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-400">No jobs in history</p>
                  <p className="text-gray-500 text-sm mt-1">Your recent jobs will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
