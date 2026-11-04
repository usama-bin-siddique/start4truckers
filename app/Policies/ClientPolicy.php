<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    public function viewAny(User $user): bool
    {
        return ! $user->isSalesRep();
    }

    public function view(User $user, Client $client): bool
    {
        if ($user->isSalesRep()) {
            return false;
        }

        if ($user->isProcessor()) {
            return $client->isAssignedTo($user) && (
                $client->compliance_type === Client::COMPLIANCE_MONTHLY
                || $client->status !== Client::STATUS_COMPLETED
            );
        }

        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager'], true);
    }

    public function update(User $user, Client $client): bool
    {
        if ($user->isSalesRep()) {
            return false;
        }

        if ($user->isProcessor()) {
            return $this->view($user, $client);
        }

        return in_array($user->role, ['admin', 'manager'], true);
    }

    public function delete(User $user, Client $client): bool
    {
        return $user->isAdmin();
    }
}
