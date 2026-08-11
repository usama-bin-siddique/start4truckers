<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // all roles
    }

    public function view(User $user, Client $client): bool
    {
        return true; // all roles
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'sales']);
    }

    public function update(User $user, Client $client): bool
    {
        return in_array($user->role, ['admin', 'sales', 'processing']);
    }

    public function delete(User $user, Client $client): bool
    {
        return $user->role === 'admin';
    }
}
