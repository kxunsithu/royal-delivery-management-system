<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DeliveryController;
use App\Http\Controllers\Api\V1\FinanceController;
use App\Http\Controllers\Api\V1\ParcelController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ─── Public Routes ────────────────────────────────────────────────────────────
Route::prefix('v1')->group(function () {

    // Auth
    Route::post('/auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');

    // ─── Protected Routes ──────────────────────────────────────────────────────
    Route::middleware(['auth:sanctum'])->group(function () {

        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Users
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::patch('/users/{user}/status', [UserController::class, 'updateStatus']);
        Route::post('/users/{user}/profile-image', [UserController::class, 'uploadProfileImage']);
        Route::delete('/users/{user}/profile-image', [UserController::class, 'deleteProfileImage']);

        // Parcels
        Route::get('/parcels', [ParcelController::class, 'index']);
        Route::post('/parcels', [ParcelController::class, 'store']);
        Route::get('/parcels/{parcel}', [ParcelController::class, 'show']);
        Route::put('/parcels/{parcel}', [ParcelController::class, 'update']);
        Route::get('/parcels/{parcel}/tracking', [ParcelController::class, 'tracking']);
        Route::post('/parcels/{parcel}/status-transitions', [ParcelController::class, 'statusTransition']);
        Route::post('/parcels/{parcel}/assignments', [ParcelController::class, 'assign']);
        Route::post('/parcels/{parcel}/images', [ParcelController::class, 'uploadImages']);
        Route::delete('/parcels/{parcel}/images/{image}', [ParcelController::class, 'deleteImage']);

        // Deliveries
        Route::get('/deliveries/my-assignments', [DeliveryController::class, 'myAssignments']);
        Route::get('/deliveries/assignments', [DeliveryController::class, 'index']);
        Route::get('/deliveries/staff-workload', [DeliveryController::class, 'staffWorkload']);
        Route::get('/deliveries/{delivery}', [DeliveryController::class, 'show']);
        Route::post('/deliveries/{delivery}/attempts', [DeliveryController::class, 'recordAttempt']);
        Route::post('/deliveries/{delivery}/proof', [DeliveryController::class, 'uploadProof']);

        // Finance
        Route::get('/finance/payments', [FinanceController::class, 'payments']);
        Route::get('/finance/expenses', [FinanceController::class, 'expenses']);
        Route::post('/finance/expenses', [FinanceController::class, 'storeExpense']);
        Route::patch('/finance/expenses/{expense}/void', [FinanceController::class, 'voidExpense']);
        Route::get('/finance/handovers', [FinanceController::class, 'handovers']);
        Route::post('/finance/handovers', [FinanceController::class, 'submitHandover']);
        Route::patch('/finance/handovers/{handover}/verify', [FinanceController::class, 'verifyHandover']);
        Route::get('/finance/summary', [FinanceController::class, 'financialSummary']);

        // Settings (admin-gated)
        Route::get('/settings', [SettingsController::class, 'index']);
        Route::post('/settings', [SettingsController::class, 'bulkUpdate']);
        Route::put('/settings/{key}', [SettingsController::class, 'update']);
        Route::get('/settings/delivery-areas', [SettingsController::class, 'deliveryAreas']);
        Route::post('/settings/delivery-areas', [SettingsController::class, 'storeDeliveryArea']);
        Route::put('/settings/delivery-areas/{area}', [SettingsController::class, 'updateDeliveryArea']);
        Route::delete('/settings/delivery-areas/{area}', [SettingsController::class, 'destroyDeliveryArea']);
        Route::get('/settings/activity-logs', [SettingsController::class, 'activityLogs']);
    });
});
