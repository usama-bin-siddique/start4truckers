<?php

namespace App\Policies;

use App\Models\ClientService;
use App\Models\User;

class OperationPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'processing']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'processing']);
    }

    public function update(User $user, ClientService $clientService): bool
    {
        return in_array($user->role, ['admin', 'processing']);
    }
}
