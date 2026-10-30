<?php

namespace App\Providers;

use App\Models\ActivityLog;
use App\Models\BusinessSetting;
use App\Models\CashHandover;
use App\Models\DeliveryArea;
use App\Models\DeliveryAssignment;
use App\Models\Expense;
use App\Models\Parcel;
use App\Models\Payment;
use App\Models\User;
use App\Policies\DeliveryAssignmentPolicy;
use App\Policies\FinancePolicy;
use App\Policies\ParcelPolicy;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register model policies
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Parcel::class, ParcelPolicy::class);
        Gate::policy(DeliveryAssignment::class, DeliveryAssignmentPolicy::class);

        // Finance policies using a single policy class with multiple abilities
        Gate::define('viewPayments', [FinancePolicy::class, 'viewPayments']);
        Gate::define('viewExpenses', [FinancePolicy::class, 'viewExpenses']);
        Gate::define('createExpense', [FinancePolicy::class, 'createExpense']);
        Gate::define('voidExpense', [FinancePolicy::class, 'voidExpense']);
        Gate::define('viewHandovers', [FinancePolicy::class, 'viewHandovers']);
        Gate::define('submitHandover', [FinancePolicy::class, 'submitHandover']);
        Gate::define('verifyHandover', [FinancePolicy::class, 'verifyHandover']);
        Gate::define('viewFinancialReports', [FinancePolicy::class, 'viewFinancialReports']);

        // Settings — authorize('update', BusinessSetting::class) or instance
        Gate::define('update', function (User $user, $model) {
            if ($model instanceof BusinessSetting || $model === BusinessSetting::class) {
                return $user->isAdmin();
            }
            return false;
        });

        Gate::define('manageDeliveryAreas', function (User $user) {
            return $user->isAdmin() || $user->isManager();
        });

        Gate::define('viewAuditLogs', function (User $user) {
            return $user->isAdmin();
        });
    }
}
