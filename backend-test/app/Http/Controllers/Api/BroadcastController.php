<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

class BroadcastController extends Controller
{
    public function auth(Request $request)
    {
        Log::info('[Broadcast Auth] Request received', [
            'socket_id' => $request->socket_id,
            'channel_name' => $request->channel_name,
            'user_id' => $request->user()?->id,
        ]);

        // Authorize the channel
        $channelName = $request->channel_name;
        
        // Extract user ID from private-user.{id} channel
        if (preg_match('/^private-user\.(\d+)$/', $channelName, $matches)) {
            $channelUserId = $matches[1];
            
            // User can only subscribe to their own channel
            if ((int) $request->user()->id === (int) $channelUserId) {
                $auth = $this->generateAuth($request->socket_id, $channelName);
                Log::info('[Broadcast Auth] Authorized for private channel', ['channel' => $channelName]);
                return response()->json($auth);
            }
            
            Log::warning('[Broadcast Auth] Unauthorized - user mismatch', [
                'user_id' => $request->user()->id,
                'channel_user_id' => $channelUserId,
            ]);
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // Extract task ID from private-task.{id} channel
        if (preg_match('/^private-task\.(\d+)$/', $channelName, $matches)) {
            $taskId = $matches[1];
            $task = \App\Models\Task::find($taskId);
            
            if ($task && (
                $request->user()->id === $task->created_by || 
                $request->user()->id === $task->assigned_user_id ||
                $request->user()->role === 'admin'
            )) {
                $auth = $this->generateAuth($request->socket_id, $channelName);
                Log::info('[Broadcast Auth] Authorized for task channel', ['channel' => $channelName]);
                return response()->json($auth);
            }
            
            Log::warning('[Broadcast Auth] Unauthorized for task channel', ['channel' => $channelName]);
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        Log::warning('[Broadcast Auth] Unknown channel type', ['channel' => $channelName]);
        return response()->json(['error' => 'Unknown channel'], 403);
    }
    
    private function generateAuth(string $socketId, string $channelName): array
    {
        $key = env('REVERB_APP_KEY', 'my-app-key');
        $secret = env('REVERB_APP_SECRET', 'my-app-secret');
        
        $stringToSign = "{$socketId}:{$channelName}";
        $auth = hash_hmac('sha256', $stringToSign, $secret);
        
        return [
            'auth' => "{$key}:{$auth}",
        ];
    }
}
