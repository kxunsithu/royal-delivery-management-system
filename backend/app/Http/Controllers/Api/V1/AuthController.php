<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated. Please contact an administrator.',
            ], 403);
        }

        // Update last login timestamp
        $user->update(['last_login_at' => now()]);

        // Log the login
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'user.login',
            'model_type' => User::class,
            'model_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'description' => "User {$user->name} logged in",
        ]);

        // Revoke old tokens and create new one
        $user->tokens()->delete();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => $this->formatUser($user),
            ],
            'message' => 'Login successful',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'user.logout',
            'model_type' => User::class,
            'model_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'description' => "User {$user->name} logged out",
        ]);

        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles');

        return response()->json([
            'data' => $this->formatUser($user),
        ]);
    }

    private function formatUser(User $user): array
    {
        $user->load('roles');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'employee_id' => $user->employee_id,
            'profile_image' => $user->profile_image,
            'profile_image_url' => $user->profile_image_url,
            'is_active' => $user->is_active,
            'role' => $user->roles->first()?->name,
            'role_display' => $user->roles->first()?->display_name,
            'last_login_at' => $user->last_login_at?->toISOString(),
            'created_at' => $user->created_at->toISOString(),
        ];
    }
}
