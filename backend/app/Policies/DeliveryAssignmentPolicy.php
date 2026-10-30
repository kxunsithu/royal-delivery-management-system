<?php

namespace App\Policies;

use App\Models\DeliveryAssignment;
use App\Models\User;

class DeliveryAssignmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isManager();
    }

    public function view(User $user, DeliveryAssignment $assignment): bool
    {
        if ($user->isAdmin() || $user->isManager()) {
            return true;
        }

        return $user->isDeliveryStaff() && $assignment->staff_id === $user->id;
    }

    public function recordAttempt(User $user, DeliveryAssignment $assignment): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Delivery staff can only record for their own active assignments
        return $user->isDeliveryStaff()
            && $assignment->staff_id === $user->id
            && $assignment->status === 'ACTIVE';
    }

    public function viewWorkload(User $user): bool
    {
        return $user->isAdmin() || $user->isManager();
    }
}
