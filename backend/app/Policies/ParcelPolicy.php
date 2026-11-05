<?php

namespace App\Policies;

use App\Models\Parcel;
use App\Models\User;

class ParcelPolicy
{
    public function viewAny(User $user): bool
    {
        // admin, manager, accountant can list parcels
        return $user->isAdmin() || $user->isManager() || $user->isAccountant();
        // Delivery staff view parcels through the delivery assignments endpoint
    }

    public function view(User $user, Parcel $parcel): bool
    {
        if ($user->isAdmin() || $user->isManager() || $user->isAccountant()) {
            return true;
        }

        // Delivery staff can view parcels assigned to them (including completed assignments)
        if ($user->isDeliveryStaff()) {
            return $parcel->deliveryAssignments()
                ->where('staff_id', $user->id)
                ->exists();
        }

        return false;
    }

    public function create(User $user): bool
    {
        // Only admin and manager can create parcels — accountant CANNOT
        return $user->isAdmin() || $user->isManager();
    }

    public function update(User $user, Parcel $parcel): bool
    {
        if ($parcel->isTerminal()) {
            return $user->isAdmin(); // Only admin can edit terminal parcels
        }

        // Only admin and manager can edit parcels — accountant CANNOT
        return $user->isAdmin() || $user->isManager();
    }

    public function updateStatus(User $user, Parcel $parcel): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Manager can change status (except IN_TRANSIT which is auto-set)
        if ($user->isManager()) {
            return !in_array($parcel->status, ['IN_TRANSIT']);
        }

        // Accountant can change status (same as manager — except IN_TRANSIT)
        if ($user->isAccountant()) {
            return !in_array($parcel->status, ['IN_TRANSIT']);
        }

        if ($user->isDeliveryStaff()) {
            // Staff can mark as out for delivery and delivery-related transitions
            return in_array($parcel->status, ['IN_TRANSIT']);
        }

        return false;
    }

    public function assign(User $user, Parcel $parcel): bool
    {
        // Manager CANNOT assign — only admin and accountant can
        return $user->isAdmin() || $user->isAccountant();
    }

    public function delete(User $user, Parcel $parcel): bool
    {
        // Only admin and manager can delete — accountant CANNOT
        return $user->isAdmin() || $user->isManager();
    }
}
