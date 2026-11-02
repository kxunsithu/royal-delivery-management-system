<?php

namespace App\Providers;

use App\Models\ActivityLog;
use App\Models\BusinessSetting;
use App\Models\DeliveryArea;
use App\Models\DeliveryAssignment;
use App\Models\Parcel;
use App\Models\User;
use App\Policies\DeliveryAssignmentPolicy;
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
