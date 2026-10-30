<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $authUser): bool
    {
        return $authUser->isAdmin() || $authUser->isManager();
    }

    public function view(User $authUser, User $user): bool
    {
        // Admins can view any user; others can only view themselves
        return $authUser->isAdmin() || $authUser->id === $user->id;
    }

    public function create(User $authUser): bool
    {
        return $authUser->isAdmin();
    }

    public function update(User $authUser, User $user): bool
    {
        // Admin can update anyone; others can only update themselves (limited fields)
        return $authUser->isAdmin() || $authUser->id === $user->id;
    }

    public function updateStatus(User $authUser, User $user): bool
    {
        return $authUser->isAdmin();
    }

    public function assignRole(User $authUser, User $user): bool
    {
        return $authUser->isAdmin();
    }

    public function delete(User $authUser, User $user): bool
    {
        return $authUser->isAdmin() && $authUser->id !== $user->id;
    }
}
