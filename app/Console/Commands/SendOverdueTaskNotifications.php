<?php

namespace App\Console\Commands;

use App\Models\MessageGroup;
use App\Notifications\TaskOverdue;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class SendOverdueTaskNotifications extends Command
{
    protected $signature = 'tasks:send-overdue-notifications';
    protected $description = 'Send notifications for overdue tasks';

    public function handle()
    {
        $this->info('Checking for overdue tasks...');

        // Get all overdue tasks that are still open or in progress
        $overdueTasks = MessageGroup::whereIn('status', ['open', 'in_progress'])
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->with(['assignedUser'])
            ->get();

        $notificationCount = 0;

        foreach ($overdueTasks as $task) {
            if ($task->assignedUser) {
                // Send notification to assigned user
                $task->assignedUser->notify(new TaskOverdue($task));
                $notificationCount++;
                
                $this->line("Sent overdue notification for task: {$task->name} to {$task->assignedUser->name}");
            }
        }

        $this->info("Sent {$notificationCount} overdue task notifications.");
        
        return Command::SUCCESS;
    }
}