<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateThumbnail;
use App\Models\Task;
use App\Models\TaskAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function store(Request $request, Task $task)
    {
        $request->validate([
            'file' => 'required|file|max:52428800', // 50MB max
        ]);

        $file = $request->file('file');
        
        $allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'video/mp4', 'video/webm', 'video/avi', 'video/mpeg',
        ];
        
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            return response()->json(['error' => 'File type not allowed'], 422);
        }
        
        $path = $file->store('attachments', 'local');
        
        $attachment = TaskAttachment::create([
            'task_id' => $task->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'uploaded_at' => now(),
        ]);
        
        if (str_starts_with($file->getMimeType(), 'image/')) {
            GenerateThumbnail::dispatch($attachment);
        }
        
        return $attachment;
    }

    public function download(TaskAttachment $attachment)
    {
        if (!Storage::exists($attachment->file_path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        return Storage::download($attachment->file_path, $attachment->file_name);
    }

    public function destroy(TaskAttachment $attachment)
    {
        if (Storage::exists($attachment->file_path)) {
            Storage::delete($attachment->file_path);
        }
        
        if ($attachment->thumbnail_path && Storage::exists($attachment->thumbnail_path)) {
            Storage::delete($attachment->thumbnail_path);
        }
        
        $attachment->delete();
        
        return response()->json(['message' => 'Attachment deleted successfully']);
    }
}
