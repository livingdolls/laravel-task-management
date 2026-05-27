<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->notifications();
        
        // Filter by read status
        if ($request->has('status')) {
            if ($request->status === 'unread') {
                $query->unread();
            } elseif ($request->status === 'read') {
                $query->read();
            }
        }
        
        // Order by newest first
        $query->orderBy('created_at', 'desc');
        
        $perPage = $request->get('per_page', 20);
        
        return $query->paginate($perPage);
    }

    public function unreadCount(Request $request)
    {
        $count = $request->user()->notifications()->unread()->count();
        
        return response()->json([
            'unread_count' => $count,
        ]);
    }

    public function markAsRead(Request $request, Notification $notification)
    {
        // Check if notification belongs to current user
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $notification->markAsRead();
        
        return response()->json([
            'message' => 'Notification marked as read',
            'notification' => $notification,
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->notifications()->unread()->update(['read_at' => now()]);
        
        return response()->json([
            'message' => 'All notifications marked as read',
        ]);
    }

    public function destroy(Request $request, Notification $notification)
    {
        // Check if notification belongs to current user
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $notification->delete();
        
        return response()->json([
            'message' => 'Notification deleted successfully',
        ]);
    }
}
