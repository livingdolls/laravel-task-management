import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../hooks/useToast';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { disconnectEcho } from '../lib/echo';
import { ToastContainer } from './Toast';
import type { Notification as AppNotification } from '../types';

export const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  
  const { data: unreadCount } = useUnreadCount();
  const { data: notificationsData } = useNotifications({ status: 'unread', per_page: 5 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  
  const notifications = notificationsData?.data || [];
  const { toasts, removeToast, info } = useToast();
  const queryClient = useQueryClient();
  
  // WebSocket listener for real-time notifications
  const handleRealtimeNotification = useCallback((notification: AppNotification) => {
    // Show toast for new notification
    info(
      notification.title,
      notification.data?.task_title || notification.message || 'New notification'
    );
    // Invalidate notifications query to update badge
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [info, queryClient]);
  
  useWebSocket(user?.id, handleRealtimeNotification);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read_at) {
      markAsRead.mutate(notification.id);
    }
    setIsNotifOpen(false);
    if (notification.task_id) {
      // Could navigate to specific task or open task modal
      navigate('/');
    }
  };

  const handleLogout = async () => {
    disconnectEcho();
    await logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-accent-400 text-white border border-accent-300';
      case 'manager':
        return 'bg-accent-300/50 text-accent-50 border border-accent-200';
      default:
        return 'bg-dark-50 text-gray-300 border border-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <header className="bg-dark-50 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Desktop & Mobile Header */}
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="text-lg sm:text-xl font-bold text-gray-100 hover:text-accent transition-colors">
              Task Management
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 rounded-lg hover:bg-dark-100 transition-colors text-gray-400 hover:text-accent"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {(unreadCount ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {(unreadCount ?? 0) > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-dark-50 rounded-lg shadow-xl border border-gray-700 z-50">
                    <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-200">Notifications</h3>
                      {(unreadCount ?? 0) > 0 && (
                        <button
                          onClick={() => markAllAsRead.mutate()}
                          className="text-xs text-accent hover:text-accent-50"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No new notifications</p>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className="w-full text-left p-3 hover:bg-dark-100 border-b border-gray-700 last:border-0 transition-colors"
                          >
                            <p className="font-medium text-sm text-gray-200">{notif.title}</p>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <span className="text-sm text-gray-400">
                Welcome, <span className="text-gray-200">{user?.name}</span>
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRoleBadgeClass(user?.role || '')}`}>
                {user?.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-accent flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-dark-100 transition-colors text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Welcome, <span className="font-medium text-gray-200">{user?.name}</span>
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRoleBadgeClass(user?.role || '')}`}>
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left text-gray-400 hover:text-accent flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};
