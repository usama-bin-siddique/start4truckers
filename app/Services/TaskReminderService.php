<?php

namespace App\Services;

use App\Models\Task;

class TaskReminderService
{
    public function __construct(private NotificationService $notification) {}

    public function sendDue(): int
    {
        $tasks = Task::query()
            ->where('status', '!=', Task::STATUS_COMPLETED)
            ->whereNull('reminder_sent_at')
            ->whereNotNull('reminder_at')
            ->where('reminder_at', '<=', now())
            ->get();

        $count = 0;

        foreach ($tasks as $task) {
            if ($this->notify($task)) {
                $count++;
            }
        }

        return $count;
    }

    public function notify(Task $task): bool
    {
        $userId = $task->assigned_to ?? $task->created_by;

        if (! $userId) {
            $task->update(['reminder_sent_at' => now()]);

            return false;
        }

        $due = $task->due_date?->format('M j, Y g:i A');

        $this->notification->notify($userId, NotificationService::TYPE_TASK_DUE, [
            'task_id'    => $task->id,
            'task_title' => $task->title,
            'due_date'   => $due,
            'message'    => $due
                ? "Deadline for \"{$task->title}\" is {$due}. Please review it."
                : "Please review your task: \"{$task->title}\".",
        ]);

        $task->update(['reminder_sent_at' => now()]);

        return true;
    }
}
