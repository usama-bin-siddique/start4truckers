<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager'], true);
    }

    public function view(User $user, Payment $payment): bool
    {
        return $payment->isVisibleTo($user);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager'], true);
    }

    public function update(User $user, Payment $payment): bool
    {
        return $this->view($user, $payment);
    }

    public function delete(User $user, Payment $payment): bool
    {
        return $user->isAdmin();
    }
}
