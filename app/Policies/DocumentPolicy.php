<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // all roles can view
    }

    public function view(User $user, Document $document): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'sales', 'processing']);
    }

    public function delete(User $user, Document $document): bool
    {
        return in_array($user->role, ['admin', 'processing']);
    }
}
