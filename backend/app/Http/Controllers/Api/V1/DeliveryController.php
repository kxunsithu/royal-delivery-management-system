<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\DeliveryAssignment;
use App\Models\DeliveryAttempt;
use App\Models\Parcel;
use App\Models\ParcelStatusHistory;
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

        $query = DeliveryAssignment::with(['parcel.receivedBy', 'parcel.activeAssignment.staff', 'parcel.images'])
            ->where('staff_id', $user->id)
            ->when($request->status, function ($q) use ($request) {
                if (in_array($request->status, ['ACTIVE', 'IN_PROGRESS'])) {
                    $q->whereNotIn('status', ['COMPLETED', 'FAILED', 'REASSIGNED']);
                } else {
                    $q->where('status', $request->status);
                }
            })
            ->orderBy('assigned_at', 'desc');

        $assignments = $query->paginate($request->per_page ?? 20);

        // Real counts (always from full dataset, not filtered page)
        $baseQuery = DeliveryAssignment::where('staff_id', $user->id);
        $activeCount    = (clone $baseQuery)->whereNotIn('status', ['COMPLETED', 'FAILED', 'REASSIGNED'])->count();
        $completedCount = (clone $baseQuery)->where('status', 'COMPLETED')->count();
        $totalCount     = (clone $baseQuery)->count();

        return response()->json([
            'data' => $assignments->map(fn($a) => $this->formatAssignment($a)),
            'meta' => [
                'current_page'    => $assignments->currentPage(),
                'last_page'       => $assignments->lastPage(),
                'per_page'        => $assignments->perPage(),
                'total'           => $assignments->total(),
                'active_count'    => $activeCount,
                'completed_count' => $completedCount,
                'total_count'     => $totalCount,
            ],
        ]);
    }

    /**
     * Delivery summary grouped by day or month.
     * GET /deliveries/summary?group_by=day|month&date_from=&date_to=
     */
    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', DeliveryAssignment::class);

        $user = $request->user();
        $staffId = $user->isDeliveryStaff() ? $user->id : $request->input('staff_id');

        $groupBy = $request->input('group_by', 'day'); // day | month

        // Date expression: use delivered_at for DELIVERED parcels, failed_at for FAILED,
        // fallback to updated_at when status matches but specific date field is null,
        // finally fallback to assigned_at for in-transit parcels.
        if ($groupBy === 'month') {
            $periodExpr = "COALESCE(
                strftime('%Y-%m', parcels.delivered_at),
                CASE WHEN parcels.status = 'DELIVERED' THEN strftime('%Y-%m', parcels.updated_at) ELSE NULL END,
                strftime('%Y-%m', parcels.failed_at),
                CASE WHEN parcels.status = 'FAILED' THEN strftime('%Y-%m', parcels.updated_at) ELSE NULL END,
                strftime('%Y-%m', delivery_assignments.assigned_at)
            )";
        } else {
            $periodExpr = "COALESCE(
                DATE(parcels.delivered_at),
                CASE WHEN parcels.status = 'DELIVERED' THEN DATE(parcels.updated_at) ELSE NULL END,
                DATE(parcels.failed_at),
                CASE WHEN parcels.status = 'FAILED' THEN DATE(parcels.updated_at) ELSE NULL END,
                DATE(delivery_assignments.assigned_at)
            )";
        }

        $filterExpr = "COALESCE(
            DATE(parcels.delivered_at),
            CASE WHEN parcels.status = 'DELIVERED' THEN DATE(parcels.updated_at) ELSE NULL END,
            DATE(parcels.failed_at),
            CASE WHEN parcels.status = 'FAILED' THEN DATE(parcels.updated_at) ELSE NULL END,
            DATE(delivery_assignments.assigned_at)
        )";

        $query = DeliveryAssignment::query()
            ->join('parcels', 'parcels.id', '=', 'delivery_assignments.parcel_id')
            ->select([
                DB::raw("$periodExpr as period"),
                DB::raw('COUNT(*) as total_count'),
                DB::raw("SUM(CASE WHEN delivery_assignments.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count"),
                DB::raw("SUM(CASE WHEN delivery_assignments.status = 'FAILED' THEN 1 ELSE 0 END) as failed_count"),
                DB::raw("SUM(CASE WHEN delivery_assignments.status NOT IN ('COMPLETED','FAILED','REASSIGNED') THEN 1 ELSE 0 END) as in_transit_count"),
                // Delivery fee totals by currency (all assignments)
                DB::raw("SUM(CASE WHEN (parcels.currency IS NULL OR parcels.currency = 'MMK') THEN parcels.delivery_fee ELSE 0 END) as fee_mmk"),
                DB::raw("SUM(CASE WHEN parcels.currency = 'THB' THEN parcels.delivery_fee ELSE 0 END) as fee_thb"),
                // COD totals by currency (all assignments with COD)
                DB::raw("SUM(CASE WHEN (parcels.currency IS NULL OR parcels.currency = 'MMK') AND parcels.is_cod = 1 THEN parcels.cod_amount ELSE 0 END) as cod_mmk"),
                DB::raw("SUM(CASE WHEN parcels.currency = 'THB' AND parcels.is_cod = 1 THEN parcels.cod_amount ELSE 0 END) as cod_thb"),
            ])
            ->when($request->date_from, fn($q) => $q->whereRaw("$filterExpr >= ?", [$request->date_from]))
            ->when($request->date_to, fn($q) => $q->whereRaw("$filterExpr <= ?", [$request->date_to]))
            ->when($staffId, fn($q) => $q->where('delivery_assignments.staff_id', $staffId))
            ->when($user->isDeliveryStaff(), fn($q) => $q->whereIn('delivery_assignments.status', ['COMPLETED', 'FAILED']))
            ->groupBy(DB::raw($periodExpr))
            ->orderBy('period', 'desc');

        $rows = $query->get()->map(function ($row) use ($groupBy) {
            $period = $row->period;
            if ($groupBy === 'month') {
                $firstDay = $period . '-01';
                $lastDayDate = (new \DateTime($firstDay))->modify('last day of this month');
                $lastDay = $lastDayDate->format('Y-m-d');
            } else {
                $firstDay = $period;
                $lastDay = $period;
            }
            return [
                'period'          => $period,
                'date_from'       => $firstDay,
                'date_to'         => $lastDay,
                'total_count'     => (int) $row->total_count,
                'completed_count' => (int) $row->completed_count,
                'failed_count'    => (int) $row->failed_count,
                'in_transit_count' => (int) $row->in_transit_count,
                'fee_mmk'         => (float) $row->fee_mmk,
                'fee_thb'         => (float) $row->fee_thb,
                'cod_mmk'         => (float) $row->cod_mmk,
                'cod_thb'         => (float) $row->cod_thb,
            ];
        });

        return response()->json(['data' => $rows]);
    }

    /**
     * All assignments (manager/admin view)
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', DeliveryAssignment::class);

        $user = $request->user();
        $staffId = $user->isDeliveryStaff() ? $user->id : $request->input('staff_id');

        $dateExpr = "COALESCE(
            DATE(parcels.delivered_at),
            CASE WHEN parcels.status = 'DELIVERED' THEN DATE(parcels.updated_at) ELSE NULL END,
            DATE(parcels.failed_at),
            CASE WHEN parcels.status = 'FAILED' THEN DATE(parcels.updated_at) ELSE NULL END,
            DATE(delivery_assignments.assigned_at)
        )";

        $query = DeliveryAssignment::with(['parcel.receivedBy', 'parcel.activeAssignment.staff', 'parcel.images', 'staff', 'assignedBy'])
            ->join('parcels', 'parcels.id', '=', 'delivery_assignments.parcel_id')
            ->select('delivery_assignments.*')
            ->when($staffId, fn($q) => $q->where('delivery_assignments.staff_id', $staffId))
            ->when($user->isDeliveryStaff(), fn($q) => $q->whereIn('delivery_assignments.status', ['COMPLETED', 'FAILED']))
            ->when($request->status, function ($q) use ($request) {
                if (in_array($request->status, ['ACTIVE', 'IN_PROGRESS'])) {
                    $q->whereNotIn('delivery_assignments.status', ['COMPLETED', 'FAILED', 'REASSIGNED']);
                } else {
                    $q->where('delivery_assignments.status', $request->status);
                }
            })
            ->when($request->date_from, fn($q) => $q->whereRaw("$dateExpr >= ?", [$request->date_from]))
            ->when($request->date_to, fn($q) => $q->whereRaw("$dateExpr <= ?", [$request->date_to]))
            ->orderByRaw("$dateExpr desc");

        $assignments = $query->paginate($request->per_page ?? 20);

        // Compute fee/COD totals from the full (unpaginated) dataset for this period
        $totalsQuery = DeliveryAssignment::query()
            ->join('parcels', 'parcels.id', '=', 'delivery_assignments.parcel_id')
            ->when($staffId, fn($q) => $q->where('delivery_assignments.staff_id', $staffId))
            ->when($user->isDeliveryStaff(), fn($q) => $q->whereIn('delivery_assignments.status', ['COMPLETED', 'FAILED']))
            ->when($request->status, function ($q) use ($request) {
                if (in_array($request->status, ['ACTIVE', 'IN_PROGRESS'])) {
                    $q->whereNotIn('delivery_assignments.status', ['COMPLETED', 'FAILED', 'REASSIGNED']);
                } else {
                    $q->where('delivery_assignments.status', $request->status);
                }
            })
            ->when($request->date_from, fn($q) => $q->whereRaw("$dateExpr >= ?", [$request->date_from]))
            ->when($request->date_to, fn($q) => $q->whereRaw("$dateExpr <= ?", [$request->date_to]))
            ->selectRaw("
                SUM(CASE WHEN (parcels.currency IS NULL OR parcels.currency = 'MMK') THEN parcels.delivery_fee ELSE 0 END) as fee_mmk,
                SUM(CASE WHEN parcels.currency = 'THB' THEN parcels.delivery_fee ELSE 0 END) as fee_thb,
                SUM(CASE WHEN (parcels.currency IS NULL OR parcels.currency = 'MMK') AND parcels.is_cod = 1 THEN parcels.cod_amount ELSE 0 END) as cod_mmk,
                SUM(CASE WHEN parcels.currency = 'THB' AND parcels.is_cod = 1 THEN parcels.cod_amount ELSE 0 END) as cod_thb
            ")
            ->first();

        return response()->json([
            'data' => $assignments->map(fn($a) => $this->formatAssignment($a)),
            'meta' => [
                'current_page' => $assignments->currentPage(),
                'last_page'    => $assignments->lastPage(),
                'per_page'     => $assignments->perPage(),
                'total'        => $assignments->total(),
                'fee_mmk'      => (float) ($totalsQuery->fee_mmk ?? 0),
                'fee_thb'      => (float) ($totalsQuery->fee_thb ?? 0),
                'cod_mmk'      => (float) ($totalsQuery->cod_mmk ?? 0),
                'cod_thb'      => (float) ($totalsQuery->cod_thb ?? 0),
            ],
        ]);
    }

    public function show(DeliveryAssignment $delivery): JsonResponse
    {
        $this->authorize('view', $delivery);

        $delivery->load(['parcel.images', 'staff', 'assignedBy', 'deliveryAttempts.proofOfDeliveries']);

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
                'notes' => $validated['notes'] ?? null,
            ]);

            // Update parcel status
            $oldStatus = $parcel->status;
            $newStatus = $validated['result'] === 'DELIVERED' ? 'DELIVERED' : 'FAILED';
            $updateData = ['status' => $newStatus];
            if ($validated['result'] === 'DELIVERED') {
                $updateData['delivered_at'] = $validated['attempted_at'] ?? now();
            } else {
                $updateData['failed_at'] = $validated['attempted_at'] ?? now();
            }
            $parcel->update($updateData);

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

            // Update assignment status
            if ($validated['result'] === 'DELIVERED') {
                $delivery->update(['status' => 'COMPLETED', 'completed_at' => now()]);
            } else {
                $delivery->update(['status' => 'FAILED', 'completed_at' => now()]);
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
     * Upload proof of delivery (supports multiple photos)
     */
    public function uploadProof(Request $request, DeliveryAssignment $delivery): JsonResponse
    {
        $this->authorize('uploadProof', $delivery);

        $validated = $request->validate([
            'delivery_attempt_id' => ['required', 'integer', 'exists:delivery_attempts,id'],
            'type'                => ['required', 'string', Rule::in(['PHOTO', 'SIGNATURE', 'RECIPIENT_NAME'])],
            'file'                => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,heic,heif,pdf', 'max:10240'],
            'files'               => ['nullable', 'array', 'max:5'],
            'files.*'             => ['file', 'mimes:jpg,jpeg,png,webp,heic,heif,pdf', 'max:10240'],
            'notes'               => ['nullable', 'string'],
        ]);

        $proofs = [];

        // Support multiple files via 'files[]' array
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $filePath = $file->store('proof-of-delivery/' . $delivery->parcel_id, 'public');
                $proof = ProofOfDelivery::create([
                    'delivery_attempt_id' => $validated['delivery_attempt_id'],
                    'parcel_id'           => $delivery->parcel_id,
                    'type'                => $validated['type'],
                    'file_path'           => $filePath,
                    'notes'               => $validated['notes'] ?? null,
                ]);
                $proofs[] = [
                    'id'       => $proof->id,
                    'type'     => $proof->type,
                    'file_url' => $proof->file_url,
                    'notes'    => $proof->notes,
                ];
            }
        } elseif ($request->hasFile('file')) {
            // Single file fallback
            $filePath = $request->file('file')->store('proof-of-delivery/' . $delivery->parcel_id, 'public');
            $proof = ProofOfDelivery::create([
                'delivery_attempt_id' => $validated['delivery_attempt_id'],
                'parcel_id'           => $delivery->parcel_id,
                'type'                => $validated['type'],
                'file_path'           => $filePath,
                'notes'               => $validated['notes'] ?? null,
            ]);
            $proofs[] = [
                'id'       => $proof->id,
                'type'     => $proof->type,
                'file_url' => $proof->file_url,
                'notes'    => $proof->notes,
            ];
        }

        return response()->json([
            'data'    => $proofs,
            'message' => count($proofs) . ' proof(s) of delivery uploaded',
        ], 201);
    }

    /**
     * Staff workload summary (manager/admin)
     */
    public function staffWorkload(Request $request): JsonResponse
    {
        $this->authorize('viewWorkload', DeliveryAssignment::class);

        $workload = DeliveryAssignment::query()
            ->selectRaw("staff_id, COUNT(*) as total_assignments,
                          SUM(CASE WHEN status NOT IN ('COMPLETED','FAILED','REASSIGNED') THEN 1 ELSE 0 END) as active,
                          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed")
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
                'sender_name' => $a->parcel->sender_name,
                'sender_phone' => $a->parcel->sender_phone,
                'recipient_name' => $a->parcel->recipient_name,
                'recipient_phone' => $a->parcel->recipient_phone,
                'delivery_address' => $a->parcel->delivery_address,
                'description' => $a->parcel->description,
                'category' => $a->parcel->category,
                'weight' => $a->parcel->weight,
                'notes' => $a->parcel->notes,
                'delivery_fee' => $a->parcel->delivery_fee,
                'cod_amount' => $a->parcel->cod_amount,
                'is_cod' => $a->parcel->is_cod,
                'currency' => $a->parcel->currency ?? 'MMK',
                'status' => $a->parcel->status,
                'condition' => $a->parcel->condition,
                'priority' => $a->parcel->priority,
                'received_at' => $a->parcel->received_at?->toISOString(),
                'received_by' => $a->parcel->relationLoaded('receivedBy') && $a->parcel->receivedBy ? [
                    'id' => $a->parcel->receivedBy->id,
                    'name' => $a->parcel->receivedBy->name,
                ] : null,
                'active_assignment' => $a->parcel->relationLoaded('activeAssignment') && $a->parcel->activeAssignment ? [
                    'id' => $a->parcel->activeAssignment->id,
                    'staff' => $a->parcel->activeAssignment->staff ? [
                        'id' => $a->parcel->activeAssignment->staff->id,
                        'name' => $a->parcel->activeAssignment->staff->name,
                    ] : null,
                    'assigned_at' => $a->parcel->activeAssignment->assigned_at->toISOString(),
                ] : null,
                'created_at' => $a->parcel->created_at?->toISOString(),
                'updated_at' => $a->parcel->updated_at?->toISOString(),
                'delivered_at' => $a->parcel->delivered_at?->toISOString(),
                'failed_at' => $a->parcel->failed_at?->toISOString(),
                'images' => $a->parcel->relationLoaded('images')
                    ? $a->parcel->images->map(fn($img) => [
                        'id'  => $img->id,
                        'url' => $img->url,
                    ])->values()->all()
                    : [],
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
                    'id'             => $da->id,
                    'attempted_at'   => $da->attempted_at->toISOString(),
                    'result'         => $da->result,
                    'failure_reason' => $da->failure_reason,
                    'recipient_name' => $da->recipient_name,
                    'notes'          => $da->notes,
                    'proof_photos'   => $da->relationLoaded('proofOfDeliveries')
                        ? $da->proofOfDeliveries
                            ->where('type', 'PHOTO')
                            ->map(fn($p) => [
                                'id'       => $p->id,
                                'file_url' => $p->file_url,
                            ])->values()->all()
                        : [],
                ]) : [],
        ];
    }
}
