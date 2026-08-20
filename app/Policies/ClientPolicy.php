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
        if ($user->isSalesRep()) {
            return $client->isAssignedTo($user);
        }

        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'sales', 'manager'], true);
    }

    public function update(User $user, Client $client): bool
    {
        if ($user->isSalesRep()) {
            return $client->isAssignedTo($user);
        }

        return in_array($user->role, ['admin', 'sales', 'processing', 'manager'], true);
    }

    public function delete(User $user, Client $client): bool
    {
        return $user->isAdmin();
    }
}
