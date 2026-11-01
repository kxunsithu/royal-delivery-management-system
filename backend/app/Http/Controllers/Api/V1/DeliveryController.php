<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\DeliveryAssignment;
use App\Models\DeliveryAttempt;
use App\Models\Parcel;
use App\Models\ParcelStatusHistory;
use App\Models\Payment;
use App\Models\ProofOfDelivery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DeliveryController extends Controller
{
    /**
     * Delivery staff: get my assigned parcels
     */
    public function myAssignments(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = DeliveryAssignment::with(['parcel.deliveryArea'])
            ->where('staff_id', $user->id)
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->orderBy('assigned_at', 'desc');

        $assignments = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => $assignments->map(fn($a) => $this->formatAssignment($a)),
            'meta' => [
                'current_page' => $assignments->currentPage(),
                'last_page' => $assignments->lastPage(),
                'per_page' => $assignments->perPage(),
                'total' => $assignments->total(),
            ],
        ]);
    }

    /**
     * All assignments (manager/admin view)
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', DeliveryAssignment::class);

        $query = DeliveryAssignment::with(['parcel.deliveryArea', 'staff', 'assignedBy'])
            ->when($request->staff_id, fn($q) => $q->where('staff_id', $request->staff_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->date_from, fn($q) => $q->whereDate('assigned_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('assigned_at', '<=', $request->date_to))
            ->orderBy('assigned_at', 'desc');

        $assignments = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => $assignments->map(fn($a) => $this->formatAssignment($a)),
            'meta' => [
                'current_page' => $assignments->currentPage(),
                'last_page' => $assignments->lastPage(),
                'per_page' => $assignments->perPage(),
                'total' => $assignments->total(),
            ],
        ]);
    }

    public function show(DeliveryAssignment $delivery): JsonResponse
    {
        $this->authorize('view', $delivery);

        $delivery->load(['parcel.deliveryArea', 'staff', 'assignedBy', 'deliveryAttempts.proofOfDeliveries']);

        return response()->json([
            'data' => $this->formatAssignment($delivery),
        ]);
    }

    /**
     * Record a delivery attempt (delivered or failed)
     */
    public function recordAttempt(Request $request, DeliveryAssignment $delivery): JsonResponse
    {
        $this->authorize('recordAttempt', $delivery);

        $validated = $request->validate([
            'result' => ['required', 'string', Rule::in(['DELIVERED', 'FAILED'])],
            'failure_reason' => [
                'nullable',
                'string',
                Rule::in(['RECIPIENT_UNAVAILABLE', 'PHONE_UNREACHABLE', 'WRONG_ADDRESS', 'REFUSED', 'RESCHEDULED', 'OTHER']),
                'required_if:result,FAILED',
            ],
            'recipient_name' => ['nullable', 'string', 'max:255'],
            'recipient_confirmation' => ['nullable', 'string'],
            'delivery_fee_collected' => ['required', 'numeric', 'min:0'],
            'cod_collected' => ['numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'attempted_at' => ['nullable', 'date'],
        ]);

        $parcel = $delivery->parcel;

        DB::beginTransaction();

        try {
            // Create attempt record
            $attempt = DeliveryAttempt::create([
                'assignment_id' => $delivery->id,
                'parcel_id' => $parcel->id,
                'staff_id' => $request->user()->id,
                'attempted_at' => $validated['attempted_at'] ?? now(),
                'result' => $validated['result'],
                'failure_reason' => $validated['failure_reason'] ?? null,
                'recipient_name' => $validated['recipient_name'] ?? null,
                'recipient_confirmation' => $validated['recipient_confirmation'] ?? null,
                'delivery_fee_collected' => $validated['delivery_fee_collected'],
                'cod_collected' => $validated['cod_collected'] ?? 0,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Record payments if money was collected
            if ($validated['delivery_fee_collected'] > 0) {
                Payment::firstOrCreate(
                    ['parcel_id' => $parcel->id, 'payment_type' => 'DELIVERY_FEE'],
                    [
                        'delivery_attempt_id' => $attempt->id,
                        'collected_by_id' => $request->user()->id,
                        'amount' => $validated['delivery_fee_collected'],
                        'collected_at' => $attempt->attempted_at,
                        'status' => 'COLLECTED',
                    ]
                );
            }

            if (($validated['cod_collected'] ?? 0) > 0) {
                Payment::firstOrCreate(
                    ['parcel_id' => $parcel->id, 'payment_type' => 'COD'],
                    [
                        'delivery_attempt_id' => $attempt->id,
                        'collected_by_id' => $request->user()->id,
                        'amount' => $validated['cod_collected'],
                        'collected_at' => $attempt->attempted_at,
                        'status' => 'COLLECTED',
                    ]
                );
            }

            // Update parcel status
            $oldStatus = $parcel->status;
            $newStatus = $validated['result'] === 'DELIVERED' ? 'DELIVERED' : 'FAILED';
            $parcel->update(['status' => $newStatus]);

            ParcelStatusHistory::create([
                'parcel_id' => $parcel->id,
                'from_status' => $oldStatus,
                'to_status' => $newStatus,
                'changed_by_id' => $request->user()->id,
                'reason' => $validated['result'] === 'DELIVERED'
                    ? "Delivered to {$validated['recipient_name']}"
                    : "Delivery failed: " . ($validated['failure_reason'] ?? 'Unknown'),
                'notes' => $validated['notes'] ?? null,
            ]);

            // Update assignment status if delivered
            if ($validated['result'] === 'DELIVERED') {
                $delivery->update(['status' => 'COMPLETED', 'completed_at' => now()]);
            }

            ActivityLog::record('delivery.attempt_recorded', $parcel, ['status' => $oldStatus], [
                'result' => $validated['result'],
                'new_status' => $newStatus,
            ]);

            DB::commit();

            return response()->json([
                'data' => [
                    'attempt_id' => $attempt->id,
                    'result' => $attempt->result,
                    'parcel_status' => $newStatus,
                ],
                'message' => $validated['result'] === 'DELIVERED'
                    ? 'Delivery recorded successfully'
                    : 'Failed delivery attempt recorded',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Upload proof of delivery
     */
    public function uploadProof(Request $request, DeliveryAssignment $delivery): JsonResponse
    {
        $this->authorize('recordAttempt', $delivery);

        $validated = $request->validate([
            'delivery_attempt_id' => ['required', 'integer', 'exists:delivery_attempts,id'],
            'type' => ['required', 'string', Rule::in(['PHOTO', 'SIGNATURE', 'RECIPIENT_NAME'])],
            'file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'notes' => ['nullable', 'string'],
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('proof-of-delivery/' . $delivery->parcel_id, 'public');
        }

        $proof = ProofOfDelivery::create([
            'delivery_attempt_id' => $validated['delivery_attempt_id'],
            'parcel_id' => $delivery->parcel_id,
            'type' => $validated['type'],
            'file_path' => $filePath,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'data' => [
                'id' => $proof->id,
                'type' => $proof->type,
                'file_url' => $proof->file_url,
                'notes' => $proof->notes,
            ],
            'message' => 'Proof of delivery uploaded',
        ], 201);
    }

    /**
     * Staff workload summary (manager/admin)
     */
    public function staffWorkload(Request $request): JsonResponse
    {
        $this->authorize('viewWorkload', DeliveryAssignment::class);

        $workload = DeliveryAssignment::query()
            ->selectRaw('staff_id, COUNT(*) as total_assignments, 
                          SUM(CASE WHEN status = \'ACTIVE\' THEN 1 ELSE 0 END) as active,
                          SUM(CASE WHEN status = \'COMPLETED\' THEN 1 ELSE 0 END) as completed')
            ->with('staff:id,name,email')
            ->when($request->date_from, fn($q) => $q->whereDate('assigned_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('assigned_at', '<=', $request->date_to))
            ->groupBy('staff_id')
            ->get();

        return response()->json([
            'data' => $workload->map(fn($w) => [
                'staff' => $w->staff ? ['id' => $w->staff->id, 'name' => $w->staff->name] : null,
                'total_assignments' => $w->total_assignments,
                'active' => $w->active,
                'completed' => $w->completed,
            ]),
        ]);
    }

    private function formatAssignment(DeliveryAssignment $a): array
    {
        return [
            'id' => $a->id,
            'parcel' => $a->parcel ? [
                'id' => $a->parcel->id,
                'tracking_number' => $a->parcel->tracking_number,
                'recipient_name' => $a->parcel->recipient_name,
                'recipient_phone' => $a->parcel->recipient_phone,
                'delivery_address' => $a->parcel->delivery_address,
                'delivery_area' => $a->parcel->deliveryArea ? [
                    'id' => $a->parcel->deliveryArea->id,
                    'name' => $a->parcel->deliveryArea->name,
                ] : null,
                'status' => $a->parcel->status,
                'delivery_fee' => $a->parcel->delivery_fee,
                'cod_amount' => $a->parcel->cod_amount,
                'is_cod' => $a->parcel->is_cod,
                'priority' => $a->parcel->priority,
            ] : null,
            'staff' => $a->relationLoaded('staff') && $a->staff ? [
                'id' => $a->staff->id,
                'name' => $a->staff->name,
                'phone' => $a->staff->phone,
            ] : null,
            'assigned_by' => $a->relationLoaded('assignedBy') && $a->assignedBy ? [
                'id' => $a->assignedBy->id,
                'name' => $a->assignedBy->name,
            ] : null,
            'status' => $a->status,
            'notes' => $a->notes,
            'assigned_at' => $a->assigned_at->toISOString(),
            'completed_at' => $a->completed_at?->toISOString(),
            'delivery_attempts' => $a->relationLoaded('deliveryAttempts')
                ? $a->deliveryAttempts->map(fn($da) => [
                    'id' => $da->id,
                    'attempted_at' => $da->attempted_at->toISOString(),
                    'result' => $da->result,
                    'failure_reason' => $da->failure_reason,
                    'recipient_name' => $da->recipient_name,
                    'notes' => $da->notes,
                ]) : [],
        ];
    }
}
