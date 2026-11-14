<?php

namespace App\Policies;

use App\Models\DeliveryAssignment;
use App\Models\User;

class DeliveryAssignmentPolicy
{
    public function viewAny(User $user): bool
    {
        // admin, manager, and accountant can view all assignments
        return $user->isAdmin() || $user->isManager() || $user->isAccountant();
    }

    public function view(User $user, DeliveryAssignment $assignment): bool
    {
        if ($user->isAdmin() || $user->isManager() || $user->isAccountant()) {
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
            && !in_array($assignment->status, ['COMPLETED', 'FAILED', 'REASSIGNED']);
    }

    public function uploadProof(User $user, DeliveryAssignment $assignment): bool
    {
        if ($user->isAdmin() || $user->isManager()) {
            return true;
        }

        // Delivery staff can upload proof for their assigned delivery
        // (even if marked COMPLETED, since recording attempt updates status first)
        return $user->isDeliveryStaff() && $assignment->staff_id === $user->id;
    }

    public function viewWorkload(User $user): bool
    {
        return $user->isAdmin() || $user->isManager();
    }
}
