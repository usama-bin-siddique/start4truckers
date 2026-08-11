<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Task $task): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Task $task): bool
    {
        // Admin can update any; others can only update tasks assigned to them or created by them
        if ($user->role === 'admin') return true;
        return $task->assigned_to === $user->id || $task->created_by === $user->id;
    }

    public function delete(User $user, Task $task): bool
    {
        if ($user->role === 'admin') return true;
        return $task->created_by === $user->id;
    }
}
