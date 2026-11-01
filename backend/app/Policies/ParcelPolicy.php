<?php

namespace App\Policies;

use App\Models\Parcel;
use App\Models\User;

class ParcelPolicy
{
    public function viewAny(User $user): bool
    {
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
        return $user->isAdmin() || $user->isManager();
    }

    public function update(User $user, Parcel $parcel): bool
    {
        if ($parcel->isTerminal()) {
            return $user->isAdmin(); // Only admin can edit terminal parcels
        }

        return $user->isAdmin() || $user->isManager();
    }

    public function updateStatus(User $user, Parcel $parcel): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isManager()) {
            // Manager can transition to most statuses except delivery-related
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
        return $user->isAdmin() || $user->isManager();
    }
}
