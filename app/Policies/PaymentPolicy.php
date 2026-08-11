<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'sales']);
    }

    public function view(User $user, Payment $payment): bool
    {
        return in_array($user->role, ['admin', 'sales']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'sales']);
    }

    public function update(User $user, Payment $payment): bool
    {
        return in_array($user->role, ['admin', 'sales']);
    }

    public function delete(User $user, Payment $payment): bool
    {
        return $user->role === 'admin';
    }
}
