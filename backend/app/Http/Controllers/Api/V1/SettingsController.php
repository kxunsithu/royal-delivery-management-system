<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BusinessSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SettingsController extends Controller
{
    // ---- BUSINESS SETTINGS ----

    public function index(): JsonResponse
    {
        $settings = BusinessSetting::orderBy('key')->get();

        return response()->json([
            'data' => $settings->map(fn($s) => [
                'id' => $s->id,
                'key' => $s->key,
                'value' => BusinessSetting::getValue($s->key),
                'type' => $s->type,
                'description' => $s->description,
            ]),
        ]);
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $this->authorize('update', BusinessSetting::class);

        $validated = $request->validate([
            'key'   => ['required', 'string'],
            'value' => ['required'],
        ]);

        $setting = BusinessSetting::where('key', $validated['key'])->first();
        if (! $setting) {
            return response()->json(['message' => "Setting not found"], 404);
        }

        BusinessSetting::setValue($validated['key'], $validated['value']);
        ActivityLog::record('settings.updated', $setting, [], ['value' => $validated['value']]);

        return response()->json(['message' => "Setting updated"]);
    }

    public function update(Request $request, string $key): JsonResponse
    {
        $this->authorize('update', BusinessSetting::class);

        $setting = BusinessSetting::where('key', $key)->firstOrFail();

        $validated = $request->validate([
            'value' => ['required'],
        ]);

        $oldValue = BusinessSetting::getValue($key);
        BusinessSetting::setValue($key, $validated['value']);

        ActivityLog::record('settings.updated', $setting, ['value' => $oldValue], ['value' => $validated['value']]);

        return response()->json(['message' => "Setting '{$key}' updated"]);
    }

    // ---- ACTIVITY LOGS ----

    public function activityLogs(Request $request): JsonResponse
    {
        $this->authorize('viewAuditLogs', ActivityLog::class);

        $query = ActivityLog::with('user:id,name')
            ->when($request->action, fn($q) => $q->where('action', 'like', "%{$request->action}%"))
            ->when($request->user_id, fn($q) => $q->where('user_id', $request->user_id))
            ->when($request->date_from, fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->orderByDesc('created_at');

        $logs = $query->paginate($request->per_page ?? 30);

        return response()->json([
            'data' => $logs->map(fn($l) => [
                'id' => $l->id,
                'action' => $l->action,
                'user' => $l->user ? ['id' => $l->user->id, 'name' => $l->user->name] : null,
                'model_type' => $l->model_type ? class_basename($l->model_type) : null,
                'model_id' => $l->model_id,
                'description' => $l->description,
                'ip_address' => $l->ip_address,
                'created_at' => $l->created_at->toISOString(),
            ]),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
