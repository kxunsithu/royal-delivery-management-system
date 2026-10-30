<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = User::with('roles')
            ->when($request->search, fn($q) => $q->where(function ($sq) use ($request) {
                $term = '%' . strtolower($request->search) . '%';
                $sq->whereRaw('LOWER(name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(phone) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(employee_id) LIKE ?', [$term]);
            }))
            ->when($request->role, fn($q) => $q->whereHas('roles', fn($rq) => $rq->where('name', $request->role)))
            ->when($request->is_active !== null, fn($q) => $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN)))
            ->orderBy($request->sort_by ?? 'created_at', $request->sort_dir ?? 'desc');

        $users = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => $users->map(fn($u) => $this->formatUser($u)),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8'],
            'employee_id' => ['nullable', 'string', 'max:50', 'unique:users,employee_id'],
            'role' => ['required', 'string', Rule::in(['admin', 'manager', 'accountant', 'delivery_staff'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'employee_id' => $validated['employee_id'] ?? null,
            'is_active' => true,
        ]);

        $user->assignRole($validated['role']);

        ActivityLog::record('user.created', $user, [], $user->toArray(), "User {$user->name} created");

        return response()->json([
            'data' => $this->formatUser($user->fresh('roles')),
            'message' => 'User created successfully',
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return response()->json([
            'data' => $this->formatUser($user->load('roles')),
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'string', 'min:8'],
            'employee_id' => ['nullable', 'string', 'max:50', Rule::unique('users')->ignore($user->id)],
            'role' => ['sometimes', 'string', Rule::in(['admin', 'manager', 'accountant', 'delivery_staff'])],
        ]);

        $oldValues = $user->toArray();

        // Non-admin users cannot change their own email address
        $authUser = $request->user();
        if (!$authUser->isAdmin() && $authUser->id === $user->id) {
            unset($validated['email']);
        }

        $updateData = array_filter([
            'name' => $validated['name'] ?? null,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'employee_id' => $validated['employee_id'] ?? null,
        ], fn($v) => !is_null($v));

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        if (isset($validated['role'])) {
            // Only admin can change roles, and only to equal or lower roles
            $this->authorize('assignRole', $user);
            $user->syncRoles([$validated['role']]);
        }

        ActivityLog::record('user.updated', $user, $oldValues, $user->fresh()->toArray());

        return response()->json([
            'data' => $this->formatUser($user->fresh('roles')),
            'message' => 'User updated successfully',
        ]);
    }

    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $this->authorize('updateStatus', $user);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        // Prevent deactivating yourself
        if ($request->user()->id === $user->id && !$validated['is_active']) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }

        $user->update(['is_active' => $validated['is_active']]);

        $action = $validated['is_active'] ? 'user.activated' : 'user.deactivated';
        ActivityLog::record($action, $user, [], ['is_active' => $validated['is_active']]);

        return response()->json([
            'data' => $this->formatUser($user->fresh('roles')),
            'message' => $validated['is_active'] ? 'User activated' : 'User deactivated',
        ]);
    }

    /**
     * Upload or replace the user's profile image.
     */
    public function uploadProfileImage(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
        ]);

        if ($user->profile_image) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($user->profile_image);
        }

        $path = $request->file('image')->store('avatars', 'public');
        $user->update(['profile_image' => $path]);

        ActivityLog::record('user.profile_image_uploaded', $user, [], ['path' => $path]);

        return response()->json([
            'data' => $this->formatUser($user->fresh('roles')),
            'message' => 'Profile image uploaded successfully',
        ]);
    }

    /**
     * Remove the user's profile image.
     */
    public function deleteProfileImage(User $user): JsonResponse
    {
        $this->authorize('update', $user);

        if ($user->profile_image) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($user->profile_image);
            $user->update(['profile_image' => null]);
        }

        ActivityLog::record('user.profile_image_removed', $user, [], []);

        return response()->json([
            'data' => $this->formatUser($user->fresh('roles')),
            'message' => 'Profile image removed',
        ]);
    }

    private function formatUser(User $user): array
    {
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
            'updated_at' => $user->updated_at->toISOString(),
        ];
    }
}
