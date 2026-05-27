<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\TaskComment;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $users = User::all();
        $admin = $users->where('role', 'admin')->first();
        $managers = $users->where('role', 'manager');
        $regularUsers = $users->where('role', 'user');
        
        $statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        $priorities = ['low', 'medium', 'high', 'urgent'];
        
        $taskTitles = [
            'Review quarterly reports',
            'Update website content',
            'Fix login bug',
            'Implement new feature',
            'Client meeting preparation',
            'Database optimization',
            'Code review session',
            'Write documentation',
            'Server maintenance',
            'Security audit',
            'Design new landing page',
            'Mobile app testing',
            'API integration',
            'User feedback analysis',
            'Marketing campaign setup',
        ];
        
        foreach ($taskTitles as $index => $title) {
            $assignedUser = $regularUsers->random();
            $createdBy = $managers->random();
            
            $task = Task::create([
                'title' => $title,
                'description' => 'Detailed description for ' . $title,
                'status' => $statuses[array_rand($statuses)],
                'priority' => $priorities[array_rand($priorities)],
                'assigned_user_id' => $assignedUser->id,
                'created_by' => $createdBy->id,
                'due_date' => now()->addDays(rand(1, 30)),
            ]);
            
            // Add comments
            $commentCount = rand(0, 3);
            for ($i = 0; $i < $commentCount; $i++) {
                TaskComment::create([
                    'task_id' => $task->id,
                    'user_id' => $users->random()->id,
                    'comment' => 'This is comment ' . ($i + 1) . ' for task: ' . $title,
                ]);
            }
        }
        
        // Add more comments to some tasks
        $tasks = Task::all();
        foreach ($tasks->random(min(5, count($tasks))) as $task) {
            TaskComment::create([
                'task_id' => $task->id,
                'user_id' => $users->random()->id,
                'comment' => 'Additional feedback on this task.',
            ]);
        }
    }
}
