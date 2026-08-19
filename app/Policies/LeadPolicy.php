<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;

class LeadPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->canAccessPipeline($user);
    }

    public function view(User $user, Lead $lead): bool
    {
        return $this->canManage($user, $lead);
    }

    public function create(User $user): bool
    {
        return $this->canAccessPipeline($user);
    }

    public function update(User $user, Lead $lead): bool
    {
        return $this->canManage($user, $lead);
    }

    public function delete(User $user, Lead $lead): bool
    {
        return $user->isAdmin();
    }

    public function assign(User $user, Lead $lead): bool
    {
        return in_array($user->role, ['admin', 'manager'], true);
    }

    public function convert(User $user, Lead $lead): bool
    {
        return $this->canManage($user, $lead);
    }

    private function canAccessPipeline(User $user): bool
    {
        return in_array($user->role, ['admin', 'sales', 'manager'], true);
    }

    private function canManage(User $user, Lead $lead): bool
    {
        if (! $this->canAccessPipeline($user)) {
            return false;
        }

        if ($user->isSalesRep()) {
            return $lead->isAssignedTo($user);
        }

        return true;
    }
}
