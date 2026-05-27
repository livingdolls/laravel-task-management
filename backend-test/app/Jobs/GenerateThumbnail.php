<?php

namespace App\Jobs;

use App\Models\TaskAttachment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class GenerateThumbnail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public TaskAttachment $attachment;

    public function __construct(TaskAttachment $attachment)
    {
        $this->attachment = $attachment;
    }

    public function handle(): void
    {
        if (!Storage::exists($this->attachment->file_path)) {
            return;
        }

        try {
            $manager = new ImageManager(new Driver());
            $image = $manager->read(Storage::path($this->attachment->file_path));
            $image->scale(width: 300);
            
            $thumbnailPath = 'thumbnails/' . uniqid() . '.jpg';
            Storage::makeDirectory('thumbnails');
            $image->save(Storage::path($thumbnailPath), quality: 80);
            
            $this->attachment->update(['thumbnail_path' => $thumbnailPath]);
        } catch (\Exception $e) {
            \Log::error('Thumbnail generation failed', ['error' => $e->getMessage()]);
        }
    }
}
