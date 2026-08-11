<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;

class LeadPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'sales']);
    }

    public function view(User $user, Lead $lead): bool
    {
        return in_array($user->role, ['admin', 'sales']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'sales']);
    }

    public function update(User $user, Lead $lead): bool
    {
        return in_array($user->role, ['admin', 'sales']);
    }

    public function delete(User $user, Lead $lead): bool
    {
        return $user->role === 'admin';
    }

    public function assign(User $user, Lead $lead): bool
    {
        return in_array($user->role, ['admin', 'sales']);
    }

    public function convert(User $user, Lead $lead): bool
    {
        return in_array($user->role, ['admin', 'sales']);
    }
}
