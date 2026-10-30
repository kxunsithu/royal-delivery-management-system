<?php

namespace App\Policies;

use App\Models\CashHandover;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\User;

class FinancePolicy
{
    public function viewPayments(User $user, string $model): bool
    {
        return $user->isAdmin() || $user->isAccountant() || $user->isDeliveryStaff();
    }

    public function viewExpenses(User $user, string $model): bool
    {
        return $user->isAdmin() || $user->isAccountant();
    }

    public function createExpense(User $user, string $model): bool
    {
        return $user->isAdmin() || $user->isAccountant();
    }

    public function voidExpense(User $user, Expense $expense): bool
    {
        return $user->isAdmin() || $user->isAccountant();
    }

    public function viewHandovers(User $user, string $model): bool
    {
        return $user->isAdmin() || $user->isAccountant() || $user->isDeliveryStaff();
    }

    public function submitHandover(User $user, string $model): bool
    {
        return $user->isDeliveryStaff() || $user->isAdmin();
    }

    public function verifyHandover(User $user, CashHandover $handover): bool
    {
        return $user->isAdmin() || $user->isAccountant();
    }

    public function viewFinancialReports(User $user, string $model): bool
    {
        return $user->isAdmin() || $user->isAccountant();
    }
}
